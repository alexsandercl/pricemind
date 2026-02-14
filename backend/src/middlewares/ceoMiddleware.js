const { prisma } = require('../lib/prisma');
const User = require('../models/User');

/**
 * Middleware para verificar se usuário é CEO
 * Usar DEPOIS do authMiddleware
 */
module.exports = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Buscar role do MongoDB
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'ceo') {
      return res.status(403).json({ 
        message: 'Acesso negado. Apenas CEO pode realizar esta ação.' 
      });
    }

    // Adicionar info do CEO no request
    req.isCEO = true;

    next();
  } catch (error) {
    console.error('Erro no middleware CEO:', error);
    return res.status(500).json({ 
      message: 'Erro ao verificar permissões' 
    });
  }
};