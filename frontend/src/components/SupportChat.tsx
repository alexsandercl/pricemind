import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { playNotificationSound, showBrowserNotification, requestNotificationPermission } from "../utils/notificationUtils";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";

type Ticket = {
  id: number;
  subject: string;
  status: string;
  category: string;
  priority: string;
  createdAt: string;
  messages: Message[];
};

type Message = {
  id: number;
  senderName: string;
  senderType: string;
  message: string;
  createdAt: string;
};

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔥 WEBSOCKET
  const socket = useSocket(userId, false);

  // Carregar userId do usuário logado
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/profile");
        setUserId(response.data.id);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    loadUser();

    // Solicitar permissão para notificações
    requestNotificationPermission();
  }, []);

  // 🔥 LISTENERS WEBSOCKET
  useEffect(() => {
    if (!socket) return;

    // Nova mensagem recebida
    socket.on('new-message', ({ ticketId, message }) => {
      console.log('📬 Nova mensagem recebida:', ticketId);
      
      // Atualizar ticket ativo se for o mesmo
      if (activeTicket?.id === ticketId && activeTicket) {
        const updatedTicket: Ticket = {
          ...activeTicket,
          messages: [...activeTicket.messages, message]
        };
        setActiveTicket(updatedTicket);
      }
      
      // Atualizar lista de tickets
      loadTickets();
      
      // Tocar som se não estiver visualizando
      if (!isOpen || activeTicket?.id !== ticketId) {
        playNotificationSound();
        showBrowserNotification(
          'Nova mensagem no suporte',
          message.message.substring(0, 50) + '...'
        );
        setUnreadCount(prev => prev + 1);
      }
    });

    // Ticket atualizado (status/prioridade)
    socket.on('ticket-update', ({ ticketId, updates }) => {
      console.log('🔄 Ticket atualizado:', ticketId);
      
      if (activeTicket?.id === ticketId && activeTicket) {
        const updatedTicket: Ticket = { ...activeTicket, ...updates };
        setActiveTicket(updatedTicket);
      }
      
      loadTickets();
    });

    // Ticket deletado
    socket.on('ticket-deleted', ({ ticketId }) => {
      console.log('🗑️ Ticket deletado:', ticketId);
      
      setTickets(tickets.filter(t => t.id !== ticketId));
      
      if (activeTicket?.id === ticketId) {
        setActiveTicket(null);
        setView('list');
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('ticket-update');
      socket.off('ticket-deleted');
    };
  }, [socket, activeTicket, tickets, isOpen]);

  // Buscar tickets ao abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      loadTickets();
    }
  }, [isOpen, isMinimized]);

  // Auto scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [activeTicket?.messages]);

  // Polling para novas mensagens (a cada 10 segundos)
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        checkNewMessages();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTickets = async () => {
    try {
      const response = await api.get("/support/tickets");
      setTickets(response.data);
      
      // Contar não lidos
      const unread = response.data.filter((t: Ticket) => 
        t.status !== "closed" && !t.messages.every((m: Message) => m.senderType === "user")
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    }
  };

  const checkNewMessages = async () => {
    try {
      const response = await api.get("/support/tickets");
      const newTickets = response.data;
      
      // Verificar se há novas mensagens
      const hasNew = newTickets.some((newTicket: Ticket) => 
        !tickets.find(t => t.id === newTicket.id && t.messages.length === newTicket.messages.length)
      );
      
      if (hasNew) {
        setTickets(newTickets);
        // Atualizar contador
        const unread = newTickets.filter((t: Ticket) => 
          t.status !== "closed" && t.messages.some((m: Message) => m.senderType !== "user")
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Erro ao verificar mensagens:", error);
    }
  };

  const createTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/support/tickets", {
        subject: newTicketSubject,
        category: "general",
        priority: "medium",
        message: newTicketMessage,
      });

      setTickets([response.data, ...tickets]);
      setActiveTicket(response.data);
      setView("chat");
      setNewTicketSubject("");
      setNewTicketMessage("");
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeTicket) return;

    setLoading(true);
    try {
      const response = await api.post(`/support/tickets/${activeTicket.id}/messages`, {
        message: newMessage,
      });

      // Atualizar ticket com nova mensagem
      const updatedTicket = {
        ...activeTicket,
        messages: [...activeTicket.messages, response.data],
      };
      
      setActiveTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === activeTicket.id ? updatedTicket : t));
      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (ticket: Ticket) => {
    try {
      const response = await api.get(`/support/tickets/${ticket.id}`);
      setActiveTicket(response.data);
      setView("chat");
    } catch (error) {
      console.error("Erro ao abrir ticket:", error);
    }
  };

  const closeTicket = async () => {
    if (!activeTicket) return;

    try {
      await api.patch(`/support/tickets/${activeTicket.id}/close`);
      
      const updatedTicket = { ...activeTicket, status: "closed" };
      setActiveTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === activeTicket.id ? { ...t, status: "closed" } : t));
      
      // Voltar para lista após 1 segundo
      setTimeout(() => {
        setView("list");
        setActiveTicket(null);
        loadTickets(); // Recarregar tickets
      }, 1000);
    } catch (error) {
      console.error("Erro ao fechar ticket:", error);
      alert("Erro ao marcar como resolvido. Tente novamente.");
    }
  };

  const deleteTicket = async (ticketId: number) => {
    if (!confirm("Tem certeza que deseja deletar este chamado? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await api.delete(`/support/tickets/${ticketId}`);
      
      // Remover da lista
      setTickets(tickets.filter(t => t.id !== ticketId));
      
      // Se estava visualizando, voltar para lista
      if (activeTicket?.id === ticketId) {
        setView("list");
        setActiveTicket(null);
      }
      
      loadTickets(); // Recarregar
    } catch (error) {
      console.error("Erro ao deletar ticket:", error);
      alert("Erro ao deletar chamado. Tente novamente.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case "closed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Aguardando";
      case "in_progress":
        return "Em andamento";
      case "closed":
        return "Resolvido";
      default:
        return status;
    }
  };

  return (
    <>
      {/* BOTÃO FLUTUANTE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-2xl shadow-yellow-500/40 hover:shadow-yellow-500/60 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        >
          <MessageCircle className="w-7 h-7 text-black" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
              {unreadCount}
            </div>
          )}
        </button>
      )}

      {/* POPUP DE CHAT */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl transition-all duration-300 ${
            isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
          }`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-black">Suporte PriceMind</h3>
                <p className="text-xs text-black/70">Estamos aqui para ajudar!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-black/10 rounded-lg transition"
              >
                <Minimize2 className="w-5 h-5 text-black" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                  setView("list");
                  setActiveTicket(null);
                }}
                className="p-2 hover:bg-black/10 rounded-lg transition"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>

          {/* CONTEÚDO */}
          {!isMinimized && (
            <div className="h-[calc(100%-80px)] flex flex-col">
              {/* LISTA DE TICKETS */}
              {view === "list" && (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4">
                    <button
                      onClick={() => setView("new")}
                      className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Novo Chamado
                    </button>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nenhum chamado ainda</p>
                      <p className="text-xs">Clique acima para criar o primeiro!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          onClick={() => openTicket(ticket)}
                          className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-yellow-500/50 transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">{ticket.subject}</h4>
                            {getStatusIcon(ticket.status)}
                          </div>
                          <p className="text-xs text-zinc-400 mb-2">
                            {ticket.messages[ticket.messages.length - 1]?.message.substring(0, 50)}...
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${
                              ticket.status === "open" ? "bg-yellow-500/20 text-yellow-400" :
                              ticket.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                              "bg-green-500/20 text-green-400"
                            }`}>
                              {getStatusText(ticket.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* NOVO TICKET */}
              {view === "new" && (
                <div className="flex-1 overflow-y-auto p-4">
                  <button
                    onClick={() => setView("list")}
                    className="text-sm text-zinc-400 hover:text-yellow-400 mb-4 flex items-center gap-2"
                  >
                    ← Voltar
                  </button>

                  <h3 className="font-bold mb-4">Novo Chamado</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Assunto</label>
                      <input
                        type="text"
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        placeholder="Descreva brevemente o problema"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Mensagem</label>
                      <textarea
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        placeholder="Descreva seu problema em detalhes..."
                        rows={6}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      onClick={createTicket}
                      disabled={loading || !newTicketSubject.trim() || !newTicketMessage.trim()}
                      className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Enviando..." : "Enviar Chamado"}
                    </button>
                  </div>
                </div>
              )}

              {/* CHAT */}
              {view === "chat" && activeTicket && (
                <>
                  {/* Header do Chat */}
                  <div className="p-4 border-b border-zinc-700">
                    <button
                      onClick={() => {
                        setView("list");
                        setActiveTicket(null);
                      }}
                      className="text-sm text-zinc-400 hover:text-yellow-400 mb-2 flex items-center gap-2"
                    >
                      ← Voltar
                    </button>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{activeTicket.subject}</h4>
                        <p className="text-xs text-zinc-400 flex items-center gap-2">
                          {getStatusIcon(activeTicket.status)}
                          {getStatusText(activeTicket.status)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeTicket.status !== "closed" && (
                          <button
                            onClick={closeTicket}
                            disabled={loading}
                            className="text-xs text-green-400 hover:text-green-300 px-3 py-1 border border-green-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {loading ? "Resolvendo..." : "✓ Marcar como resolvido"}
                          </button>
                        )}
                        {activeTicket.status === "closed" && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Resolvido
                          </span>
                        )}
                        <button
                          onClick={() => deleteTicket(activeTicket.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-3 py-1 border border-red-500/30 rounded-lg transition"
                          title="Deletar chamado"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.senderType === "user"
                              ? "bg-yellow-500 text-black rounded-br-none"
                              : "bg-zinc-800 text-white rounded-bl-none"
                          }`}
                        >
                          {message.senderType !== "user" && (
                            <p className="text-xs font-semibold mb-1 text-yellow-400">
                              {message.senderName} {message.senderType === "ceo" ? "👑" : "🛡️"}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderType === "user" ? "text-black/60" : "text-zinc-500"
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de mensagem */}
                  {activeTicket.status !== "closed" && (
                    <div className="p-4 border-t border-zinc-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={loading || !newMessage.trim()}
                          className="px-4 py-3 bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 transition disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}