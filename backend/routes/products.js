const express = require('express');
const { run, get, all } = require('../database/database');

const router = express.Router();

// Middleware para verificar se é produtor
const isProducer = async (req, res, next) => {
  try {
    const user = await get('SELECT is_producer FROM users WHERE id = ?', [req.user.userId]);
    if (!user || !user.is_producer) {
      return res.status(403).json({ error: 'Acesso negado. Apenas produtores podem realizar esta ação.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const { category, search, producer_id } = req.query;
    
    let sql = `
      SELECT p.*, u.name as producer_name 
      FROM products p 
      LEFT JOIN users u ON p.producer_id = u.id 
      WHERE p.is_available = 1
    `;
    let params = [];

    // Filtros
    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (producer_id) {
      sql += ' AND p.producer_id = ?';
      params.push(producer_id);
    }

    sql += ' ORDER BY p.created_at DESC';

    const products = await all(sql, params);
    
    res.json({
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await get(`
      SELECT p.*, u.name as producer_name, u.phone as producer_phone
      FROM products p 
      LEFT JOIN users u ON p.producer_id = u.id 
      WHERE p.id = ? AND p.is_available = 1
    `, [id]);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ product });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar produto (apenas produtores)
router.post('/', isProducer, async (req, res) => {
  try {
    const { name, description, price, category, unit, stock_quantity, image_url } = req.body;

    // Validações
    if (!name || !price) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'Preço deve ser maior que zero' });
    }

    // Inserir produto
    const result = await run(`
      INSERT INTO products (name, description, price, category, unit, stock_quantity, image_url, producer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description || null, price, category || null, unit || 'kg', stock_quantity || 0, image_url || null, req.user.userId]);

    // Buscar produto criado
    const product = await get('SELECT * FROM products WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar produto (apenas o produtor dono)
router.put('/:id', isProducer, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, unit, stock_quantity, image_url, is_available } = req.body;

    // Verificar se o produto pertence ao produtor
    const product = await get('SELECT producer_id FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (product.producer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Você só pode editar seus próprios produtos' });
    }

    // Atualizar produto
    await run(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, category = ?, unit = ?, 
          stock_quantity = ?, image_url = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, price, category, unit, stock_quantity, image_url, is_available, id]);

    // Buscar produto atualizado
    const updatedProduct = await get('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      message: 'Produto atualizado com sucesso',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar produto (apenas o produtor dono)
router.delete('/:id', isProducer, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o produto pertence ao produtor
    const product = await get('SELECT producer_id FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (product.producer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Você só pode deletar seus próprios produtos' });
    }

    // Deletar produto (soft delete)
    await run('UPDATE products SET is_available = 0 WHERE id = ?', [id]);

    res.json({ message: 'Produto removido com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar categorias
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await all('SELECT * FROM categories ORDER BY name');
    res.json({ categories });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 