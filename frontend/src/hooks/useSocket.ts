import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket(userId?: string, isAdmin: boolean = false) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io(import.meta.env.VITE_WS_URL, {
        transports: ["websocket"],
        withCredentials: true
      });

      console.log("🔌 Conectando ao WebSocket...");

      socket.on("connect", () => {
        console.log("✅ WebSocket conectado!");

        if (isAdmin) {
          socket?.emit("join-admin");
        }

        if (userId) {
          socket?.emit("join", userId);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ WebSocket desconectado");
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Erro na conexão WebSocket:", error);
      });
    }

    socketRef.current = socket;

  }, [userId, isAdmin]);

  return socketRef.current;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}