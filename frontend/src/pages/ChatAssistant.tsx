import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { MessageCircle, Send, Loader, Sparkles, Trash2 } from "lucide-react";

// 🔥 FUNÇÃO PARA LIMPAR MARKDOWN
function formatAIResponse(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`/g, '')
    .trim();
}

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function ChatAssistant({ onBack }: { onBack: () => void }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setError("");

    // Adicionar mensagem do usuário imediatamente
    const newUserMsg: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const response = await api.post("/premium/chat-assistant", {
        message: userMessage,
        conversationId
      });

      const aiMessage: Message = {
        role: "assistant",
        content: response.data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (!conversationId) {
        setConversationId(response.data.conversationId);
      }

    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError("Ferramenta exclusiva para plano Business! Faça upgrade.");
      } else {
        setError(err.response?.data?.message || "Erro ao enviar mensagem");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleNewChat() {
    setConversationId(null);
    setMessages([]);
    setError("");
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 pb-4 sm:pb-8 text-white">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Assistente IA de Precificação</h1>
                <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold">
                  🔥 BUSINESS EXCLUSIVO
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Especialista disponível 24/7 para tirar suas dúvidas sobre precificação
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-sm"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Nova Conversa</span>
              </button>
            )}
            <button
              onClick={onBack}
              className="flex-1 sm:flex-none text-sm text-zinc-400 hover:text-yellow-400 transition text-center"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* CHAT CONTAINER */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Sparkles className="mx-auto mb-4 text-yellow-400 w-10 h-10 sm:w-12 sm:h-12" />
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Olá! Como posso ajudar?</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm mb-6">
                    Pergunte sobre precificação, margens, concorrentes, estratégias...
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                    <button
                      onClick={() => setInput("Como definir o preço ideal para meu infoproduto?")}
                      className="p-3 sm:p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition text-xs sm:text-sm"
                    >
                      💡 Como definir preço ideal?
                    </button>
                    <button
                      onClick={() => setInput("Qual margem de lucro devo ter?")}
                      className="p-3 sm:p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition text-xs sm:text-sm"
                    >
                      📊 Qual margem ideal?
                    </button>
                    <button
                      onClick={() => setInput("Como analisar preços dos concorrentes?")}
                      className="p-3 sm:p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition text-xs sm:text-sm"
                    >
                      🎯 Analisar concorrentes
                    </button>
                    <button
                      onClick={() => setInput("Estratégias de precificação para lançamento")}
                      className="p-3 sm:p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition text-xs sm:text-sm"
                    >
                      🚀 Estratégia de lançamento
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
                      msg.role === "user"
                        ? "bg-yellow-500/10 border border-yellow-500/30"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="text-yellow-400 w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed break-words">
                          {msg.role === "assistant" 
                            ? formatAIResponse(msg.content) 
                            : msg.content}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Loader className="text-yellow-400 animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-400">Assistente está digitando...</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="border-t border-zinc-700 p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta sobre precificação..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition resize-none text-sm sm:text-base"
                  rows={2}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-4 sm:px-6 bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                >
                  {loading ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <Send size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}