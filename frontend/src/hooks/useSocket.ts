import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(userId?: string, isAdmin: boolean = false) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Só conecta uma vez
    if (!socket) {
      socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      console.log('🔌 Conectando ao WebSocket...');

      socket.on('connect', () => {
        console.log('✅ WebSocket conectado!');
        
        // Se é admin, entra na sala de admins
        if (isAdmin) {
          socket?.emit('join-admin');
        }
        
        // Se tem userId, entra na sala do usuário
        if (userId) {
          socket?.emit('join', userId);
        }
      });

      socket.on('disconnect', () => {
        console.log('❌ WebSocket desconectado');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Erro na conexão WebSocket:', error);
      });
    }

    socketRef.current = socket;

    return () => {
      // NÃO desconectar aqui, mantém conexão ativa
    };
  }, [userId, isAdmin]);

  return socketRef.current;
}

// Função para desconectar (opcional)
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}