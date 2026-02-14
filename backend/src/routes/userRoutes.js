const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/User");

// GET /api/users/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email plan"
    );

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

module.exports = router;
