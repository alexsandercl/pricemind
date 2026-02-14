import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { playNotificationSound, showBrowserNotification } from "../utils/notificationUtils";
import { 
  MessageCircle, 
  Send, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Tag,
  TrendingUp,
  X
} from "lucide-react";

type Ticket = {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: string;
  category: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages: Message[];
};

type Message = {
  id: number;
  senderName: string;
  senderType: string;
  message: string;
  createdAt: string;
};

type Stats = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  highPriority: number;
};

export default function AdminSupport({ onBack }: { onBack: () => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔥 WEBSOCKET
  const socket = useSocket(undefined, true); // isAdmin = true

  // 🔥 LISTENERS WEBSOCKET
  useEffect(() => {
    if (!socket) return;

    // Novo ticket criado
    socket.on('new-ticket', (ticket) => {
      console.log('📬 Novo ticket recebido:', ticket.id);
      setTickets(prev => [ticket, ...prev]);
      loadStats();
      playNotificationSound();
      showBrowserNotification('Novo ticket de suporte', ticket.subject);
    });

    // Nova mensagem
    socket.on('new-message', ({ ticketId, message }) => {
      console.log('📬 Nova mensagem recebida:', ticketId);
      
      if (activeTicket?.id === ticketId && activeTicket) {
        const updatedTicket: Ticket = {
          ...activeTicket,
          messages: [...activeTicket.messages, message]
        };
        setActiveTicket(updatedTicket);
      }
      
      loadTickets();
      playNotificationSound();
    });

    // Ticket atualizado
    socket.on('ticket-update', ({ ticketId, updates }) => {
      console.log('🔄 Ticket atualizado:', ticketId);
      
      if (activeTicket?.id === ticketId && activeTicket) {
        const updatedTicket: Ticket = { ...activeTicket, ...updates };
        setActiveTicket(updatedTicket);
      }
      
      loadTickets();
      loadStats();
    });

    // Ticket deletado
    socket.on('ticket-deleted', ({ ticketId }) => {
      console.log('🗑️ Ticket deletado:', ticketId);
      
      setTickets(tickets.filter(t => t.id !== ticketId));
      
      if (activeTicket?.id === ticketId) {
        setActiveTicket(null);
      }
      
      loadStats();
    });

    return () => {
      socket.off('new-ticket');
      socket.off('new-message');
      socket.off('ticket-update');
      socket.off('ticket-deleted');
    };
  }, [socket, activeTicket, tickets]);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    scrollToBottom();
  }, [activeTicket?.messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await loadTickets();
      await loadStats();
      
      // Se tiver um ticket ativo, recarregar ele também
      if (activeTicket) {
        try {
          const response = await api.get("/support/admin/tickets");
          const updatedTicket = response.data.find((t: Ticket) => t.id === activeTicket.id);
          
          if (updatedTicket && updatedTicket.messages.length !== activeTicket.messages.length) {
            // Só atualiza se tiver mensagens novas
            setActiveTicket(updatedTicket);
          }
        } catch (error) {
          console.error("Erro ao atualizar ticket ativo:", error);
        }
      }
    }, 15000); // A cada 15 segundos
    
    return () => clearInterval(interval);
  }, [filterStatus, filterPriority, activeTicket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterPriority !== "all") params.append("priority", filterPriority);

      const response = await api.get(`/support/admin/tickets?${params.toString()}`);
      setTickets(response.data);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/support/admin/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    }
  };

  const openTicket = async (ticket: Ticket) => {
    try {
      // Buscar todos os tickets atualizados para pegar as mensagens mais recentes
      const response = await api.get("/support/admin/tickets");
      const updatedTicket = response.data.find((t: Ticket) => t.id === ticket.id);
      
      if (updatedTicket) {
        setActiveTicket(updatedTicket);
        // Atualizar também a lista de tickets
        setTickets(response.data);
      } else {
        setActiveTicket(ticket);
      }
    } catch (error) {
      console.error("Erro ao abrir ticket:", error);
      // Fallback: usar o ticket que já temos
      setActiveTicket(ticket);
    }
  };

  const sendReply = async () => {
    if (!newMessage.trim() || !activeTicket) return;

    setLoading(true);
    try {
      const response = await api.post(`/support/admin/tickets/${activeTicket.id}/reply`, {
        message: newMessage,
      });

      // Recarregar ticket completo do servidor
      const ticketResponse = await api.get(`/support/admin/tickets`);
      const updatedTicketFromServer = ticketResponse.data.find((t: Ticket) => t.id === activeTicket.id);

      if (updatedTicketFromServer) {
        setActiveTicket(updatedTicketFromServer);
        setTickets(tickets.map(t => t.id === activeTicket.id ? updatedTicketFromServer : t));
      }

      setNewMessage("");
      loadStats(); // Atualizar stats
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (ticketId: number, status: string) => {
    try {
      await api.patch(`/support/admin/tickets/${ticketId}/status`, { status });
      
      const updatedTickets = tickets.map(t => 
        t.id === ticketId ? { ...t, status } : t
      );
      setTickets(updatedTickets);
      
      if (activeTicket?.id === ticketId) {
        setActiveTicket({ ...activeTicket, status });
      }

      loadStats();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const updatePriority = async (ticketId: number, priority: string) => {
    try {
      await api.patch(`/support/admin/tickets/${ticketId}/status`, { priority });
      
      const updatedTickets = tickets.map(t => 
        t.id === ticketId ? { ...t, priority } : t
      );
      setTickets(updatedTickets);
      
      if (activeTicket?.id === ticketId) {
        setActiveTicket({ ...activeTicket, priority });
      }

      // Recarregar stats se mudou para/de alta prioridade
      if (priority === "urgent" || priority === "high") {
        loadStats();
      }
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
      alert("Erro ao alterar prioridade. Tente novamente.");
    }
  };

  const deleteTicket = async (ticketId: number) => {
    if (!confirm("Tem certeza que deseja deletar este ticket? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await api.delete(`/support/admin/tickets/${ticketId}`);
      
      // Remover da lista
      setTickets(tickets.filter(t => t.id !== ticketId));
      
      // Se estava visualizando, limpar
      if (activeTicket?.id === ticketId) {
        setActiveTicket(null);
      }
      
      // Recarregar stats
      loadStats();
      loadTickets();
    } catch (error) {
      console.error("Erro ao deletar ticket:", error);
      alert("Erro ao deletar ticket. Tente novamente.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "in_progress":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "closed":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      default:
        return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "text-zinc-400 bg-zinc-500/20";
      case "medium":
        return "text-blue-400 bg-blue-500/20";
      case "high":
        return "text-orange-400 bg-orange-500/20";
      case "urgent":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-zinc-400 bg-zinc-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4" />;
      case "closed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="gold-bg" />
      
      <div className="relative z-10 min-h-screen px-16 pt-12 pb-20 text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="text-sm text-zinc-400 hover:text-yellow-400 transition mb-4"
            >
              ← Voltar ao Painel
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Central de Suporte
            </h1>
            <p className="text-zinc-400 mt-2">Gerencie todos os chamados dos usuários</p>
          </div>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={<MessageCircle className="w-5 h-5" />}
              label="Total de Tickets"
              value={stats.total.toString()}
              color="from-zinc-500 to-zinc-600"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Aguardando"
              value={stats.open.toString()}
              color="from-yellow-500 to-yellow-600"
            />
            <StatCard
              icon={<AlertCircle className="w-5 h-5" />}
              label="Em Andamento"
              value={stats.inProgress.toString()}
              color="from-blue-500 to-blue-600"
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5" />}
              label="Resolvidos"
              value={stats.closed.toString()}
              color="from-green-500 to-green-600"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Alta Prioridade"
              value={stats.highPriority.toString()}
              color="from-red-500 to-red-600"
            />
          </div>
        )}

        {/* LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LISTA DE TICKETS */}
          <div className="lg:col-span-1 bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 h-[700px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Tickets</h2>
              <Filter className="w-5 h-5 text-zinc-400" />
            </div>

            {/* FILTROS */}
            <div className="space-y-3 mb-6">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="open">Aguardando</option>
                <option value="in_progress">Em andamento</option>
                <option value="closed">Resolvidos</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none"
              >
                <option value="all">Todas as prioridades</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            {/* LISTA */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum ticket encontrado</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      activeTicket?.id === ticket.id
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-zinc-700 bg-zinc-800/30 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        #{ticket.id}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm mb-1">{ticket.subject}</h4>
                    
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                      <User className="w-3 h-3" />
                      {ticket.userName}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                        {ticket.status === "open" ? "Aguardando" : 
                         ticket.status === "in_progress" ? "Em andamento" : "Resolvido"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DETALHES DO TICKET */}
          <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 h-[700px] flex flex-col">
            {!activeTicket ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione um ticket para ver os detalhes</p>
                </div>
              </div>
            ) : (
              <>
                {/* HEADER DO TICKET */}
                <div className="pb-6 border-b border-zinc-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{activeTicket.subject}</h2>
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {activeTicket.userName}
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(activeTicket.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          {activeTicket.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTicket(null)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* AÇÕES */}
                  <div className="flex gap-3">
                    <select
                      value={activeTicket.status}
                      onChange={(e) => updateStatus(activeTicket.id, e.target.value)}
                      className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="open">Aguardando</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="closed">Resolvido</option>
                    </select>

                    <select
                      value={activeTicket.priority}
                      onChange={(e) => updatePriority(activeTicket.id, e.target.value)}
                      className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>

                    <button
                      onClick={() => deleteTicket(activeTicket.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/30 transition flex items-center gap-2"
                      title="Deletar ticket"
                    >
                      🗑️ Deletar
                    </button>
                  </div>
                </div>

                {/* MENSAGENS */}
                <div className="flex-1 overflow-y-auto py-6 space-y-4">
                  {activeTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === "user" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.senderType === "user"
                            ? "bg-zinc-800 text-white rounded-tl-none"
                            : "bg-yellow-500 text-black rounded-tr-none"
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 flex items-center gap-2">
                          {message.senderName}
                          {message.senderType === "ceo" && "👑"}
                          {message.senderType === "admin" && "🛡️"}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === "user" ? "text-zinc-500" : "text-black/60"
                        }`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT */}
                {activeTicket.status !== "closed" && (
                  <div className="pt-6 border-t border-zinc-700">
                    <div className="flex gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                        placeholder="Digite sua resposta..."
                        rows={3}
                        className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none resize-none"
                      />
                      <button
                        onClick={sendReply}
                        disabled={loading || !newMessage.trim()}
                        className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 self-end"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  color: string;
}) {
  return (
    <div className="relative group overflow-hidden rounded-2xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition`} />
      <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white`}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </div>
  );
}