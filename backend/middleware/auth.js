const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'agrofamilia-secret-key');
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware; 