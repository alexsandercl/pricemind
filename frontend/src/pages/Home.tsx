import { useEffect, useState } from "react";
import { api } from "../services/api";
import UpgradeModal from "../components/UpgradeModal";
import SupportChat from "../components/SupportChat";
import WelcomeTour from "../components/ui/WelcomeTour";
import SkeletonCard from "../components/ui/SkeletonCard";
import EmptyState from "../components/ui/EmptyState";
import NotificationBell from "../components/NotificationBell";
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Target, 
  FileText,
  Link,
  Image as ImageIcon,
  Calculator,
  PieChart,
  TrendingDown,
  Bell,
  Bot,
  BarChart,
  Zap as Lightning,
  Activity,
  Repeat,
  Package,
  BookOpen,
  MessageCircle,
  Crown,
  Shield,
  ChevronRight,
  Wallet,
  Percent
} from "lucide-react";

type User = {
  name: string;
  email: string;
  plan: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  role?: string;
};

type Stats = {
  totalRequests: number;
  monthlyRequests: number;
};

export default function Home({
  onAnalyze,
  onProfile,
  onStats,
  onHistory,
  onComparePrice,
  onPriceSimulator,
  onChatAssistant,
  onExecutiveDashboard,
  onBatchAnalysis,
  onPriceMonitor,
  onIntegrations,
  onTrafficROI,
  onAnalyzePDF,
  onAnalyzeLink,
  onAnalyzeImage,
  onProfitCalc,
  onBreakEven,
  onDiscountSimulator,
  onAdmin,
  onPricing,
  onLogout,
}: {
  onAnalyze: () => void;
  onProfile: () => void;
  onStats: () => void;
  onHistory: () => void;
  onComparePrice: () => void;
  onPriceSimulator: () => void;
  onChatAssistant: () => void;
  onExecutiveDashboard: () => void;
  onBatchAnalysis: () => void;
  onPriceMonitor: () => void;
  onIntegrations: () => void;
  onTrafficROI: () => void;
  onAnalyzePDF: () => void;
  onAnalyzeLink: () => void;
  onAnalyzeImage: () => void;
  onProfitCalc: () => void;
  onBreakEven: () => void;
  onDiscountSimulator: () => void;
  onAdmin: () => void;
  onPricing: () => void;
  onLogout: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get("/profile"),
          api.get("/stats"),
        ]);

        console.log('🔍 User data:', profileRes.data);
        console.log('🔍 Stats data:', statsRes.data);
        
        setUser(profileRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  function handlePremiumClick(featureName: string) {
    if (user?.plan === "free") {
      setSelectedFeature(featureName);
      onPricing();
    }
  }

  function handleBusinessClick(featureName: string) {
    if (user?.plan !== "business") {
      setSelectedFeature(featureName + " (Exclusivo Business)");
      onPricing();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="gold-bg" />
        
        <header className="relative z-10 flex items-center justify-between p-4 sm:p-5 border-b border-zinc-700/50">
          <div className="flex items-center gap-3">
            <div className="w-24 sm:w-32 h-8 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-20 sm:w-24 h-8 bg-zinc-800 rounded animate-pulse" />
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800 rounded-full animate-pulse" />
          </div>
        </header>

        <main className="relative z-10 px-4 sm:px-8 lg:px-16 pt-8 sm:pt-14 pb-12 sm:pb-20">
          <div className="mb-12 sm:mb-16">
            <div className="w-full max-w-xs sm:max-w-md lg:max-w-lg h-12 sm:h-16 bg-zinc-800 rounded-xl mb-4 animate-pulse" />
            <div className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl h-6 sm:h-8 bg-zinc-800 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-6xl mx-auto">
            <SkeletonCard variant="stat" />
            <SkeletonCard variant="stat" />
            <SkeletonCard variant="stat" />
          </div>

          <div className="max-w-4xl mx-auto mb-12 sm:mb-20">
            <div className="h-32 sm:h-48 bg-zinc-800 rounded-2xl sm:rounded-3xl animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto mb-12 sm:mb-16">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const isPremium = user?.plan === "pro" || user?.plan === "business";
  const isBusiness = user?.plan === "business";
  const isStarter = user?.plan === "starter";
  const isAdmin = user?.isAdmin === true;
  const isCEO = user?.role === 'ceo';
  
  const planLimit = user?.plan === 'business' ? '∞' : (user?.plan === 'pro' ? '100' : (user?.plan === 'starter' ? '50' : '10'));
  const monthlyUsed = stats?.monthlyRequests || 0;

  return (
    <>
      <div className="gold-bg" />
      <WelcomeTour />

      {showUpgradeModal && (
        <UpgradeModal
          feature={selectedFeature}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* HEADER */}
      <header className="relative z-20 flex justify-between items-center px-4 sm:px-8 lg:px-16 py-4 sm:py-6 border-b border-zinc-800 bg-black/30 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center font-bold text-black text-lg sm:text-xl shadow-lg shadow-yellow-500/30">
            P
          </div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
            PriceMind
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              localStorage.removeItem('pricemind_tour_completed');
              window.location.reload();
            }}
            className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 hover:text-yellow-400 transition px-3 py-1.5 rounded-lg hover:bg-zinc-800/50"
          >
            <Sparkles className="w-4 h-4" />
            Tutorial
          </button>

          <NotificationBell />

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-xl hover:bg-zinc-800/50 transition-all duration-300"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center font-semibold overflow-hidden ring-2 ring-zinc-700">
                {user?.avatarUrl && !imageError ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <span className="text-sm sm:text-base text-white">{user?.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium flex items-center gap-2">
                  {user?.name}
                  {isCEO && (
                    <span className="flex items-center gap-1 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">
                      <Crown className="w-3 h-3" />
                      CEO
                    </span>
                  )}
                  {isAdmin && !isCEO && (
                    <span className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold">
                      <Shield className="w-3 h-3" />
                      ADMIN
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-400">
                  Plano {user?.plan === "business" ? "Business" : user?.plan === "pro" ? "Pro" : user?.plan === "starter" ? "Starter" : "Free"}
                </p>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-48 sm:w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onProfile();
                  }}
                  className="w-full px-4 py-3 text-sm text-left hover:bg-zinc-800 transition flex items-center gap-3 text-white"
                >
                  <Target className="w-4 h-4 text-zinc-400" />
                  Acessar perfil
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAdmin();
                    }}
                    className={`w-full px-4 py-3 text-sm text-left hover:bg-zinc-800 transition flex items-center gap-3 border-t border-b border-zinc-700 ${
                      isCEO ? 'text-yellow-400' : 'text-blue-400'
                    }`}
                  >
                    {isCEO ? (
                      <>
                        <Crown className="w-4 h-4" />
                        Painel CEO
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Painel Admin
                      </>
                    )}
                  </button>
                )}

                {!isBusiness && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPricing();
                    }}
                    className="w-full px-4 py-3 text-sm text-left text-yellow-400 hover:bg-zinc-800 transition flex items-center gap-3"
                  >
                    <Sparkles className="w-4 h-4" />
                    Fazer upgrade
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-zinc-800 transition flex items-center gap-3"
                >
                  <ChevronRight className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-8 sm:pt-14 pb-12 sm:pb-20 text-white">
        
        {/* HERO */}
        <div className="relative mb-12 sm:mb-16 animate-fadeIn">
          <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/10 via-yellow-400/5 to-transparent blur-3xl pointer-events-none" />
          
          <div className="relative space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                Olá, {user?.name?.split(' ')[0]}
              </h1>
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-400 animate-pulse" />
            </div>

            <p className="text-lg sm:text-xl lg:text-2xl text-zinc-300 max-w-3xl">
              {user?.plan === 'free' && stats?.totalRequests && stats.totalRequests > 0 && (
                <span className="block mb-2">
                  Você já fez <span className="text-yellow-400 font-bold">{stats.totalRequests}</span> análises inteligentes!
                </span>
              )}
              Pronto para <span className="text-yellow-400 font-semibold">otimizar seus preços</span> e aumentar suas vendas?
            </p>

            {stats?.totalRequests && stats.totalRequests > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-semibold">
                  {stats.totalRequests} análises realizadas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-6xl mx-auto">
          <StatsCard
            icon={<BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />}
            label="Análises feitas"
            value={stats?.totalRequests?.toString() || "0"}
            trend="+ este mês"
            delay="0"
          />
          <StatsCard
            icon={<Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" />}
            label="Plano atual"
            value={user?.plan === "business" ? "Business" : user?.plan === "pro" ? "Pro" : user?.plan === "starter" ? "Starter" : "Free"}
            trend={isBusiness ? "Recursos ilimitados" : isPremium ? "Recursos avançados" : isStarter ? "Recursos essenciais" : "Recursos básicos"}
            delay="100"
          />
          <StatsCard
            icon={<Target className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />}
            label="Limite mensal"
            value={`${monthlyUsed} / ${planLimit}`}
            trend={planLimit === '∞' ? 'Ilimitado' : `${planLimit} análises/mês`}
            delay="200"
          />
        </div>

        {/* CTA PRINCIPAL */}
        <div 
          onClick={onAnalyze}
          className="max-w-5xl mx-auto mb-16 sm:mb-24 cursor-pointer group animate-slideUp"
          style={{ animationDelay: '300ms' }}
        >
          <div className="relative bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-amber-500/20 rounded-2xl sm:rounded-3xl p-[2px] shadow-2xl shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-700 hover:scale-[1.01]">
            <div className="bg-zinc-900/95 backdrop-blur-xl rounded-[calc(1rem-2px)] sm:rounded-[calc(1.5rem-2px)] p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                      Analisar novo produto
                    </h2>
                  </div>
                  <p className="text-zinc-300 text-base sm:text-lg lg:text-xl leading-relaxed">
                    Receba uma análise inteligente de preço com base no seu mercado, 
                    concorrência e psicologia de precificação em segundos.
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full group-hover:bg-yellow-400/30 transition-all duration-700" />
                  <div className="relative p-6 sm:p-8 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-2xl border border-yellow-400/20 group-hover:border-yellow-400/40 transition-all duration-700 group-hover:rotate-3">
                    <Lightning className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <Section title="Ações rápidas" delay="400">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <ActionCard
              title="Nova Análise Rápida"
              description="Analise um produto em segundos com IA."
              icon={<Lightning className="w-6 h-6" />}
              onClick={onAnalyze}
              gradient="from-yellow-500/20 to-amber-500/20"
              borderColor="border-yellow-500/30"
              hoverColor="hover:border-yellow-500"
            />
            <ActionCard
              title="Ver Estatísticas"
              description="Acompanhe desempenho e métricas."
              icon={<BarChart className="w-6 h-6" />}
              onClick={onStats}
              gradient="from-blue-500/20 to-cyan-500/20"
              borderColor="border-blue-500/30"
              hoverColor="hover:border-blue-500"
            />
            <ActionCard
              title="Histórico Completo"
              description="Revise todas análises anteriores."
              icon={<Activity className="w-6 h-6" />}
              onClick={onHistory}
              gradient="from-purple-500/20 to-pink-500/20"
              borderColor="border-purple-500/30"
              hoverColor="hover:border-purple-500"
            />
          </div>
        </Section>

        {/* FERRAMENTAS INTELIGENTES */}
        <Section title="Ferramentas inteligentes" delay="500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            <ToolCard
              title="Dashboard"
              description="Veja suas estatísticas"
              icon={<BarChart3 className="w-8 h-8" />}
              isPremium={true}
              onClick={onStats}
              featured={true}
            />
            <ToolCard
              title="Análise por PDF"
              description="Envie seu e-book para análise."
              icon={<FileText className="w-8 h-8" />}
              isPremium={isStarter || isPremium}
              onClick={() => (isStarter || isPremium) ? onAnalyzePDF() : handlePremiumClick("Análise por PDF")}
              planType="starter"
            />
            <ToolCard
              title="Análise por link"
              description="Cole sua página de vendas."
              icon={<Link className="w-8 h-8" />}
              isPremium={isPremium}
              onClick={() => isPremium ? onAnalyzeLink() : handlePremiumClick("Análise por Link")}
            />
            <ToolCard
              title="Análise por Imagem"
              description="Envie criativos e screenshots."
              icon={<ImageIcon className="w-8 h-8" />}
              isPremium={isPremium}
              onClick={() => isPremium ? onAnalyzeImage() : handlePremiumClick("Análise por Imagem")}
            />
            <ToolCard
              title="Calculadora de Lucro"
              description="Calcule margem e lucro líquido."
              icon={<DollarSign className="w-8 h-8" />}
              isPremium={isStarter || isPremium}
              onClick={() => (isStarter || isPremium) ? onProfitCalc() : handlePremiumClick("Calculadora")}
              planType="starter"
            />
            <ToolCard
              title="Break-even Calculator"
              description="Ponto de equilíbrio financeiro."
              icon={<Target className="w-8 h-8" />}
              isPremium={isPremium}
              onClick={() => isPremium ? onBreakEven() : handlePremiumClick("Break-even Calculator")}
              isNew={true}
            />
            <ToolCard
              title="Simulador de Descontos"
              description="Descubra se o desconto vale a pena."
              icon={<Percent className="w-8 h-8" />}
              isPremium={isPremium}
              onClick={() => isPremium ? onDiscountSimulator() : handlePremiumClick("Simulador de Descontos")}
              isNew={true}
            />
          </div>
        </Section>

        {/* FERRAMENTAS BUSINESS */}
        <Section 
          title="Ferramentas Business" 
          subtitle="Recursos exclusivos para maximizar resultados"
          icon={<Crown className="w-7 h-7 text-orange-400" />}
          delay="600"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <BusinessCard
              title="Comparador de Preços"
              description="Compare com até 5 concorrentes"
              icon={<PieChart className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onComparePrice() : handleBusinessClick("Comparador")}
            />
            <BusinessCard
              title="Simulador de Cenários"
              description="3 cenários automáticos"
              icon={<Repeat className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onPriceSimulator() : handleBusinessClick("Simulador")}
            />
            <BusinessCard
              title="Assistente IA 24/7"
              description="Chat especializado em pricing"
              icon={<Bot className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onChatAssistant() : handleBusinessClick("Assistente IA")}
            />
            <BusinessCard
              title="Dashboard Executivo"
              description="Relatório mensal em PDF"
              icon={<BarChart className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onExecutiveDashboard() : handleBusinessClick("Dashboard Executivo")}
            />
            <BusinessCard
              title="Análise em Lote"
              description="Upload CSV com múltiplos produtos"
              icon={<Package className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onBatchAnalysis() : handleBusinessClick("Análise em Lote")}
            />
            <BusinessCard
              title="Monitor de Preços"
              description="Rastreie concorrentes automaticamente"
              icon={<Bell className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onPriceMonitor() : handleBusinessClick("Monitor de Preços")}
            />
            <BusinessCard
              title="Integrações E-commerce"
              description="Conecte Shopify e WooCommerce"
              icon={<Link className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onIntegrations() : handleBusinessClick("Integrações")}
            />
            <BusinessCard
              title="Calculadora de ROI"
              description="Simule retorno de tráfego pago"
              icon={<Wallet className="w-8 h-8" />}
              isBusiness={isBusiness}
              onClick={() => isBusiness ? onTrafficROI() : handleBusinessClick("Calculadora de ROI")}
            />
          </div>
        </Section>

        {/* RECURSOS ADICIONAIS */}
        <Section title="Recursos adicionais" delay="700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <ResourceCard
              icon={<BookOpen className="w-10 h-10" />}
              title="Base de conhecimento"
              description="Aprenda as melhores estratégias de precificação com nossos guias especializados e cases de sucesso."
              color="from-emerald-500/20 to-teal-500/20"
            />
            <ResourceCard
              icon={<MessageCircle className="w-10 h-10" />}
              title="Suporte especializado"
              description="Tire suas dúvidas com nossa equipe de especialistas em pricing. Resposta em até 24h."
              color="from-blue-500/20 to-cyan-500/20"
            />
            <ResourceCard
              icon={<Bell className="w-10 h-10" />}
              title="Notificações inteligentes"
              description="Receba alertas automáticos sobre mudanças de preço da concorrência e oportunidades de mercado."
              color="from-purple-500/20 to-pink-500/20"
            />
          </div>
        </Section>

        {/* ANÁLISES RECENTES */}
        <div className="max-w-7xl mx-auto mt-16 sm:mt-20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-yellow-400" />
              Análises Recentes
            </h3>
            <button
              onClick={onHistory}
              className="text-sm text-yellow-400 hover:text-yellow-300 transition flex items-center gap-1"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {stats?.totalRequests === 0 ? (
          <EmptyState
            icon="📊"  // ← Volta pro emoji temporariamente
            title="Nenhuma análise ainda"
            description="Comece analisando seu primeiro produto usando as ferramentas acima!"
            actionLabel="Analisar Agora"
            onAction={onAnalyze}
          />
        ) : (
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-8">
              <p className="text-zinc-400 text-center">
                Suas últimas análises aparecerão aqui. 
                <button 
                  onClick={onHistory}
                  className="text-yellow-400 hover:text-yellow-300 ml-2 transition inline-flex items-center gap-1"
                >
                  Ver histórico completo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </p>
            </div>
          )}
        </div>

      </main>

      <SupportChat />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
}

// COMPONENTS

function Section({
  title,
  subtitle,
  icon,
  children,
  delay = "0"
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <section 
      className="max-w-7xl mx-auto mb-16 sm:mb-24 animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-8 sm:mb-10 space-y-2">
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-3">
          {icon}
          <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {title}
          </span>
        </h3>
        {subtitle && (
          <p className="text-zinc-400 text-base sm:text-lg pl-11">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function StatsCard({ 
  icon, 
  label, 
  value, 
  trend,
  delay = "0"
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend: string;
  delay?: string;
}) {
  return (
    <div 
      className="relative group animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-700/50 group-hover:border-zinc-600/50 transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:to-transparent rounded-2xl transition-all duration-500" />
      
      <div className="relative p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="transform group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          <p className="text-sm text-zinc-400 font-medium">{label}</p>
        </div>
        <p className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
          {value}
        </p>
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          {trend}
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
  gradient,
  borderColor,
  hoverColor,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  gradient: string;
  borderColor: string;
  hoverColor: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer group overflow-hidden rounded-2xl ${borderColor} ${hoverColor} border-2 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
      <div className="relative bg-zinc-900/90 backdrop-blur-sm p-6 sm:p-8 h-full">
        <div className="mb-4 text-zinc-400 group-hover:text-white transition-colors">
          {icon}
        </div>
        <h4 className="text-lg font-bold mb-2 group-hover:text-yellow-400 transition-colors">{title}</h4>
        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ToolCard({
  title,
  description,
  icon,
  isPremium,
  onClick,
  featured = false,
  isNew = false,
  planType = 'pro'
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isPremium: boolean;
  onClick: () => void;
  featured?: boolean;
  isNew?: boolean;
  planType?: 'starter' | 'pro' | 'business';
}) {
  if (isPremium) {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer relative group overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 ${
          featured 
            ? 'bg-gradient-to-br from-yellow-500/15 to-amber-500/15 border-2 border-yellow-500/40 hover:border-yellow-400 shadow-xl shadow-yellow-500/20' 
            : 'bg-zinc-900/60 border border-zinc-700/50 hover:border-zinc-600'
        }`}
      >
        {isNew && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 text-xs bg-green-500 text-white px-2.5 py-1 rounded-full font-bold shadow-lg z-10 animate-pulse">
            <Sparkles className="w-3 h-3" />
            NOVO
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
        <div className="relative p-6">
          <div className="mb-4 text-zinc-400 group-hover:text-yellow-400 transition-all duration-500 group-hover:scale-110">
            {icon}
          </div>
          <h4 className="text-sm font-bold mb-2 group-hover:text-yellow-400 transition-colors">{title}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer relative group overflow-hidden bg-zinc-900/40 border border-zinc-700/50 rounded-2xl transition-all duration-500 hover:scale-105"
    >
      <span className={`absolute top-3 right-3 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold shadow-lg z-10 ${
        planType === 'starter' ? 'bg-blue-500 text-white' : 
        planType === 'business' ? 'bg-purple-500 text-white' : 
        'bg-yellow-500 text-black'
      }`}>
        <Sparkles className="w-3 h-3" />
        {planType === 'starter' ? 'STARTER' : planType === 'business' ? 'BUSINESS' : 'PRO'}
      </span>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm rounded-2xl z-20">
        <div className="text-center px-4">
          <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <span className="text-yellow-400 text-sm font-bold block">Fazer Upgrade</span>
          <span className="text-zinc-400 text-xs">Plano Pro ou Business</span>
        </div>
      </div>
      <div className="relative p-6 opacity-50 group-hover:opacity-60 transition-opacity">
        <div className="mb-4 text-zinc-500">
          {icon}
        </div>
        <h4 className="text-sm font-bold mb-2 text-zinc-400">{title}</h4>
        <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BusinessCard({
  title,
  description,
  icon,
  isBusiness,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isBusiness: boolean;
  onClick?: () => void;
}) {
  if (isBusiness) {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer relative group overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/15 to-red-500/15 border-2 border-orange-500/40 hover:border-orange-400 transition-all duration-500 hover:scale-105 shadow-xl shadow-orange-500/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative p-6 sm:p-7">
          <div className="mb-4 text-orange-400 group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          <h4 className="text-sm font-bold mb-2 group-hover:text-orange-300 transition-colors">{title}</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer relative group overflow-hidden bg-zinc-900/40 border-2 border-orange-500/40 rounded-2xl transition-all duration-500 hover:scale-105"
    >
      <span className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-1 rounded-full font-bold shadow-lg z-10">
        <Crown className="w-3 h-3" />
        BUSINESS
      </span>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm rounded-2xl z-20">
        <div className="text-center px-4">
          <Crown className="w-10 h-10 text-orange-400 mx-auto mb-2" />
          <span className="text-orange-400 text-sm font-bold block">Upgrade Business</span>
          <span className="text-zinc-400 text-xs">Recursos ilimitados</span>
        </div>
      </div>
      <div className="relative p-6 sm:p-7 opacity-50 group-hover:opacity-60 transition-opacity">
        <div className="mb-4 text-zinc-500">
          {icon}
        </div>
        <h4 className="text-sm font-bold mb-2 text-zinc-400">{title}</h4>
        <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ResourceCard({ 
  icon, 
  title, 
  description,
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-zinc-700/50 hover:border-zinc-600 transition-all duration-500 hover:scale-[1.02]">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
      <div className="relative bg-zinc-900/80 backdrop-blur-sm p-8">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 text-zinc-400 group-hover:text-white">
          {icon}
        </div>
        <h4 className="font-bold text-lg mb-3 group-hover:text-yellow-400 transition-colors">{title}</h4>
        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">{description}</p>
      </div>
    </div>
  );
}