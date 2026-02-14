import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Sparkles, Target, DollarSign, Calendar, Award } from "lucide-react";

type DashboardData = {
  totalAnalyses: number;
  avgPrice: string;
  approvalRate: string;
  timelineData: { date: string; count: number }[];
  categoriesData: { name: string; value: number }[];
  priceDistribution: { range: string; count: number }[];
};

type AnalysisHistory = {
  id: string;
  productName: string;
  price: number;
  category: string;
  createdAt: string;
};

const COLORS = ["#facc15", "#fbbf24", "#f59e0b", "#f97316", "#ef4444", "#ec4899"];

export default function Stats({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState<number>(0);
  const [topCategory, setTopCategory] = useState<string>("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashboardRes, historyRes] = await Promise.all([
          api.get("/stats/dashboard"),
          api.get("/stats/history?limit=5"),
        ]);

        setData(dashboardRes.data);
        setHistory(historyRes.data.analyses);

        // Calcular crescimento (simulado - compare últimos 15 dias vs 15 anteriores)
        const now = new Date();
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recent = dashboardRes.data.timelineData.filter((d: any) => {
          const date = new Date(d.date);
          return date >= fifteenDaysAgo;
        });

        const previous = dashboardRes.data.timelineData.filter((d: any) => {
          const date = new Date(d.date);
          return date >= thirtyDaysAgo && date < fifteenDaysAgo;
        });

        const recentTotal = recent.reduce((sum: number, d: any) => sum + d.count, 0);
        const previousTotal = previous.reduce((sum: number, d: any) => sum + d.count, 0);

        if (previousTotal > 0) {
          const growthPercent = ((recentTotal - previousTotal) / previousTotal) * 100;
          setGrowth(growthPercent);
        }

        // Top categoria
        if (dashboardRes.data.categoriesData.length > 0) {
          const top = dashboardRes.data.categoriesData.reduce((max: any, cat: any) =>
            cat.value > max.value ? cat : max
          );
          setTopCategory(top.name);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 bg-black">
        Erro ao carregar dados
      </div>
    );
  }

  const hasData = data.totalAnalyses > 0;

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 pb-12 sm:pb-20 text-white animate-fadeIn">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="text-yellow-400 w-7 h-7 sm:w-9 sm:h-9" />
              Estatísticas
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base lg:text-lg">
              Visualize suas análises e tendências de precificação
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition text-sm"
          >
            ← Voltar
          </button>
        </div>

        {!hasData ? (
          // ESTADO VAZIO
          <div className="max-w-2xl mx-auto mt-12 sm:mt-20">
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="text-yellow-400 w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Nenhuma análise ainda</h2>
              <p className="text-zinc-400 mb-8 text-sm sm:text-base">
                Faça sua primeira análise de preço para começar a visualizar estatísticas incríveis!
              </p>
              <button
                onClick={onBack}
                className="w-full sm:w-auto px-8 py-4 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition"
              >
                Fazer primeira análise
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* CARDS DE MÉTRICAS PRINCIPAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <MetricCard
                icon={<Target className="text-yellow-400 w-6 h-6 sm:w-7 sm:h-7" />}
                label="Total de Análises"
                value={data.totalAnalyses.toString()}
                subtitle="Todas as análises realizadas"
                trend={null}
              />

              <MetricCard
                icon={<DollarSign className="text-green-400 w-6 h-6 sm:w-7 sm:h-7" />}
                label="Ticket Médio"
                value={`R$ ${data.avgPrice}`}
                subtitle="Preço médio analisado"
                trend={null}
              />

              <MetricCard
                icon={growth >= 0 ? <TrendingUp className="text-blue-400 w-6 h-6 sm:w-7 sm:h-7" /> : <TrendingDown className="text-red-400 w-6 h-6 sm:w-7 sm:h-7" />}
                label="Tendência"
                value={`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
                subtitle="Últimos 15 dias"
                trend={growth >= 0 ? 'up' : 'down'}
              />

              <MetricCard
                icon={<Award className="text-purple-400 w-6 h-6 sm:w-7 sm:h-7" />}
                label="Top Categoria"
                value={topCategory || 'N/A'}
                subtitle="Categoria mais analisada"
                trend={null}
              />
            </div>

            {/* GRID DE GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              
              {/* GRÁFICO DE LINHA - ANÁLISES AO LONGO DO TEMPO */}
              <ChartCard title="📈 Análises nos últimos 30 dias" subtitle="Visualize sua atividade ao longo do tempo">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.timelineData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis
                      dataKey="date"
                      stroke="#a1a1aa"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "12px",
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('pt-BR');
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#facc15"
                      strokeWidth={3}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* GRÁFICO DE PIZZA - CATEGORIAS */}
              <ChartCard title="🥧 Distribuição por Categoria" subtitle="Quais nichos você mais analisa">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.categoriesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.categoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* GRÁFICO DE BARRAS - DISTRIBUIÇÃO DE PREÇOS */}
              <ChartCard title="💰 Faixas de Preço" subtitle="Onde seus produtos se concentram">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.priceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="range" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#facc15" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* HISTÓRICO RECENTE */}
              <ChartCard title="📋 Análises Recentes" subtitle="Últimas 5 análises">
                <div className="space-y-3">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition"
                      >
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium text-sm break-words">{item.productName}</p>
                          <p className="text-xs text-zinc-500">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-green-400 font-bold text-sm">R$ {item.price.toFixed(2)}</span>
                          <span className="text-xs text-zinc-500">
                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-center py-8 text-sm">Nenhuma análise recente</p>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* INSIGHTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <InsightCard
                icon="🎉"
                title="Parabéns!"
                description={`Você já fez ${data.totalAnalyses} análises! Continue otimizando seus preços.`}
                color="yellow"
              />
              <InsightCard
                icon="💡"
                title="Dica"
                description="Experimente comparar seus preços com a concorrência usando os campos avançados."
                color="blue"
              />
              <InsightCard
                icon="🎯"
                title="Meta"
                description={`Você fez ${data.totalAnalyses} análises. Continue assim para dominar sua precificação!`}
                color="purple"
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ===== COMPONENTES ===== */

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | null;
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-yellow-500/50 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
            trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
      <p className="text-xs sm:text-sm text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold mb-1 break-words">{value}</p>
      <p className="text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-zinc-600 transition">
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-1">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function InsightCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: 'yellow' | 'blue' | 'purple';
}) {
  const colorClasses = {
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
  };

  return (
    <div className={`border rounded-xl sm:rounded-2xl p-4 sm:p-6 ${colorClasses[color]}`}>
      <div className="text-2xl sm:text-3xl mb-3">{icon}</div>
      <h4 className="font-semibold mb-2 text-sm sm:text-base">{title}</h4>
      <p className="text-xs sm:text-sm text-zinc-400">{description}</p>
    </div>
  );
}

// Label customizado para o gráfico de pizza
function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  if (percent < 0.05) return null; // Não mostra se for menos de 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={13}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}