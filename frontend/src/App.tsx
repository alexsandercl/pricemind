import { useEffect, useState } from "react";
import { api } from "./services/api";
import { Eye, EyeOff, Sparkles, Lock, Mail, ArrowRight } from "lucide-react";

// LANDING PAGE (PÚBLICO)
import LandingPage from "./pages/LandingPage";

// SISTEMA (AUTENTICADO)
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Stats from "./pages/Stats";
import History from "./pages/History";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// FERRAMENTAS PREMIUM
import AnalyzePDF from "./pages/AnalyzePDF";
import AnalyzeLink from "./pages/AnalyzeLink";
import AnalyzeImage from "./pages/AnalyzeImage";
import ProfitCalculator from "./pages/ProfitCalculator";

// 🆕 NOVAS FERRAMENTAS PRO
import BreakEvenCalculator from "./pages/BreakEvenCalculator";
import DiscountSimulator from "./pages/DiscountSimulator";

// FERRAMENTAS BUSINESS
import ComparePrice from "./pages/ComparePrice";
import PriceSimulator from "./pages/PriceSimulator";
import ChatAssistant from "./pages/ChatAssistant";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import BatchAnalysis from "./pages/BatchAnalysis";
import PriceMonitor from "./pages/PriceMonitor";
import Integrations from "./pages/Integrations";
import TrafficROICalculator from "./pages/TrafficROICalculator";

// PAINEL ADMIN
import AdminPanel from "./pages/AdminPanel";

// 🆕 PÁGINAS KIWIFY
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";

