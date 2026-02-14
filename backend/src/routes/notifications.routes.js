const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO (inline)
// ============================================
async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email plan isAdmin role createdAt');

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erro no auth:', error);
    return res.status(401).json({ message: "Token inválido" });
  }
}

// ============================================
// BUSCAR NOTIFICAÇÕES DO USUÁRIO
// ============================================
router.get("/", auth, async (req, res) => {
  try {
    const { unread } = req.query;

    const where = { userId: req.user._id.toString() };
    
    if (unread === "true") {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// ============================================
// CONTAR NÃO LIDAS
// ============================================
router.get("/unread/count", auth, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user._id.toString(),
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Erro ao contar notificações:", error);
    res.status(500).json({ error: "Erro ao contar notificações" });
  }
});

// ============================================
// MARCAR COMO LIDA
// ============================================
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user._id.toString(),
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notificação não encontrada" });
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });

    res.json(updated);
  } catch (error) {
    console.error("Erro ao marcar como lida:", error);
    res.status(500).json({ error: "Erro ao marcar como lida" });
  }
});

// ============================================
// MARCAR TODAS COMO LIDAS
// ============================================
router.patch("/read-all", auth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user._id.toString(),
        read: false,
      },
      data: { read: true },
    });

    res.json({ message: "Todas as notificações marcadas como lidas" });
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    res.status(500).json({ error: "Erro ao marcar todas como lidas" });
  }
});

// ============================================
// DELETAR NOTIFICAÇÃO
// ============================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user._id.toString(),
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notificação não encontrada" });
    }

    await prisma.notification.delete({
      where: { id: notification.id },
    });

    res.json({ message: "Notificação deletada" });
  } catch (error) {
    console.error("Erro ao deletar notificação:", error);
    res.status(500).json({ error: "Erro ao deletar notificação" });
  }
});

// ============================================
// CRIAR NOTIFICAÇÃO (uso interno/admin)
// ============================================
router.post("/create", auth, async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;

    const targetUserId = userId || req.user._id.toString();

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: type || "info",
        title,
        message,
        link,
        read: false,
      },
    });

    // Emitir via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${targetUserId}`).emit("new_notification", notification);
    }

    res.json(notification);
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    res.status(500).json({ error: "Erro ao criar notificação" });
  }
});

module.exports = router;