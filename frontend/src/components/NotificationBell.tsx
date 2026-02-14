import { useState, useEffect } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { api } from "../services/api";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: number;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    setupWebSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  function setupWebSocket() {
    const token = localStorage.getItem("token");
    const newSocket = io("http://localhost:5000", {
      auth: { token },
    });

    newSocket.on("new_notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Som de notificação
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    });

    setSocket(newSocket);
  }

  async function loadNotifications() {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  }

  async function loadUnreadCount() {
    try {
      const response = await api.get("/notifications/unread/count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Erro ao carregar contador:", error);
    }
  }

  async function markAsRead(id: number) {
    try {
      await api.patch(`/notifications/${id}/read`);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas:", error);
    }
  }

  async function deleteNotification(id: number) {
    try {
      await api.delete(`/notifications/${id}`);
      
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      
      const wasUnread = notifications.find((n) => n.id === id && !n.read);
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  }

  function getTimeAgo(date: string) {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return "Agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
              <h3 className="font-bold text-white">Notificações</h3>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-zinc-800/50 transition-colors ${
                        !notification.read ? "bg-yellow-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="text-2xl flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={`text-sm font-semibold ${
                                notification.read ? "text-zinc-400" : "text-white"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            
                            <span className="text-xs text-zinc-500 flex-shrink-0">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 mb-2">
                            {notification.message}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Marcar como lida
                              </button>
                            )}

                            {notification.link && (
                              <a
                                href={notification.link}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Ver
                              </a>
                            )}

                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                              Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-zinc-700 text-center">
                <a
                  href="/notifications"
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Ver todas as notificações →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}