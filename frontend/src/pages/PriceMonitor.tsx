import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Eye, Bell, Play, Pause, Trash2, RefreshCw, TrendingUp, TrendingDown, Plus, Link as LinkIcon, Edit, X, BarChart3, Clock, AlertCircle, CheckCircle2, ArrowLeft, Activity } from "lucide-react";

type Monitor = {
  id: string;
  productName: string;
  targetUrl: string;
  currentPrice: number;
  initialPrice: number;
  priceChange: number;
  priceChangePercent: number;
  alertThreshold: number;
  frequency: string;
  isActive: boolean;
  lastChecked: string | null;
  createdAt: string;
  historyCount: number;
};

type HistoryItem = {
  id: string;
  price: number;
  priceChange: number | null;
  checkedAt: string;
};

export default function PriceMonitor({ onBack }: { onBack: () => void }) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states
  const [productName, setProductName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("5");
  const [frequency, setFrequency] = useState("daily");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadMonitors();
  }, []);

  async function loadMonitors() {
    try {
      const response = await api.get('/monitor');
      setMonitors(response.data.monitors);
    } catch (error: any) {
      console.error('Erro ao carregar monitores:', error);
      if (error.response?.data?.upgrade) {
        alert('Monitor de Preços é exclusivo do plano Business!');
        onBack();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMonitor(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setCreating(true);

    try {
      await api.post('/monitor', {
        productName,
        targetUrl,
        alertThreshold: parseFloat(alertThreshold),
        frequency
      });

      setShowForm(false);
      setProductName("");
      setTargetUrl("");
      setAlertThreshold("5");
      setFrequency("daily");
      loadMonitors();
      alert('Monitoramento criado com sucesso!');
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Erro ao criar monitoramento');
    } finally {
      setCreating(false);
    }
  }

  async function handleRefresh(monitorId: string) {
    try {
      const response = await api.post(`/monitor/${monitorId}/refresh`);
      alert(`Preço atualizado! ${response.data.priceChange > 0 ? '📈' : '📉'} ${Math.abs(response.data.priceChange).toFixed(2)}%`);
      loadMonitors();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar preço');
    }
  }

  async function handleToggle(monitorId: string) {
    try {
      await api.put(`/monitor/${monitorId}/toggle`);
      loadMonitors();
    } catch (error) {
      console.error('Erro ao alternar monitor:', error);
    }
  }

  async function handleDelete(monitorId: string, productName: string) {
    if (!confirm(`Tem certeza que deseja deletar o monitoramento de "${productName}"?`)) return;

    try {
      await api.delete(`/monitor/${monitorId}`);
      loadMonitors();
      setSelectedMonitor(null);
    } catch (error) {
      console.error('Erro ao deletar monitor:', error);
    }
  }

  async function handleEditPrice(monitorId: string, currentPrice: number) {
    const newPrice = prompt(
      `⚠️ Edição Manual de Preço\n\nPreço atual detectado: R$ ${currentPrice.toFixed(2)}\n\nSe o valor estiver incorreto, digite o preço correto abaixo:`,
      currentPrice.toFixed(2)
    );

    if (!newPrice) return;

    const parsedPrice = parseFloat(newPrice.replace(',', '.'));
    
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('❌ Preço inválido! Digite apenas números (ex: 499.90)');
      return;
    }

    try {
      await api.put(`/monitor/${monitorId}/edit-price`, {
        newPrice: parsedPrice
      });

      alert(`✅ Preço atualizado para R$ ${parsedPrice.toFixed(2)}!`);
      loadMonitors();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao editar preço');
    }
  }

  async function loadHistory(monitor: Monitor) {
    setSelectedMonitor(monitor);
    setLoadingHistory(true);

    try {
      const response = await api.get(`/monitor/${monitor.id}/history`);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* HEADER */}
      <div className="border-b border-zinc-800/50 bg-black/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-6">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition"
              >
                <ArrowLeft size={18} />
                Voltar
              </button>
              
              <div className="w-px h-8 bg-zinc-800" />
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Activity size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Monitor de Preços</h1>
                  <p className="text-xs text-zinc-500">Rastreamento inteligente</p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition shadow-lg shadow-blue-500/25"
            >
              <Plus size={18} />
              Novo Monitor
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Activity size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{monitors.length}</p>
                <p className="text-sm text-zinc-500">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {monitors.filter(m => m.isActive).length}
                </p>
                <p className="text-sm text-zinc-500">Ativos</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingUp size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {monitors.filter(m => m.priceChange > 0).length}
                </p>
                <p className="text-sm text-zinc-500">Aumentos</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingDown size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {monitors.filter(m => m.priceChange < 0).length}
                </p>
                <p className="text-sm text-zinc-500">Quedas</p>
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Criar Monitoramento</h2>
                <p className="text-sm text-zinc-500">Configure um novo rastreamento de preço</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMonitor} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-300">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Curso de Marketing Digital"
                  className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-white placeholder:text-zinc-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-300">
                  URL da Página *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://exemplo.com/produto"
                    className="w-full pl-11 pr-4 py-3 bg-black/50 border border-zinc-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-white placeholder:text-zinc-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-zinc-300">
                    Alerta (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value)}
                      min="1"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-zinc-300">
                    Frequência
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-white"
                  >
                    <option value="daily">Diário (9h)</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{formError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Criando...' : 'Criar Monitoramento'}
              </button>
            </form>
          </div>
        )}

        {/* LISTA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-500">Carregando monitores...</p>
          </div>
        ) : monitors.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Activity size={32} className="text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Nenhum monitor ativo</h3>
            <p className="text-zinc-500 mb-8 max-w-md mx-auto">
              Crie seu primeiro monitoramento para começar a rastrear preços
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition shadow-lg shadow-blue-500/25"
            >
              <Plus size={20} />
              Criar Primeiro Monitor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {monitors.map((monitor) => {
              const priceUp = monitor.priceChange > 0;
              const priceDown = monitor.priceChange < 0;

              return (
                <div
                  key={monitor.id}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 hover:border-zinc-700/50 transition-all"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-lg text-white mb-2 truncate">
                        {monitor.productName}
                      </h3>
                      <a
                        href={monitor.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-blue-400 transition flex items-center gap-1.5 truncate"
                      >
                        <LinkIcon size={12} />
                        <span className="truncate">{monitor.targetUrl}</span>
                      </a>
                    </div>
                    
                    {monitor.isActive ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20 whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        ATIVO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-zinc-500 text-xs font-bold rounded-lg border border-zinc-700/50 whitespace-nowrap">
                        <Pause size={12} />
                        PAUSADO
                      </span>
                    )}
                  </div>

                  {/* PREÇOS */}
                  <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-5 mb-5">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-medium">Inicial</p>
                        <p className="text-xl font-bold text-zinc-400">
                          R$ {monitor.initialPrice.toFixed(2)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-medium">Atual</p>
                        <p className="text-xl font-bold text-blue-400">
                          R$ {monitor.currentPrice.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-medium">Variação</p>
                        <div className={`flex items-center gap-1.5 text-xl font-bold ${
                          priceUp ? 'text-red-400' : priceDown ? 'text-green-400' : 'text-zinc-500'
                        }`}>
                          {priceUp && <TrendingUp size={20} />}
                          {priceDown && <TrendingDown size={20} />}
                          {priceUp && '+'}
                          {monitor.priceChangePercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-5 pb-5 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <Bell size={14} />
                      <span>Alerta: ±{monitor.alertThreshold}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        {monitor.lastChecked
                          ? new Date(monitor.lastChecked).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short'
                            })
                          : 'Nunca'}
                      </span>
                    </div>
                  </div>

                  {/* AÇÕES */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      onClick={() => loadHistory(monitor)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition text-sm font-medium"
                    >
                      <BarChart3 size={16} />
                      Histórico
                    </button>

                    <button
                      onClick={() => handleRefresh(monitor.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition text-sm font-medium"
                    >
                      <RefreshCw size={16} />
                      Atualizar
                    </button>

                    <button
                      onClick={() => handleToggle(monitor.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg transition text-sm font-medium"
                    >
                      {monitor.isActive ? <Pause size={16} /> : <Play size={16} />}
                      {monitor.isActive ? 'Pausar' : 'Ativar'}
                    </button>

                    <button
                      onClick={() => handleDelete(monitor.id, monitor.productName)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      Deletar
                    </button>
                  </div>

                  <button
                    onClick={() => handleEditPrice(monitor.id, monitor.currentPrice)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-yellow-400/80 hover:text-yellow-400 hover:bg-yellow-500/5 rounded-lg transition border border-zinc-800/50 hover:border-yellow-500/20"
                  >
                    <Edit size={14} />
                    Preço incorreto? Clique para ajustar manualmente
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL HISTÓRICO */}
      {selectedMonitor && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Histórico de Preços</h2>
                <p className="text-zinc-400">{selectedMonitor.productName}</p>
              </div>
              <button
                onClick={() => setSelectedMonitor(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-500">Nenhum histórico disponível</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-5 bg-zinc-800/30 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <p className="font-bold text-2xl text-white">
                          R$ {item.price.toFixed(2)}
                        </p>
                        {index === 0 && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-semibold">
                            ATUAL
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">
                        {new Date(item.checkedAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {item.priceChange !== null && item.priceChange !== 0 && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${
                        item.priceChange > 0
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {item.priceChange > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        <span className="text-lg">
                          {item.priceChange > 0 && '+'}
                          {item.priceChange.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}