const User = require('../models/User');

/**
 * Middleware para verificar se usuário é admin
 * Usar DEPOIS do authMiddleware
 * 🔥 CORRIGIDO: Busca isAdmin do MongoDB (req.user)
 */
module.exports = async (req, res, next) => {
  try {
    // 🔥 req.user JÁ VEM DO MONGODB (authMiddleware)
    // Então basta verificar req.user.isAdmin
    
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ 
        message: 'Acesso negado. Apenas administradores.' 
      });
    }

    console.log('✅ adminMiddleware - Usuário é admin:', {
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      role: req.user.role
    });

    // Continuar para próxima rota
    next();
  } catch (error) {
    console.error('Erro no middleware admin:', error);
    return res.status(500).json({ 
      message: 'Erro ao verificar permissões' 
    });
  }
};