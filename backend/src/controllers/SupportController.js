const { prisma } = require("../lib/prisma");
const { 
  emitNewTicket, 
  emitNewMessage, 
  emitTicketUpdate, 
  emitTicketDeleted,
  getIO
} = require('../socket');

/**
 * GET /support/tickets
 * Lista todos os tickets do usuário
 */
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    console.log(`📋 ${tickets.length} tickets encontrados para usuário ${userId}`);

    return res.json(tickets);
  } catch (error) {
    console.error('❌ Erro ao buscar tickets:', error);
    return res.status(500).json({
      error: "Erro ao buscar tickets",
    });
  }
};

/**
 * GET /support/tickets/:id
 * Busca um ticket específico com suas mensagens
 */
exports.getTicketById = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const ticketId = parseInt(req.params.id);

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado",
      });
    }

    // Marcar como lido se houver mensagens não lidas
    if (!ticket.isRead) {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { isRead: true },
      });
    }

    return res.json(ticket);
  } catch (error) {
    console.error('❌ Erro ao buscar ticket:', error);
    return res.status(500).json({
      error: "Erro ao buscar ticket",
    });
  }
};

/**
 * POST /support/tickets
 * Cria um novo ticket de suporte
 */
exports.createTicket = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { subject, category, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        error: "Assunto e mensagem são obrigatórios",
      });
    }

    // Criar ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        userName: req.user.name,
        userEmail: req.user.email,
        subject,
        category: category || "general",
        priority: priority || "medium",
        status: "open",
        isRead: false,
      },
    });

    // Criar primeira mensagem
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderName: req.user.name,
        senderType: "user",
        message: message,
      },
    });

    console.log(`✅ Ticket #${ticket.id} criado por ${req.user.name}`);

    // Buscar ticket completo com mensagens
    const fullTicket = await prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // 🔥 EMITIR EVENTO WEBSOCKET
    emitNewTicket(fullTicket);

    return res.status(201).json(fullTicket);
  } catch (error) {
    console.error('❌ Erro ao criar ticket:', error);
    return res.status(500).json({
      error: "Erro ao criar ticket",
    });
  }
};

/**
 * POST /support/tickets/:id/messages
 * Adiciona uma mensagem a um ticket existente
 */
exports.addMessage = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const ticketId = parseInt(req.params.id);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Mensagem é obrigatória",
      });
    }

    // Verificar se o ticket pertence ao usuário
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: userId,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado",
      });
    }

    // Criar mensagem
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: ticketId,
        senderId: userId,
        senderName: req.user.name,
        senderType: "user",
        message: message,
      },
    });

    // Atualizar ticket
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "open",
        isRead: false,
        updatedAt: new Date(),
      },
    });

    console.log(`💬 Nova mensagem no ticket #${ticketId}`);

    // 🔥 EMITIR EVENTO WEBSOCKET
    emitNewMessage(ticketId, newMessage, userId);

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('❌ Erro ao adicionar mensagem:', error);
    return res.status(500).json({
      error: "Erro ao adicionar mensagem",
    });
  }
};

/**
 * PATCH /support/tickets/:id/close
 * Fecha um ticket
 */
exports.closeTicket = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const ticketId = parseInt(req.params.id);

    // Verificar se o ticket pertence ao usuário
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId: userId,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado",
      });
    }

    // Fechar ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    console.log(`✅ Ticket #${ticketId} fechado pelo usuário`);

    return res.json(updatedTicket);
  } catch (error) {
    console.error('❌ Erro ao fechar ticket:', error);
    return res.status(500).json({
      error: "Erro ao fechar ticket",
    });
  }
};

/**
 * GET /support/tickets/stats
 * Estatísticas dos tickets do usuário
 */
exports.getTicketStats = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const [total, open, inProgress, closed] = await Promise.all([
      prisma.supportTicket.count({ where: { userId } }),
      prisma.supportTicket.count({ where: { userId, status: 'open' } }),
      prisma.supportTicket.count({ where: { userId, status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { userId, status: 'closed' } }),
    ]);

    return res.json({
      total,
      open,
      inProgress,
      closed,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      error: "Erro ao buscar estatísticas",
    });
  }
};

// ============================================
// FUNÇÕES ADMIN
// ============================================

/**
 * GET /support/admin/tickets
 * Lista todos os tickets (Admin/CEO)
 */
exports.getAllTicketsAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.role !== 'ceo') {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }

    const { status, priority } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return res.json(tickets);
  } catch (error) {
    console.error('❌ Erro ao buscar tickets (admin):', error);
    return res.status(500).json({
      error: "Erro ao buscar tickets",
    });
  }
};

/**
 * POST /support/admin/tickets/:id/reply
 * Admin responde um ticket
 * 🆕 COM NOTIFICAÇÃO
 */
