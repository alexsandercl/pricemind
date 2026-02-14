console.log("PROFILE FILE LOADED");
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import AvatarCropper from "../components/AvatarCropper";
import { useTranslation } from "../contexts/LanguageContext";
import { 
  User, 
  Crown, 
  TrendingUp, 
  Clock, 
  Shield, 
  Settings, 
  Award,
  Activity,
  BarChart3,
  ChevronRight,
  Sparkles,
  Zap
} from "lucide-react";
import Toast, { useToast, ToastContainer } from "../components/ui/Toast";
import { Loader2, CheckCircle, Sparkles as SparklesIcon, Shield as ShieldIcon } from "lucide-react";

type Profile = {
  name: string | null;
  plan: string;
  avatarUrl?: string | null;
};

type Stats = {
  totalRequests: number;
  lastAccessAt?: string | null;
};

type Preferences = {
  theme: "dark" | "light" | "system";
  language: "pt-BR" | "en-US";
};

export default function Profile({
  onBack,
  onLogout,
  onThemeChange,
}: {
  onBack: () => void;
  onLogout: () => void;
  onThemeChange?: (theme: string) => void;
}) {
  const { t, setLanguage } = useTranslation();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [preferences, setPreferences] = useState<Preferences>({
    theme: "dark",
    language: "pt-BR",
  });

  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "plan" | "usage" | "activity" | "security">("profile");

  const toast = useToast();

  // Helper para tradução com fallback
  const getText = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, statsRes, prefsRes] = await Promise.all([
          api.get("/profile"),
          api.get("/stats"),
          api.get("/preferences"),
        ]);

        setProfile(profileRes.data);
        setStats(statsRes.data);
        setPreferences(prefsRes.data);

        setLanguage(prefsRes.data.language || "pt-BR");

        if (profileRes.data.avatarUrl) {
          setAvatarPreview(profileRes.data.avatarUrl);
          setImageError(false);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setLanguage]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImage(URL.createObjectURL(file));
  }

  async function handleAvatarConfirm(file: File) {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await api.put("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImageError(false);
      setAvatarPreview(res.data.avatarUrl);
      setProfile((prev) =>
        prev ? { ...prev, avatarUrl: res.data.avatarUrl } : null
      );
      setCropImage(null);
    } catch (error) {
      console.error("❌ Erro ao fazer upload:", error);
    }
  }

  async function handleRemoveAvatar() {
    try {
      await api.delete("/profile/avatar");
      setAvatarPreview(null);
      setImageError(false);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : null));
    } catch (error) {
      console.error("❌ Erro ao remover avatar:", error);
    }
  }

  function handleImageError() {
    setImageError(true);
  }

  function handleImageLoad() {
    setImageError(false);
  }

  function updatePreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSavePreferences() {
    setSavingPrefs(true);
    setSuccessMessage(null);

    try {
      await api.put("/preferences", preferences);

      if (onThemeChange) {
        onThemeChange(preferences.theme);
      }

      setLanguage(preferences.language);

      setSuccessMessage(getText("profile.preferencesSaved", "✓ Preferências salvas com sucesso"));
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      setSuccessMessage(getText("profile.preferencesSaveError", "Erro ao salvar preferências"));
    } finally {
      setSavingPrefs(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-zinc-400 text-lg">{getText("common.loading", "Carregando...")}</p>
        </div>
      </div>
    );
  }

  const isPremium = profile?.plan === "pro" || profile?.plan === "business";
  const isBusiness = profile?.plan === "business";
  const planLimit = isBusiness ? "∞" : isPremium ? "100" : "10";
  const monthlyUsed = stats?.totalRequests || 0;
  const usagePercent = isBusiness ? 0 : (monthlyUsed / parseInt(planLimit)) * 100;

  // Badges/Conquistas simuladas
  const achievements = [
    { 
      id: 1, 
      name: "Primeira Análise", 
      icon: "🎯", 
      unlocked: (stats?.totalRequests || 0) >= 1,
      description: "Complete sua primeira análise"
    },
    { 
      id: 2, 
      name: "Analista", 
      icon: "📊", 
      unlocked: (stats?.totalRequests || 0) >= 10,
      description: "Complete 10 análises"
    },
    { 
      id: 3, 
      name: "Premium", 
      icon: "💎", 
      unlocked: isPremium,
      description: "Torne-se Premium"
    },
    { 
      id: 4, 
      name: "Expert", 
      icon: "🏆", 
      unlocked: (stats?.totalRequests || 0) >= 50,
      description: "Complete 50 análises"
    },
  ];

  return (
    <>
      {cropImage && (
        <AvatarCropper
          image={cropImage}
          onCancel={() => setCropImage(null)}
          onConfirm={handleAvatarConfirm}
        />
      )}

      <div className="gold-bg" />
      <ToastContainer>
        {toast.toasts.map(t => (
          <Toast
            key={t.id}
            {...t}
            onClose={() => toast.remove(t.id!)}
          />
        ))}
      </ToastContainer>

      <div className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-6 sm:pt-8 pb-12 sm:pb-20 text-white">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-fadeIn">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-yellow-400 transition group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            {getText("common.back", "Voltar")}
          </button>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition"
          >
            {getText("common.logout", "Sair")}
          </button>
        </div>

        {/* HERO SECTION */}
        <div 
          className="max-w-7xl mx-auto mb-8 sm:mb-12 animate-slideUp"
          style={{ animationDelay: '100ms' }}
        >
          <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/50 backdrop-blur-xl border border-zinc-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }} />
            </div>

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
              {/* Avatar Grande */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-4xl sm:text-5xl font-semibold overflow-hidden ring-4 ring-zinc-700/50 group-hover:ring-yellow-500/50 transition-all duration-500">
                  {avatarPreview && !imageError ? (
                    <img
                      key={avatarPreview}
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  ) : (
                    <span className="text-zinc-400">
                      {profile?.name?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                
                {/* Badge do Plano */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  {isBusiness ? (
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg shadow-orange-500/50 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      BUSINESS
                    </div>
                  ) : isPremium ? (
                    <div className="px-3 py-1 rounded-full bg-yellow-500 text-black text-xs font-bold shadow-lg shadow-yellow-500/50 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      PRO
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-zinc-700 text-white text-xs font-semibold">
                      FREE
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  {profile?.name}
                </h1>
                <p className="text-zinc-400 mb-4 sm:mb-6 text-sm sm:text-base">
                  {getText("profile.memberSince", "Membro desde")} {stats?.lastAccessAt ? new Date(stats.lastAccessAt).toLocaleDateString() : "—"}
                </p>

                {/* Quick Stats */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <QuickStat 
                    icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
                    label={getText("profile.analysesCompleted", "Análises")}
                    value={stats?.totalRequests?.toString() || "0"}
                  />
                  <QuickStat 
                    icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                    label={getText("profile.planLimit", "Limite")}
                    value={`${monthlyUsed}/${planLimit}`}
                  />
                  <QuickStat 
                    icon={<Award className="w-4 h-4 sm:w-5 sm:h-5" />}
                    label={getText("profile.achievements", "Conquistas")}
                    value={`${achievements.filter(a => a.unlocked).length}/${achievements.length}`}
                  />
                </div>
              </div>

              {/* Progress Bar */}
              {!isBusiness && (
                <div className="w-full sm:w-64 mt-4 sm:mt-0">
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-zinc-400">{getText("profile.monthlyUsage", "Uso Mensal")}</span>
                      <span className="text-xs font-semibold text-yellow-400">{Math.round(usagePercent)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {monthlyUsed} de {planLimit} análises usadas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div 
          className="max-w-7xl mx-auto mb-6 sm:mb-8 animate-fadeIn"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex flex-wrap gap-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl sm:rounded-2xl p-2">
            <TabButton 
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
              icon={<User className="w-4 h-4" />}
              label={getText("profile.profileTab", "Perfil")}
            />
            <TabButton 
              active={activeTab === "plan"}
              onClick={() => setActiveTab("plan")}
              icon={<Crown className="w-4 h-4" />}
              label={getText("profile.planTab", "Meu Plano")}
            />
            <TabButton 
              active={activeTab === "usage"}
              onClick={() => setActiveTab("usage")}
              icon={<TrendingUp className="w-4 h-4" />}
              label={getText("profile.usageTab", "Uso & Stats")}
            />
            <TabButton 
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
              icon={<Activity className="w-4 h-4" />}
              label={getText("profile.activityTab", "Atividade")}
            />
            <TabButton 
              active={activeTab === "security"}
              onClick={() => setActiveTab("security")}
              icon={<Shield className="w-4 h-4" />}
              label={getText("profile.securityTab", "Segurança")}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div 
          className="max-w-7xl mx-auto animate-fadeIn"
          style={{ animationDelay: '300ms' }}
        >
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Avatar Section */}
              <GlassCard title={getText("profile.photoTitle", "Foto de Perfil")} icon={<User className="w-5 h-5" />}>
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-zinc-700 flex items-center justify-center text-4xl sm:text-5xl font-semibold overflow-hidden ring-4 ring-zinc-700/50 hover:ring-yellow-500/50 transition-all duration-500">
                    {avatarPreview && !imageError ? (
                      <img
                        key={avatarPreview}
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                      />
                    ) : (
                      <span className="text-zinc-400">
                        {profile?.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
                    >
                      {getText("profile.changePhoto", "Alterar Foto")}
                    </button>

                    {avatarPreview && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-zinc-600 text-sm text-zinc-300 hover:border-red-400 hover:text-red-400 transition"
                      >
                        {getText("profile.removePhoto", "Remover")}
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Account Info */}
              <GlassCard title={getText("profile.accountInfo", "Informações da Conta")} icon={<Settings className="w-5 h-5" />}>
                <div className="space-y-6">
                  <InfoRow
                    label={getText("profile.name", "Nome")}
                    value={profile?.name || "—"}
                  />
                  <InfoRow
                    label={getText("profile.currentPlan", "Plano Atual")}
                    value={
                      profile?.plan === "pro"
                        ? getText("home.planPro", "Pro")
                        : profile?.plan === "business"
                        ? getText("home.planBusiness", "Business")
                        : getText("home.planFree", "Free")
                    }
                    badge={isPremium}
                  />
                  <InfoRow
                    label={getText("profile.analysesCompleted", "Análises Realizadas")}
                    value={stats?.totalRequests?.toString() || "0"}
                  />
                  <InfoRow
                    label={getText("profile.accountStatus", "Status da Conta")}
                    value={getText("profile.active", "Ativo")}
                    status="active"
                  />
                </div>
              </GlassCard>

              {/* Preferences */}
              <GlassCard title={getText("profile.preferences", "Preferências")} icon={<Settings className="w-5 h-5" />} fullWidth>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <PreferenceSelect
                      label={getText("profile.theme", "Tema")}
                      value={preferences.theme}
                      options={[
                        { value: "dark", label: getText("profile.themeDark", "Escuro") },
                        { value: "light", label: getText("profile.themeLight", "Claro") },
                        { value: "system", label: getText("profile.themeSystem", "Sistema") },
                      ]}
                      onChange={(v) => updatePreference("theme", v)}
                    />

                    <PreferenceSelect
                      label={getText("profile.language", "Idioma")}
                      value={preferences.language}
                      options={[
                        { value: "pt-BR", label: getText("profile.languagePortuguese", "Português") },
                        { value: "en-US", label: getText("profile.languageEnglish", "Inglês") },
                      ]}
                      onChange={(v) => updatePreference("language", v)}
                    />
                  </div>

                  {successMessage && (
                    <div className={`p-4 rounded-xl border ${
                      successMessage.includes("✓")
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                      {successMessage}
                    </div>
                  )}

                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPrefs}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
                  >
                    {savingPrefs ? getText("profile.saving", "Salvando...") : getText("profile.savePreferences", "Salvar Preferências")}
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === "plan" && (
            <PlanTab plan={profile?.plan || "free"} />
          )}

          {activeTab === "usage" && (
            <UsageTab stats={stats} plan={profile?.plan || "free"} />
          )}

          {activeTab === "activity" && (
            <ActivityTab achievements={achievements} />
          )}

          {activeTab === "security" && (
            <SecurityTab />
          )}
        </div>
      </div>

      <style>{`
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(30px);
        }

        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// COMPONENTS

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="p-2 rounded-lg bg-zinc-800/50 text-yellow-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-base sm:text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm ${
        active 
          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GlassCard({ 
  title, 
  icon, 
  children, 
  fullWidth = false 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  fullWidth?: boolean;
}) {
  return (
    <div className={`bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-zinc-600/50 transition-all ${fullWidth ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  badge = false, 
  status 
}: { 
  label: string; 
  value: string; 
  badge?: boolean; 
  status?: "active";
}) {
  return (
    <div className="flex justify-between items-center p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm sm:text-base">{value}</span>
        {badge && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">💎</span>}
        {status === "active" && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>}
      </div>
    </div>
  );
}

function PreferenceSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-sm text-zinc-300 mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm hover:border-zinc-600 focus:border-yellow-500 focus:outline-none transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// TABS


function PlanTab({ plan }: { plan: string }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [buttonStates, setButtonStates] = useState<Record<string, "idle" | "loading" | "redirecting" | "error">>({
    starter: "idle",
    pro: "idle",
    business: "idle"
  });
  const toast = useToast();
  const handlePlanAction = async (targetPlan: string, current: boolean) => {
    if (current) return;
    
    if (targetPlan === "free") {
      toast.warning(
        "Downgrade para Free",
        "Entre em contato com o suporte para fazer downgrade"
      );
      return;
    }
    
    try {
      setLoadingPlan(targetPlan);
      setButtonStates((prev) => ({ ...prev, [targetPlan]: 'loading' }));

      const loadingToastId = toast.loading(
        'Processando upgrade',
        'Gerando link de pagamento seguro...'
      );

      const response = await api.get(`/checkout/url/${targetPlan}`);
      
      toast.remove(loadingToastId);

      toast.checkout(
        'Link gerado com sucesso!',
        'Redirecionando para pagamento...'
      );

      setButtonStates((prev) => ({ ...prev, [targetPlan]: 'redirecting' }));

      setTimeout(() => {
        window.location.href = response.data.url;
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao gerar checkout:", error);
      
      setButtonStates((prev) => ({ ...prev, [targetPlan]: 'error' }));
      
      const errorMessage = error?.response?.data?.error || 'Erro ao processar upgrade';
      toast.error('Erro ao processar', errorMessage);
      
      setTimeout(() => {
        setLoadingPlan(null);
        setButtonStates((prev) => ({ ...prev, [targetPlan]: 'idle' }));
      }, 3000);
    }
  };

  const getButtonContent = (planId: string, defaultText: string, current: boolean) => {
    if (current) {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Plano Atual</span>
        </>
      );
    }

    const state = buttonStates[planId] || "idle";
    
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processando</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-loading-dot"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-loading-dot"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-loading-dot"></div>
            </div>
          </>
        );

      case 'redirecting':
        return (
          <>
            <CheckCircle className="w-4 h-4 animate-check-mark" />
            <span>Redirecionando</span>
            <SparklesIcon className="w-4 h-4 animate-pulse" />
          </>
        );

      case 'error':
        return (
          <>
            <span className="text-red-400">❌</span>
            <span>Erro! Tente novamente</span>
          </>
        );

      default:
        return <span>{defaultText}</span>;
    }
  };

  const isButtonDisabled = (planId: string, current: boolean): boolean => {
    return current || (buttonStates[planId] || "idle") !== "idle" || loadingPlan !== null;
  };

  const plans = [
    {
      name: "Free",
      price: "R$ 0",
      features: ["10 análises/mês", "Análise básica", "Dashboard simples"],
      current: plan === "free",
      cta: plan === "free" ? "Plano Atual" : "Downgrade",
      planId: "free"
    },
    {
      name: "Starter",
      price: "R$ 27",
      features: ["30 análises/mês", "6 ferramentas", "Break-even Calculator", "Histórico ilimitado"],
      current: plan === "starter",
      cta: plan === "free" ? "Fazer Upgrade" : 
           plan === "starter" ? "Plano Atual" : 
           "Downgrade",
      planId: "starter",
      badge: "NOVO!"
    },
    {
      name: "Pro",
      price: "R$ 67",
      features: ["100 análises/mês", "11 ferramentas", "PDF/Link/Imagem", "Comparador 3x"],
      current: plan === "pro",
      cta: plan === "free" || plan === "starter" ? "Fazer Upgrade" : 
           plan === "pro" ? "Plano Atual" : 
           "Downgrade",
      popular: true,
      planId: "pro"
    },
    {
      name: "Business",
      price: "R$ 247",
      features: ["Análises ilimitadas", "19 ferramentas", "Monitor 24/7", "Suporte VIP"],
      current: plan === "business",
      cta: plan === "business" ? "Plano Atual" : "Fazer Upgrade",
      planId: "business"
    }
  ];

  return (
    <>
      <ToastContainer>
        {toast.toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => toast.remove(t.id!)} />
        ))}
      </ToastContainer>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((p) => (
        <div 
          key={p.name}
          className={`relative bg-zinc-900/60 backdrop-blur-xl border-2 rounded-xl p-6 transition-all ${
            p.current 
              ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' 
              : 'border-zinc-700/50 hover:border-zinc-600'
          }`}
        >
          {p.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
              POPULAR
            </div>
          )}
          {p.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
              {p.badge}
            </div>
          )}
          
          <h3 className="text-lg font-bold mb-2">{p.name}</h3>
          <p className="text-2xl font-bold text-yellow-400 mb-4">{p.price}<span className="text-xs text-zinc-400">/mês</span></p>
          
          <ul className="space-y-2 mb-6">
            {p.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                <span className="text-green-400 mt-0.5">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <button 
            onClick={() => handlePlanAction(p.planId, p.current)}
            disabled={isButtonDisabled(p.planId, p.current)}
            className={`
              relative w-full py-2.5 rounded-xl font-bold transition-all transform text-sm
              flex items-center justify-center gap-2
              ${p.current
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : (buttonStates[p.planId] || "idle") === "idle"
                ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 hover:scale-105'
                : (buttonStates[p.planId] || "idle") === "redirecting"
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
              }
              disabled:transform-none
              overflow-hidden
              group/btn
            `}
          >
            {(buttonStates[p.planId] || "idle") === "idle" && !p.current && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
            
            <div className="relative z-10 flex items-center gap-2">
              {getButtonContent(p.planId, p.cta, p.current)}
            </div>
          </button>

          {(buttonStates[p.planId] || "idle") === "idle" && !p.current && (
            <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mt-2">
              <ShieldIcon className="w-3 h-3 text-green-400" />
              <span>Pagamento 100% Seguro</span>
            </div>
          )}
        </div>
      ))}
    </div>
    </>
  );
}
function UsageTab({ stats, plan }: { stats: Stats | null; plan: string }) {
  const totalAnalyses = stats?.totalRequests || 0;
  const monthlyLimit = plan === "business" ? "∞" : plan === "pro" ? 100 : 10;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <GlassCard title="Estatísticas de Uso" icon={<BarChart3 className="w-5 h-5" />}>
        <div className="space-y-6">
          <StatItem label="Total de Análises" value={totalAnalyses.toString()} trend="+15% este mês" />
          <StatItem label="Limite Mensal" value={monthlyLimit.toString()} />
          <StatItem label="Média Diária" value={Math.round(totalAnalyses / 30).toString()} />
        </div>
      </GlassCard>

      <GlassCard title="Uso nos Últimos 6 Meses" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="space-y-3">
          {[12, 15, 8, 20, 18, 22].map((val, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-16">Mês {i + 1}</span>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                  style={{ width: `${(val / 30) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-zinc-300 w-8">{val}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ActivityTab({ achievements }: { achievements: any[] }) {
  return (
    <div className="space-y-8">
      <GlassCard title="Conquistas" icon={<Award className="w-5 h-5" />} fullWidth>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-5 sm:p-6 rounded-xl border-2 text-center transition-all ${
                achievement.unlocked
                  ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                  : 'bg-zinc-800/30 border-zinc-700/30 opacity-50'
              }`}
            >
              <div className="text-3xl sm:text-4xl mb-3">{achievement.icon}</div>
              <h4 className="font-bold mb-1 text-sm">{achievement.name}</h4>
              <p className="text-xs text-zinc-400">{achievement.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Atividade Recente" icon={<Clock className="w-5 h-5" />} fullWidth>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Análise de Produto #{i}</p>
                <p className="text-xs text-zinc-400">Há {i} dias</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async () => {
    setMessage(null);

    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Preencha todos os campos" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "A senha deve ter no mínimo 6 caracteres" });
      return;
    }

    setLoading(true);

    try {
      const response = await api.put("/profile/password", {
        currentPassword,
        newPassword,
      });

      setMessage({ type: "success", text: response.data.message || "Senha alterada com sucesso!" });
      
      // Limpar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Erro ao alterar senha" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <GlassCard title="Alterar Senha" icon={<Shield className="w-5 h-5" />}>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none transition"
          />
          <input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none transition"
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none transition"
          />

          {message && (
            <div className={`p-4 rounded-xl border ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>
              {message.text}
            </div>
          )}

          <button 
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 shadow-lg shadow-yellow-500/20 text-sm sm:text-base"
          >
            {loading ? "Atualizando..." : "Atualizar Senha"}
          </button>
        </div>
      </GlassCard>

      <GlassCard title="Sessões Ativas" icon={<Activity className="w-5 h-5" />}>
        <div className="space-y-3">
          {[
            { device: "Chrome - Windows", location: "São Paulo, BR", current: true },
            { device: "Mobile - iOS", location: "Rio de Janeiro, BR", current: false },
          ].map((session, i) => (
            <div key={i} className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">{session.device}</p>
                  <p className="text-xs text-zinc-400">{session.location}</p>
                </div>
                {session.current && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                    Atual
                  </span>
                )}
              </div>
              {!session.current && (
                <button className="text-xs text-red-400 hover:text-red-300 transition">
                  Encerrar sessão
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function StatItem({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-xl sm:text-2xl font-bold">{value}</p>
        {trend && <span className="text-xs text-green-400">{trend}</span>}
      </div>
    </div>
  );
}