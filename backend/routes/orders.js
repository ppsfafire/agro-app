const express = require('express');
const { run, get, all } = require('../database/database');

const router = express.Router();

// Criar pedido
router.post('/', async (req, res) => {
  try {
    const { items, delivery_address, delivery_date, notes } = req.body;
    const userId = req.user.userId;

    // Validações
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Itens do pedido são obrigatórios' });
    }

    if (!delivery_address) {
      return res.status(400).json({ error: 'Endereço de entrega é obrigatório' });
    }

    // Calcular total do pedido
    let totalAmount = 0;
    for (const item of items) {
      const product = await get('SELECT price, stock_quantity FROM products WHERE id = ? AND is_available = 1', [item.product_id]);
      if (!product) {
        return res.status(400).json({ error: `Produto ${item.product_id} não encontrado` });
      }
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para o produto ${item.product_id}` });
      }
      totalAmount += product.price * item.quantity;
    }

    // Criar pedido
    const orderResult = await run(`
      INSERT INTO orders (user_id, total_amount, delivery_address, delivery_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, totalAmount, delivery_address, delivery_date || null, notes || null]);

    // Inserir itens do pedido
    for (const item of items) {
      const product = await get('SELECT price FROM products WHERE id = ?', [item.product_id]);
      const totalPrice = product.price * item.quantity;

      await run(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `, [orderResult.id, item.product_id, item.quantity, product.price, totalPrice]);

      // Atualizar estoque
      await run(`
        UPDATE products 
        SET stock_quantity = stock_quantity - ? 
        WHERE id = ?
      `, [item.quantity, item.product_id]);
    }

    // Buscar pedido criado com itens
    const order = await get(`
      SELECT o.*, u.name as user_name, u.phone as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderResult.id]);

    const orderItems = await all(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderResult.id]);

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar pedidos do usuário
router.get('/my-orders', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    let sql = `
      SELECT o.*, u.name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
    `;
    let params = [userId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const orders = await all(sql, params);

    // Buscar itens para cada pedido
    for (const order of orders) {
      order.items = await all(`
        SELECT oi.*, p.name as product_name, p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
    }

    res.json({ orders });

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await get(`
      SELECT o.*, u.name as user_name, u.phone as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.user_id = ?
    `, [id, userId]);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const items = await all(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    res.json({
      order: {
        ...order,
        items
      }
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status do pedido (apenas produtores)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Verificar se o pedido existe
    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Atualizar status
    await run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    res.json({ message: 'Status do pedido atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar pedidos para produtores (pedidos dos seus produtos)
router.get('/producer/orders', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    // Verificar se é produtor
    const user = await get('SELECT is_producer FROM users WHERE id = ?', [userId]);
    if (!user || !user.is_producer) {
      return res.status(403).json({ error: 'Acesso negado. Apenas produtores podem ver esta lista.' });
    }

    let sql = `
      SELECT DISTINCT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE p.producer_id = ?
    `;
    let params = [userId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const orders = await all(sql, params);

    // Buscar itens para cada pedido
    for (const order of orders) {
      order.items = await all(`
        SELECT oi.*, p.name as product_name, p.image_url, p.producer_id
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ? AND p.producer_id = ?
      `, [order.id, userId]);
    }

    res.json({ orders });

  } catch (error) {
    console.error('Erro ao buscar pedidos do produtor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 