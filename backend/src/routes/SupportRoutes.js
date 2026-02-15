const express = require("express");
const router = express.Router();
const supportController = require("../controllers/SupportController");
const authMiddleware = require("../middlewares/authMiddleware");

// ============================================
// ROTAS DE USUÁRIO
// ============================================

// Listar tickets do usuário
router.get("/tickets", authMiddleware, supportController.getUserTickets);

// Buscar ticket específico
router.get("/tickets/:id", authMiddleware, supportController.getTicketById);

// Criar novo ticket
router.post("/tickets", authMiddleware, supportController.createTicket);

// Adicionar mensagem a um ticket
router.post("/tickets/:id/messages", authMiddleware, supportController.addMessage);

// Fechar ticket
router.patch("/tickets/:id/close", authMiddleware, supportController.closeTicket);

// Deletar ticket (Usuário)
router.delete("/tickets/:id", authMiddleware, supportController.deleteTicket);

// Estatísticas dos tickets do usuário
router.get("/stats", authMiddleware, supportController.getTicketStats);

// ============================================
// ROTAS DE ADMIN/CEO
// ============================================

// Listar todos os tickets (Admin)
router.get("/admin/tickets", authMiddleware, supportController.getAllTicketsAdmin);

// Responder ticket (Admin)
router.post("/admin/tickets/:id/reply", authMiddleware, supportController.replyTicketAdmin);

// Atualizar status/prioridade (Admin)
router.patch("/admin/tickets/:id/status", authMiddleware, supportController.updateTicketStatusAdmin);

// Deletar ticket (Admin)
router.delete("/admin/tickets/:id", authMiddleware, supportController.deleteTicketAdmin);

// Estatísticas gerais (Admin)
router.get("/admin/stats", authMiddleware, supportController.getSupportStatsAdmin);

module.exports = router;