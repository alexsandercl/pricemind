import { useEffect, useState } from "react";
import { api } from "../services/api";
import AdminSupport from "./AdminSupport";
import { 
  Users, 
  DollarSign, 
  BarChart3,
  Search,
  Crown,
  Shield,
  Trash2,
  AlertTriangle,
  User as UserIcon,
  MessageCircle,
  Activity,
  TrendingDown,
  Target,
  Filter
} from "lucide-react";
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';

type User = {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  isAdmin: boolean;
  totalRequests: number;
  monthlyRequests: number;
  createdAt: string;
};

type DashboardStats = {
  totalUsers: number;
  usersByPlan: Array<{ plan: string; _count: number }>;
  analysesToday: number;
  totalAnalyses: number;
  premiumAnalysesToday: number;
  usersToday: number;
  totalAdmins: number;
  totalCEOs: number;
};

type CEOMetrics = {
  mrr: number;
  mrrGrowth: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  newUsersThisMonth: number;
  analysesThisMonth: number;
  avgAnalysesPerUser: number;
  mostUsedTool: string;
  peakHours: string;
  conversionRate: number;
  revenueByPlan: Array<{ plan: string; revenue: number; count: number }>;
  userGrowth: Array<{ date: string; users: number }>;
  analysesTimeline: Array<{ date: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
  topUsers: Array<{
    name: string;
    email: string;
    plan: string;
    totalRequests: number;
    monthlyRequests: number;
  }>;
  revenueHistory: Array<{ month: string; revenue: number }>;
  recentActivity: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
    details: string;
  }>;
};

type TabType = "users" | "support" | "ceo";

