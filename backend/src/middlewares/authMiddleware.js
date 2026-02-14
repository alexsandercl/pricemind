const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 BUSCAR USUÁRIO DO MONGODB COM TODOS OS CAMPOS
    const user = await User.findById(decoded.id).select(
      'name email plan isAdmin role createdAt'  // 🔥 INCLUIR isAdmin e role
    );

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    console.log('🔍 authMiddleware - User do MongoDB:', {
      id: user._id,
      email: user.email,
      plan: user.plan,
      isAdmin: user.isAdmin,
      role: user.role
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erro no authMiddleware:', error);
    return res.status(401).json({ message: "Token inválido" });
  }
};