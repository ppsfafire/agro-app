const express = require('express');
const bcrypt = require('bcryptjs');
const { run, get } = require('../database/database');

const router = express.Router();

// Buscar perfil do usuário logado
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await get(`
      SELECT id, name, email, phone, address, is_producer, created_at
      FROM users WHERE id = ?
    `, [userId]);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil do usuário
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, address } = req.body;

    // Validações
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Atualizar usuário
    await run(`
      UPDATE users 
      SET name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, phone || null, address || null, userId]);

    // Buscar usuário atualizado
    const user = await get(`
      SELECT id, name, email, phone, address, is_producer, created_at
      FROM users WHERE id = ?
    `, [userId]);

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alterar senha
router.put('/change-password', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Validações
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário atual
    const user = await get('SELECT password FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedNewPassword, userId]);

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar estatísticas do usuário
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar se é produtor
    const user = await get('SELECT is_producer FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    let stats = {};

    if (user.is_producer) {
      // Estatísticas para produtores
      const productCount = await get('SELECT COUNT(*) as count FROM products WHERE producer_id = ? AND is_available = 1', [userId]);
      const totalSales = await get('SELECT SUM(oi.total_price) as total FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE p.producer_id = ?', [userId]);
      const orderCount = await get(`
        SELECT COUNT(DISTINCT o.id) as count 
        FROM orders o 
        JOIN order_items oi ON o.id = oi.order_id 
        JOIN products p ON oi.product_id = p.id 
        WHERE p.producer_id = ?
      `, [userId]);

      stats = {
        totalProducts: productCount.count || 0,
        totalSales: totalSales.total || 0,
        totalOrders: orderCount.count || 0
      };
    } else {
      // Estatísticas para consumidores
      const orderCount = await get('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [userId]);
      const totalSpent = await get('SELECT SUM(total_amount) as total FROM orders WHERE user_id = ?', [userId]);
      const favoriteCategory = await get(`
        SELECT p.category, COUNT(*) as count
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ?
        GROUP BY p.category
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);

      stats = {
        totalOrders: orderCount.count || 0,
        totalSpent: totalSpent.total || 0,
        favoriteCategory: favoriteCategory?.category || 'Nenhuma'
      };
    }

    res.json({ stats });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar produtos do produtor (se for produtor)
router.get('/my-products', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verificar se é produtor
    const user = await get('SELECT is_producer FROM users WHERE id = ?', [userId]);
    if (!user || !user.is_producer) {
      return res.status(403).json({ error: 'Acesso negado. Apenas produtores podem ver seus produtos.' });
    }

    const products = await all(`
      SELECT * FROM products 
      WHERE producer_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    res.json({ products });

  } catch (error) {
    console.error('Erro ao buscar produtos do produtor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 