exports.replyTicketAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.role !== 'ceo') {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }

    const ticketId = parseInt(req.params.id);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Mensagem é obrigatória",
      });
    }

    // Verificar se ticket existe
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado",
      });
    }

    // Criar mensagem do admin
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId: ticketId,
        senderId: req.user._id.toString(),
        senderName: req.user.name,
        senderType: req.user.role === 'ceo' ? 'ceo' : 'admin',
        message: message,
      },
    });

    // Atualizar status do ticket
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "in_progress",
        isRead: false,
        updatedAt: new Date(),
      },
    });

    console.log(`💬 Admin respondeu ticket #${ticketId}`);

    // 🔥 EMITIR EVENTO WEBSOCKET
    emitNewMessage(ticketId, newMessage, ticket.userId);

    // 🆕 CRIAR NOTIFICAÇÃO
    const adminTitle = req.user.role === 'ceo' ? 'CEO' : 'Admin';
    
    try {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: "info",
          title: "💬 Nova Resposta no Suporte",
          message: `${adminTitle} ${req.user.name} respondeu: "${ticket.subject}"`,
          link: `/support`,
        },
      });

      const io = req.app?.get?.("io") || getIO();
      if (io) {
        io.to(`user_${ticket.userId}`).emit("new_notification", {
          type: "info",
          title: "💬 Nova Resposta no Suporte",
          message: `${adminTitle} ${req.user.name} respondeu: "${ticket.subject}"`,
        });
      }

      console.log(`🔔 Notificação enviada para usuário ${ticket.userId}`);
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificação:', notifError);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('❌ Erro ao responder ticket (admin):', error);
    return res.status(500).json({
      error: "Erro ao responder ticket",
    });
  }
};

/**
 * PATCH /support/admin/tickets/:id/status
 * Admin atualiza status do ticket
 */
exports.updateTicketStatusAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.role !== 'ceo') {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }

    const ticketId = parseInt(req.params.id);
    const { status, priority } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (status === 'closed') updateData.closedAt = new Date();

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    console.log(`✅ Ticket #${ticketId} atualizado pelo admin`);

    // 🔥 EMITIR EVENTO WEBSOCKET
    emitTicketUpdate(ticketId, updateData, updatedTicket.userId);

    return res.json(updatedTicket);
  } catch (error) {
    console.error('❌ Erro ao atualizar ticket (admin):', error);
    return res.status(500).json({
      error: "Erro ao atualizar ticket",
    });
  }
};

/**
 * GET /support/admin/stats
 * Estatísticas gerais de suporte (Admin/CEO)
 */
exports.getSupportStatsAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.role !== 'ceo') {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }

    const [total, open, inProgress, closed, highPriority] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'open' } }),
      prisma.supportTicket.count({ where: { status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { status: 'closed' } }),
      prisma.supportTicket.count({ where: { priority: 'high' } }),
    ]);

    return res.json({
      total,
      open,
      inProgress,
      closed,
      highPriority,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas (admin):', error);
    return res.status(500).json({
      error: "Erro ao buscar estatísticas",
    });
  }
};

/**
 * DELETE /support/tickets/:id
 * Usuário deleta seu próprio ticket
 */
exports.deleteTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const userId = req.user._id.toString();

    // Verificar se ticket existe e pertence ao usuário
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado",
      });
    }

    if (ticket.userId !== userId) {
      return res.status(403).json({
        error: "Você não pode deletar este ticket",
      });
    }

    // Deletar mensagens primeiro (cascade)
    await prisma.supportMessage.deleteMany({
      where: { ticketId: ticketId },
    });

    // Deletar ticket
    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    console.log(`🗑️ Ticket #${ticketId} deletado por ${req.user.name}`);

    // 🔥 EMITIR EVENTO WEBSOCKET
    emitTicketDeleted(ticketId, userId);

    return res.json({ message: "Ticket deletado com sucesso" });
  } catch (error) {
    console.error('❌ Erro ao deletar ticket:', error);
    return res.status(500).json({
      error: "Erro ao deletar ticket",
    });
  }
};

/**
 * DELETE /support/admin/tickets/:id
 * Admin deleta qualquer ticket
 */
exports.deleteTicketAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.role !== 'ceo') {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }

    const ticketId = parseInt(req.params.id);

    // Verificar se ticket existe
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado",
      });
    }

    // Deletar mensagens primeiro (cascade)
    await prisma.supportMessage.deleteMany({
      where: { ticketId: ticketId },
    });

    // Deletar ticket
    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    console.log(`🗑️ Admin deletou ticket #${ticketId}`);

    // 🔥 EMITIR EVENTO WEBSOCKET
    emitTicketDeleted(ticketId, ticket.userId);

    return res.json({ message: "Ticket deletado com sucesso" });
  } catch (error) {
    console.error('❌ Erro ao deletar ticket (admin):', error);
    return res.status(500).json({
      error: "Erro ao deletar ticket",
    });
  }
};