type Screen =
  | "landing"
  | "login"
  | "register"
  | "pricing"
  | "onboarding"
  | "home"
  | "dashboard"
  | "profile"
  | "stats"
  | "history"
  | "compare-price"
  | "price-simulator"
  | "chat-assistant"
  | "executive-dashboard"
  | "batch-analysis"
  | "price-monitor"
  | "integrations"
  | "analyze-pdf"
  | "analyze-link"
  | "analyze-image"
  | "profit-calculator"
  | "break-even"
  | "discount-simulator"
  | "admin"
  | "forgot-password"
  | "reset-password"
  | "checkout"
  | "traffic-roi"
  | "success";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<string>("dark");
  const [initialLoading, setInitialLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"starter" | "pro" | "business">("pro");

  useEffect(() => {
    async function checkAuth() {
      const params = new URLSearchParams(window.location.search);
      
      if (params.get("order_id") || params.get("status")) {
        setScreen("success");
        setInitialLoading(false);
        return;
      }
      
      if (params.get("token")) {
        setScreen("reset-password");
        setInitialLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      
      if (token) {
        try {
          const profileRes = await api.get("/profile");
          
          const userData = {
            id: profileRes.data.id,
            name: profileRes.data.name,
            email: profileRes.data.email,
            role: profileRes.data.role || "user",
            plan: profileRes.data.plan || "free"
          };
          localStorage.setItem("user", JSON.stringify(userData));
          
          setUserRole(profileRes.data.role || "user");
          console.log("👤 User role carregado:", profileRes.data.role);
          
          setScreen("home");
          loadTheme();
        } catch (error) {
          console.log("❌ Token inválido, fazendo logout");
          localStorage.clear();
          setScreen("landing");
        }
      } else {
        setScreen("landing");
      }
      
      setInitialLoading(false);
    }

    checkAuth();
  }, []);

  async function loadTheme() {
    try {
      const res = await api.get("/preferences");
      setTheme(res.data.theme);
      applyTheme(res.data.theme);
    } catch (error) {
      console.error("Erro ao carregar tema:", error);
    }
  }

  function applyTheme(newTheme: string) {
    const root = document.documentElement;

    if (newTheme === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }

    setTheme(newTheme);
  }

  function handleThemeChange(newTheme: string) {
    applyTheme(newTheme);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      
      const profileRes = await api.get("/profile");
      
      const userData = {
        id: profileRes.data.id,
        name: profileRes.data.name,
        email: profileRes.data.email,
        role: profileRes.data.role || "user",
        plan: profileRes.data.plan || "free"
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUserRole(profileRes.data.role || "user");
      console.log("👤 User role após login:", profileRes.data.role);
      
      setScreen("home");
      loadTheme();
    } catch {
      setError("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  function handleRegisterSuccess() {
    setScreen("onboarding");
  }

  function handleFinishOnboarding() {
    console.log('✅ Onboarding finalizado');
    setScreen("home");
  }

  function handleLogout() {
    localStorage.clear();
    setEmail("");
    setPassword("");
    setUserRole("user");
    setScreen("landing");
    applyTheme("dark");
  }

  function handleResetSuccess() {
    alert("Senha redefinida com sucesso! Faça login com sua nova senha.");
    setScreen("login");
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // ================= ROTAS PÚBLICAS =================

  if (screen === "landing") {
    return (
      <LandingPage 
        onLogin={() => setScreen("login")}
        onRegister={() => setScreen("register")}
      />
    );
  }

  if (screen === "register") {
    return (
      <Register
        onSuccess={handleRegisterSuccess}
      />
    );
  }

  if (screen === "onboarding") {
    return (
      <Onboarding
        onFinish={handleFinishOnboarding}
      />
    );
  }

  if (screen === "forgot-password") {
    return (
      <ForgotPassword 
        onBack={() => setScreen("login")}
      />
    );
  }

  if (screen === "reset-password") {
    return (
      <ResetPassword 
        onSuccess={handleResetSuccess}
      />
    );
  }

  if (screen === "pricing") {
    return (
      <Pricing 
        onBack={() => setScreen("home")}
        onCheckout={(plan) => {
          setCheckoutPlan(plan);
          setScreen("checkout");
        }}
      />
    );
  }

  if (screen === "checkout") {
    return (
      <Checkout 
        plan={checkoutPlan}
        onBack={() => setScreen("pricing")}
      />
    );
  }

  if (screen === "success") {
    return (
      <Success 
        onGoToDashboard={() => setScreen("home")}
        onGoToHome={() => setScreen("landing")}
      />
    );
  }

  // ================= SISTEMA AUTENTICADO =================

  if (screen === "home") {
    return (
      <Home
        onAnalyze={() => setScreen("dashboard")}
        onProfile={() => setScreen("profile")}
        onStats={() => setScreen("stats")}
        onHistory={() => setScreen("history")}
        onComparePrice={() => setScreen("compare-price")}
        onPriceSimulator={() => setScreen("price-simulator")}
        onChatAssistant={() => setScreen("chat-assistant")}
        onExecutiveDashboard={() => setScreen("executive-dashboard")}
        onBatchAnalysis={() => setScreen("batch-analysis")}
        onPriceMonitor={() => setScreen("price-monitor")}
        onIntegrations={() => setScreen("integrations")}
        onTrafficROI={() => setScreen("traffic-roi")}
        onAnalyzePDF={() => setScreen("analyze-pdf")}
        onAnalyzeLink={() => setScreen("analyze-link")}
        onAnalyzeImage={() => setScreen("analyze-image")}
        onProfitCalc={() => setScreen("profit-calculator")}
        onBreakEven={() => setScreen("break-even")}
        onDiscountSimulator={() => setScreen("discount-simulator")}
        onAdmin={() => setScreen("admin")}
        onPricing={() => setScreen("pricing")}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "dashboard") {
    return <Dashboard onBack={() => setScreen("home")} onLogout={function (): void {
      throw new Error("Function not implemented.");
    } } />;
  }

  if (screen === "profile") {
    return (
      <Profile 
        onBack={() => setScreen("home")}
        onThemeChange={handleThemeChange}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "stats") {
    return <Stats onBack={() => setScreen("home")} />;
  }

  if (screen === "history") {
    return <History onBack={() => setScreen("home")} />;
  }

  // FERRAMENTAS PREMIUM
  if (screen === "analyze-pdf") {
    return <AnalyzePDF onBack={() => setScreen("home")} />;
  }

  if (screen === "analyze-link") {
    return <AnalyzeLink onBack={() => setScreen("home")} />;
  }

  if (screen === "analyze-image") {
    return <AnalyzeImage onBack={() => setScreen("home")} />;
  }

  if (screen === "profit-calculator") {
    return <ProfitCalculator onBack={() => setScreen("home")} />;
  }

  // 🆕 NOVAS FERRAMENTAS PRO
  if (screen === "break-even") {
    return <BreakEvenCalculator onBack={() => setScreen("home")} />;
  }

  if (screen === "discount-simulator") {
    return <DiscountSimulator onBack={() => setScreen("home")} />;
  }

  // FERRAMENTAS BUSINESS
  if (screen === "compare-price") {
    return <ComparePrice onBack={() => setScreen("home")} />;
  }

  if (screen === "price-simulator") {
    return <PriceSimulator onBack={() => setScreen("home")} />;
  }

  if (screen === "chat-assistant") {
    return <ChatAssistant onBack={() => setScreen("home")} />;
  }

  if (screen === "executive-dashboard") {
    return <ExecutiveDashboard onBack={() => setScreen("home")} />;
  }

  if (screen === "batch-analysis") {
    return <BatchAnalysis onBack={() => setScreen("home")} />;
  }

  if (screen === "price-monitor") {
    return <PriceMonitor onBack={() => setScreen("home")} />;
  }

  if (screen === "integrations") {
    return <Integrations onBack={() => setScreen("home")} />;
  }

  if (screen === "traffic-roi") {
    return <TrafficROICalculator onBack={() => setScreen("home")} />;
  }

  // ADMIN
  if (screen === "admin") {
    return <AdminPanel onBack={() => setScreen("home")} />;
  }

  // ================= LOGIN SCREEN =================
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="gold-bg" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-yellow-600/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-8 lg:px-20 py-8">
        
        <div className="w-full max-w-md">
          <button
            onClick={() => setScreen("landing")}
            className="mb-6 text-zinc-400 hover:text-yellow-400 transition flex items-center gap-2"
          >
            ← Voltar para home
          </button>

          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-3xl blur-2xl opacity-20" />
            
            <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl mb-4 shadow-lg shadow-yellow-500/30">
                  <Sparkles className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Entrar na plataforma
                </h3>
                <p className="text-zinc-400 text-sm">
                  Bem-vindo de volta! Entre para continuar.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-yellow-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3.5 bg-black/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-400" />
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 bg-black/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-yellow-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setScreen("forgot-password")}
                    className="text-sm text-zinc-400 hover:text-yellow-400 transition-colors font-medium"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative px-6 py-3.5 flex items-center justify-center gap-2 text-black font-bold">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-zinc-900 text-zinc-500 font-medium">
                    Novo por aqui?
                  </span>
                </div>
              </div>

              <button
                onClick={() => setScreen("register")}
                className="w-full px-6 py-3.5 border-2 border-yellow-500/40 hover:border-yellow-500 hover:bg-yellow-500/5 text-yellow-400 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Criar conta gratuita
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
            opacity: 0.5;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}