export default function AdminPanel({ 
  onBack
}: { 
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ceoMetrics, setCeoMetrics] = useState<CEOMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCEO, setLoadingCEO] = useState(false);
  const [search, setSearch] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserRole(user.role || 'user');
      console.log('👤 Usuário logado:', user);
      console.log('🎯 Role detectado:', user.role);
    }
  }, []);

  const isCEO = currentUserRole === 'ceo';

  useEffect(() => {
    if (activeTab === "users") {
      loadData();
    } else if (activeTab === "ceo" && isCEO) {
      loadCEOMetrics();
    }
  }, [activeTab, isCEO, selectedPeriod]);

  async function loadData() {
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users?limit=50")
      ]);

      setStats(dashboardRes.data);
      setUsers(usersRes.data.users);
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert("Você não tem permissão de administrador!");
        onBack();
      } else {
        console.error("Erro ao carregar dados:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadCEOMetrics() {
    setLoadingCEO(true);
    try {
      console.log('📊 Carregando métricas CEO...');
      const response = await api.get(`/admin/ceo-metrics?period=${selectedPeriod}`);
      console.log('✅ Métricas carregadas:', response.data);
      setCeoMetrics(response.data);
    } catch (error) {
      console.error("❌ Erro ao carregar métricas CEO:", error);
    } finally {
      setLoadingCEO(false);
    }
  }

  async function handleChangePlan(userId: string, newPlan: string, userRole: string) {
    if (userRole === 'ceo' && !isCEO) {
      alert("Você não pode alterar o plano de um CEO!");
      return;
    }

    if (!confirm(`Alterar plano para ${newPlan}?`)) return;

    try {
      await api.put(`/admin/users/${userId}/plan`, { plan: newPlan });
      alert("Plano alterado com sucesso!");
      loadData();
    } catch (error: any) {
      console.error("Erro:", error);
      alert(error.response?.data?.error || "Erro ao alterar plano");
    }
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean, userRole: string) {
    if (!isCEO) {
      alert("Apenas o CEO pode promover ou remover administradores!");
      return;
    }

    if (userRole === 'ceo') {
      alert("Você não pode alterar as permissões de outro CEO!");
      return;
    }

    if (!confirm(isAdmin ? "Promover a administrador?" : "Remover de admin?")) return;

    try {
      await api.put(`/admin/users/${userId}/admin`, { isAdmin });
      alert(isAdmin ? "Admin concedido!" : "Admin removido!");
      loadData();
    } catch (error: any) {
      console.error("Erro:", error);
      alert(error.response?.data?.error || "Erro ao alterar permissão");
    }
  }

  async function handleDeleteUser(userId: string, userRole: string, userName: string) {
    if (!isCEO && (userRole === 'admin' || userRole === 'ceo')) {
      alert("Você não tem permissão para deletar este usuário!");
      return;
    }

    if (userRole === 'ceo') {
      alert("Você não pode deletar um CEO!");
      return;
    }

    if (!confirm(`ATENÇÃO: Deletar ${userName} permanentemente?`)) return;
    if (!confirm("Tem certeza? Esta ação não pode ser desfeita!")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      alert("Usuário deletado!");
      loadData();
    } catch (error: any) {
      console.error("Erro:", error);
      alert(error.response?.data?.error || "Erro ao deletar usuário");
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getTabClassName = (tab: TabType) => {
    const baseClass = "flex items-center gap-2 px-6 py-3 font-medium transition-all";
    const activeClass = "text-yellow-400 border-b-2 border-yellow-400";
    const inactiveClass = "text-zinc-400 hover:text-white";
    
    return `${baseClass} ${activeTab === tab ? activeClass : inactiveClass}`;
  };

  if (loading && activeTab === "users") {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Carregando painel...
      </div>
    );
  }

  if (activeTab === "support") {
    return <AdminSupport onBack={() => setActiveTab("users")} />;
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-16 pt-12 pb-20 text-white">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {isCEO ? (
              <Crown className="text-yellow-400" size={32} />
            ) : (
              <Shield className="text-blue-400" size={32} />
            )}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Painel {isCEO ? "CEO" : "Administrativo"}
                {isCEO && (
                  <span className="text-xs bg-yellow-500 text-black px-3 py-1 rounded-full">
                    CEO
                  </span>
                )}
              </h1>
              <p className="text-sm text-zinc-400">
                {isCEO ? "Controle total do sistema" : "Gestão de usuários e planos"}
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
          >
            ← Voltar
          </button>
        </div>

        <div className="flex gap-4 mb-8 border-b border-zinc-700">
          <button
            onClick={() => setActiveTab("users")}
            className={getTabClassName("users")}
          >
            <Users size={20} />
            Gestão de Usuários
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={getTabClassName("support")}
          >
            <MessageCircle size={20} />
            Central de Suporte
          </button>
          {isCEO && (
            <button
              onClick={() => setActiveTab("ceo")}
              className={getTabClassName("ceo")}
            >
              <Crown size={20} />
              👑 Dashboard CEO
            </button>
          )}
        </div>

        {activeTab === "users" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <StatCard
                icon={<Users size={24} />}
                label="Total de Usuários"
                value={stats?.totalUsers || 0}
                trend={`+${stats?.usersToday || 0} hoje`}
                color="blue"
              />
              <StatCard
                icon={<BarChart3 size={24} />}
                label="Análises Hoje"
                value={stats?.analysesToday || 0}
                trend={`${stats?.totalAnalyses || 0} total`}
                color="green"
              />
              <StatCard
                icon={<Shield size={24} />}
                label="Administradores"
                value={stats?.totalAdmins || 0}
                trend={`${stats?.totalCEOs || 0} CEO(s)`}
                color="blue"
              />
              <StatCard
                icon={<DollarSign size={24} />}
                label="Planos Pagos"
                value={
                  stats?.usersByPlan
                    ?.filter((p) => p.plan !== "free")
                    .reduce((sum, p) => sum + p._count, 0) || 0
                }
                trend="Pro + Business"
                color="yellow"
              />
            </div>

            <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8 mb-12">
              <h3 className="font-semibold mb-6">Distribuição de Planos</h3>
              <div className="grid grid-cols-4 gap-6">
                {stats?.usersByPlan?.map((item) => (
                  <div
                    key={item.plan}
                    className="bg-black/50 rounded-xl p-5 border border-zinc-700"
                  >
                    <p className="text-sm text-zinc-400 mb-2">
                      {item.plan === "free"
                        ? "Free"
                        : item.plan === "pro"
                        ? "Pro 💎"
                        : item.plan === "starter"
                        ? "Starter 🚀"
                        : "Business 🏢"}
                    </p>
                    <p className="text-3xl font-bold">{item._count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Gestão de Usuários</h3>
                
                <div className="flex items-center gap-3 bg-black border border-zinc-700 rounded-xl px-4 py-2">
                  <Search size={18} className="text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="bg-transparent outline-none text-sm w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
                      <th className="pb-3">Usuário</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Cargo</th>
                      <th className="pb-3">Plano</th>
                      <th className="pb-3">Análises</th>
                      <th className="pb-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const canEdit = isCEO || user.role === 'user';
                      const canDelete = isCEO || user.role === 'user';

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-zinc-800 hover:bg-zinc-800/50 transition"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                {user.name[0]?.toUpperCase()}
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-zinc-400">{user.email}</td>
                          <td className="py-4">
                            {user.role === 'ceo' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                                <Crown size={12} /> CEO
                              </span>
                            )}
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold">
                                <Shield size={12} /> Admin
                              </span>
                            )}
                            {user.role === 'user' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                                <UserIcon size={12} /> Usuário
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            <select
                              value={user.plan}
                              onChange={(e) => handleChangePlan(user.id, e.target.value, user.role)}
                              disabled={!canEdit}
                              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro 💎</option>
                              <option value="business">Business 🏢</option>
                              <option value="starter">Starter 🚀</option>
                            </select>
                          </td>
                          <td className="py-4 text-sm">
                            {user.totalRequests} ({user.monthlyRequests} mês)
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {isCEO && user.role !== 'ceo' && (
                                <button
                                  onClick={() => handleToggleAdmin(user.id, !user.isAdmin, user.role)}
                                  className={`p-2 rounded-lg transition ${
                                    user.isAdmin
                                      ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                      : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                                  }`}
                                  title={user.isAdmin ? "Remover admin" : "Tornar admin"}
                                >
                                  <Shield size={16} />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteUser(user.id, user.role, user.name)}
                                disabled={!canDelete}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                title={canDelete ? "Deletar usuário" : "Sem permissão"}
                              >
                                {!canDelete && <AlertTriangle size={14} className="absolute -top-1 -right-1" />}
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-zinc-400">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "ceo" && isCEO && (
          <CEODashboard 
            metrics={ceoMetrics} 
            loading={loadingCEO}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        )}
      </div>
    </>
  );
}

function CEODashboard({ 
  metrics, 
  loading, 
  selectedPeriod, 
  onPeriodChange 
}: { 
  metrics: CEOMetrics | null; 
  loading: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Nenhuma métrica disponível
      </div>
    );
  }

  const COLORS = ['#eab308', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-zinc-400";
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return "↗";
    if (value < 0) return "↘";
    return "→";
  };

  return (
    <div className="space-y-8">
      {/* FILTRO DE PERÍODO */}
      <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-700 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium text-zinc-300">Período:</span>
        </div>
        <div className="flex gap-2">
          {[
            { value: "7", label: "7 dias" },
            { value: "30", label: "30 dias" },
            { value: "90", label: "90 dias" },
            { value: "365", label: "1 ano" }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => onPeriodChange(period.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period.value
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CEOCard
          icon={<DollarSign className="w-6 h-6" />}
          label="MRR (Receita Recorrente)"
          value={`R$ ${metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={`${getTrendIcon(metrics.mrrGrowth)} ${Math.abs(metrics.mrrGrowth).toFixed(1)}% vs mês anterior`}
          trendColor={getTrendColor(metrics.mrrGrowth)}
          color="green"
        />
        <CEOCard
          icon={<Users className="w-6 h-6" />}
          label="Novos Usuários (Mês)"
          value={metrics.newUsersThisMonth}
          trend="Crescimento orgânico"
          color="blue"
        />
        <CEOCard
          icon={<TrendingDown className="w-6 h-6" />}
          label="Taxa de Churn"
          value={`${metrics.churnRate.toFixed(1)}%`}
          trend={metrics.churnRate < 5 ? "✓ Excelente!" : "⚠ Atenção"}
          color={metrics.churnRate < 5 ? "green" : "red"}
        />
        <CEOCard
          icon={<Target className="w-6 h-6" />}
          label="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          trend="Visitantes → Pagantes"
          color="purple"
        />
      </div>

      {/* RECEITA POR PLANO + PRODUTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6">💰 Receita por Plano</h3>
          <div className="space-y-4">
            {metrics.revenueByPlan.map((item, idx) => (
              <div key={idx} className="bg-black/30 rounded-xl p-4 hover:bg-black/50 transition">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-lg">
                    {item.plan === 'pro' ? 'Pro 💎' : 'Business 🏢'}
                  </span>
                  <span className="text-xl font-bold text-green-400">
                    R$ {item.revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-400">{item.count} assinantes ativos</p>
                  <p className="text-xs text-zinc-500">
                    R$ {(item.revenue / item.count || 0).toFixed(2)}/usuário
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6">📊 Métricas de Produto</h3>
          <div className="space-y-4">
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-sm text-zinc-400 mb-1">Análises este mês</p>
              <p className="text-3xl font-bold">{metrics.analysesThisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-sm text-zinc-400 mb-1">Média por usuário</p>
              <p className="text-3xl font-bold">{metrics.avgAnalysesPerUser.toFixed(1)}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-sm text-zinc-400 mb-1">🔥 Ferramenta mais usada</p>
              <p className="text-xl font-bold text-yellow-400">{metrics.mostUsedTool}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-sm text-zinc-400 mb-1">⏰ Horário de pico</p>
              <p className="text-xl font-bold text-blue-400">{metrics.peakHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 5 USUÁRIOS MAIS ATIVOS */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
        <h3 className="text-xl font-bold mb-6">🏆 Top 5 Usuários Mais Ativos</h3>
        <div className="space-y-3">
          {metrics.topUsers.map((user, idx) => (
            <div key={idx} className="flex items-center justify-between bg-black/30 rounded-xl p-4 hover:bg-black/50 transition">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  idx === 0 ? "bg-yellow-500 text-black" :
                  idx === 1 ? "bg-zinc-400 text-black" :
                  idx === 2 ? "bg-orange-600 text-white" :
                  "bg-zinc-700 text-zinc-300"
                }`}>
                  #{idx + 1}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{user.totalRequests.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">{user.monthlyRequests} este mês</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                  user.plan === 'business' ? 'bg-orange-500/20 text-orange-400' :
                  user.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-zinc-700 text-zinc-400'
                }`}>
                  {user.plan === 'business' ? 'Business' : user.plan === 'pro' ? 'Pro' : 'Free'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6">📈 Crescimento de Usuários</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="users" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6">📊 Análises por Dia</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={metrics.analysesTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECEITA HISTÓRICA */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
        <h3 className="text-xl font-bold mb-6">💵 Receita Histórica (últimos 12 meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={metrics.revenueHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
            />
            <Bar dataKey="revenue" fill="#eab308" radius={[8, 8, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      {/* DISTRIBUIÇÃO POR CATEGORIA */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
        <h3 className="text-xl font-bold mb-6">🎯 Distribuição por Categoria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={metrics.categoryDistribution} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="count" label>
                {metrics.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {metrics.categoryDistribution.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center bg-black/30 rounded-lg p-3 hover:bg-black/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium">{cat.category}</span>
                </div>
                <span className="text-lg font-bold">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOGS DE ATIVIDADE RECENTE */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
        <h3 className="text-xl font-bold mb-6">📋 Atividade Recente</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {metrics.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 bg-black/30 rounded-xl p-4 hover:bg-black/50 transition">
              <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">
                  <span className="text-yellow-400">{activity.user}</span> {activity.action}
                </p>
                {activity.details && <p className="text-xs text-zinc-500 mt-1">{activity.details}</p>}
                <p className="text-xs text-zinc-600 mt-1">
                  {new Date(activity.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  trend: string; 
  color: string 
}) {
  const colors = { 
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/50", 
    green: "from-green-500/20 to-green-600/20 border-green-500/50", 
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/50", 
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/50" 
  };
  
  return (
    <div className={`bg-gradient-to-br ${colors[color as keyof typeof colors]} border rounded-2xl p-6`}>
      <div className="flex items-center gap-3 mb-3">{icon}</div>
      <p className="text-sm text-zinc-300 mb-2">{label}</p>
      <p className="text-3xl font-bold mb-1">{value.toLocaleString()}</p>
      <p className="text-xs text-zinc-400">{trend}</p>
    </div>
  );
}

function CEOCard({ 
  icon, 
  label, 
  value, 
  trend, 
  color,
  trendColor
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  trend: string; 
  color: string;
  trendColor?: string;
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/50",
    green: "from-green-500/20 to-green-600/20 border-green-500/50",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/50",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/50",
    red: "from-red-500/20 to-red-600/20 border-red-500/50",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color as keyof typeof colors]} border rounded-2xl p-6`}>
      <div className="flex items-center gap-3 mb-3">{icon}</div>
      <p className="text-sm text-zinc-300 mb-2">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className={`text-xs ${trendColor || 'text-zinc-400'}`}>{trend}</p>
    </div>
  );
}