const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Inicializa o servidor Socket.io
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // 🆕 AUTENTICAÇÃO COM JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      console.log('⚠️ Socket sem token');
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      console.log('✅ Socket autenticado:', decoded.id);
      next();
    } catch (error) {
      console.error('❌ Token inválido no socket');
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ Cliente conectado:', socket.id);

    // 🆕 AUTO-JOIN: Usuário entra automaticamente na sua room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
      console.log(`👤 Usuário ${socket.userId} entrou na sala user_${socket.userId}`);
    }

    // Usuario se identifica com seu ID (fallback se não tiver token)
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      socket.join(`user_${userId}`); // 🆕 Suporte para ambos os formatos
      console.log(`👤 Usuário ${userId} entrou nas salas`);
    });

    // Admin entra na sala geral
    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log('🛡️ Admin entrou na sala');
    });

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado:', socket.id);
    });
  });

  return io;
}

/**
 * Emite evento de novo ticket
 */
function emitNewTicket(ticket) {
  if (!io) return;
  
  // Notifica admins
  io.to('admin-room').emit('new-ticket', ticket);
  console.log('📬 Notificação de novo ticket enviada aos admins');
}

/**
 * Emite evento de nova mensagem
 */
function emitNewMessage(ticketId, message, userId) {
  if (!io) return;
  
  // Notifica o usuário dono do ticket (ambos formatos)
  io.to(`user:${userId}`).emit('new-message', { ticketId, message });
  io.to(`user_${userId}`).emit('new-message', { ticketId, message });
  
  // Notifica admins
  io.to('admin-room').emit('new-message', { ticketId, message });
  
  console.log(`💬 Notificação de nova mensagem enviada (ticket #${ticketId})`);
}

/**
 * Emite evento de atualização de ticket
 */
function emitTicketUpdate(ticketId, updates, userId) {
  if (!io) return;
  
  // Notifica o usuário dono do ticket (ambos formatos)
  io.to(`user:${userId}`).emit('ticket-update', { ticketId, updates });
  io.to(`user_${userId}`).emit('ticket-update', { ticketId, updates });
  
  // Notifica admins
  io.to('admin-room').emit('ticket-update', { ticketId, updates });
  
  console.log(`🔄 Notificação de atualização enviada (ticket #${ticketId})`);
}

/**
 * Emite evento de ticket deletado
 */
function emitTicketDeleted(ticketId, userId) {
  if (!io) return;
  
  // Notifica o usuário (ambos formatos)
  io.to(`user:${userId}`).emit('ticket-deleted', { ticketId });
  io.to(`user_${userId}`).emit('ticket-deleted', { ticketId });
  
  // Notifica admins
  io.to('admin-room').emit('ticket-deleted', { ticketId });
  
  console.log(`🗑️ Notificação de ticket deletado enviada (ticket #${ticketId})`);
}

/**
 * 🆕 GETTER DO IO (para usar em outros lugares)
 */
function getIO() {
  return io;
}

module.exports = {
  initSocket,
  emitNewTicket,
  emitNewMessage,
  emitTicketUpdate,
  emitTicketDeleted,
  getIO
};