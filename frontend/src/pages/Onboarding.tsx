import { useState } from "react";
import { api } from "../services/api";
import { 
  Rocket, 
  Target, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Sparkles,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check
} from "lucide-react";

type OnboardingData = {
  objetivo: string;
  tipoNegocio: string;
  experiencia: string;
  faixaPreco: string;
  idioma: string;
  tema: string;
  emailNotifications: boolean;
};

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    objetivo: "",
    tipoNegocio: "",
    experiencia: "",
    faixaPreco: "",
    idioma: "pt",
    tema: "dark",
    emailNotifications: true,
  });

  const totalSteps = 10;

  async function handleFinish() {
    setLoading(true);
    try {
      console.log('🚀 Salvando onboarding...', data);
      await api.post("/onboarding", data);
      console.log('✅ Onboarding salvo com sucesso!');
      
      // Mostrar mensagem de sucesso
      setLoading(false);
      setSuccess(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        console.log('📍 Redirecionando para home...');
        onFinish();
      }, 2000);
    } catch (error) {
      console.error("❌ Erro ao salvar onboarding:", error);
      alert('Erro ao salvar configurações. Tente novamente.');
      setLoading(false);
    }
  }

  function nextStep() {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  // Validar se pode avançar
  function canProceed(): boolean {
    switch (step) {
      case 1: return true;
      case 2: return data.objetivo !== "";
      case 3: return data.tipoNegocio !== "";
      case 4: return data.experiencia !== "";
      case 5: return data.faixaPreco !== "";
      case 6:
      case 7:
      case 8:
      case 9: return true;
      case 10: return true;
      default: return false;
    }
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-8 text-white">
        <div className="max-w-2xl w-full">
          
          {/* PROGRESS BAR */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-400">Passo {step} de {totalSteps}</p>
              <p className="text-sm text-yellow-400">{Math.round((step / totalSteps) * 100)}%</p>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* CARD PRINCIPAL */}
          <div className="bg-zinc-900/90 border border-zinc-700 rounded-3xl p-12 shadow-2xl">
            
            {/* STEP 1: BEM-VINDO */}
            {step === 1 && (
              <div className="text-center animate-fadeIn">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="text-yellow-400" size={40} />
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Bem-vindo ao PriceMind 🚀
                </h2>
                <p className="text-zinc-400 text-lg mb-8">
                  Vamos personalizar sua experiência em menos de 2 minutos.
                  Responda algumas perguntas para começar!
                </p>
              </div>
            )}

            {/* STEP 2: OBJETIVO */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <Target className="text-yellow-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Qual seu principal objetivo?</h2>
                </div>
                
                <div className="space-y-3">
                  {[
                    { value: "validar", label: "Validar preço de um produto existente", emoji: "✅" },
                    { value: "aumentar", label: "Aumentar meu lucro", emoji: "💰" },
                    { value: "entender", label: "Entender melhor meu mercado", emoji: "📊" },
                    { value: "novo", label: "Precificar um novo produto", emoji: "🆕" },
                    { value: "competir", label: "Ser mais competitivo", emoji: "⚡" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setData({ ...data, objetivo: option.value })}
                      className={`w-full p-4 rounded-xl border-2 transition text-left ${
                        data.objetivo === option.value
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-2xl mr-3">{option.emoji}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: TIPO DE NEGÓCIO */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <Briefcase className="text-yellow-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Qual o tipo do seu negócio?</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "shopify", label: "Shopify/WooCommerce", emoji: "🛒" },
                    { value: "marketplace", label: "Marketplace", emoji: "📦" },
                    { value: "dropshipping", label: "Dropshipping", emoji: "🚚" },
                    { value: "atacado", label: "Atacado/B2B", emoji: "📊" },
                    { value: "fisico", label: "Loja Física", emoji: "🏪" },
                    { value: "outro", label: "Outro", emoji: "✨" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setData({ ...data, tipoNegocio: option.value })}
                      className={`p-4 rounded-xl border-2 transition ${
                        data.tipoNegocio === option.value
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.emoji}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: EXPERIÊNCIA */}
            {step === 4 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-yellow-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Qual sua experiência com precificação?</h2>
                </div>
                
                <div className="space-y-3">
                  {[
                    { 
                      value: "iniciante", 
                      label: "Iniciante", 
                      desc: "Estou começando agora",
                      emoji: "🌱"
                    },
                    { 
                      value: "intermediario", 
                      label: "Intermediário", 
                      desc: "Já tenho alguma experiência",
                      emoji: "📈"
                    },
                    { 
                      value: "avancado", 
                      label: "Avançado", 
                      desc: "Domino estratégias de pricing",
                      emoji: "🚀"
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setData({ ...data, experiencia: option.value })}
                      className={`w-full p-5 rounded-xl border-2 transition text-left ${
                        data.experiencia === option.value
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{option.emoji}</span>
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-zinc-400">{option.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: FAIXA DE PREÇO */}
            {step === 5 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="text-yellow-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Qual a faixa de preço média dos seus produtos?</h2>
                </div>
                
                <div className="space-y-3">
                  {[
                    { value: "ate50", label: "Até R$ 50", emoji: "💵" },
                    { value: "50-200", label: "R$ 50 - R$ 200", emoji: "💰" },
                    { value: "200-500", label: "R$ 200 - R$ 500", emoji: "💎" },
                    { value: "500-1000", label: "R$ 500 - R$ 1.000", emoji: "🏆" },
                    { value: "1000+", label: "Acima de R$ 1.000", emoji: "👑" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setData({ ...data, faixaPreco: option.value })}
                      className={`w-full p-4 rounded-xl border-2 transition text-left ${
                        data.faixaPreco === option.value
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-2xl mr-3">{option.emoji}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: TUTORIAL - DASHBOARD */}
            {step === 6 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-blue-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Como usar: Dashboard de Análise</h2>
                </div>
                
                <div className="bg-zinc-800/50 rounded-2xl p-6 mb-6">
                  <div className="aspect-video bg-zinc-900 rounded-xl mb-4 flex items-center justify-center border border-zinc-700">
                    <div className="text-center">
                      <Sparkles className="text-yellow-400 mx-auto mb-2" size={48} />
                      <p className="text-zinc-500">Preview do Dashboard</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-zinc-300">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-black" />
                    </div>
                    <p><strong>Preencha os 3 campos básicos:</strong> Nome do produto, preço e categoria</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-black" />
                    </div>
                    <p><strong>Use campos avançados</strong> para análises mais precisas (opcional)</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-black" />
                    </div>
                    <p><strong>Receba análise em segundos</strong> com insights personalizados</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: TUTORIAL - CAMPOS AVANÇADOS */}
            {step === 7 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Settings className="text-purple-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Dica Pro: Campos Avançados</h2>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20 mb-6">
                  <p className="text-lg mb-4">
                    💡 <strong>Quanto mais informações você fornecer, melhor será a análise!</strong>
                  </p>
                  <p className="text-zinc-300">
                    Os campos avançados incluem descrição detalhada, público-alvo, concorrentes, custos e margens desejadas.
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="font-semibold text-yellow-400 mb-1">📝 Descrição do produto</p>
                    <p className="text-zinc-400">Ajuda a IA entender o valor e diferenciais</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="font-semibold text-yellow-400 mb-1">🎯 Público-alvo</p>
                    <p className="text-zinc-400">Define estratégias específicas para seu cliente</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <p className="font-semibold text-yellow-400 mb-1">💰 Custos e margens</p>
                    <p className="text-zinc-400">Calcula viabilidade e lucro automaticamente</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: TUTORIAL - ESTATÍSTICAS */}
            {step === 8 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="text-green-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Acompanhe suas Estatísticas</h2>
                </div>
                
                <div className="bg-zinc-800/50 rounded-2xl p-6 mb-6">
                  <div className="aspect-video bg-zinc-900 rounded-xl mb-4 flex items-center justify-center border border-zinc-700">
                    <div className="text-center">
                      <BarChart3 className="text-green-400 mx-auto mb-2" size={48} />
                      <p className="text-zinc-500">Dashboard de Stats</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="font-semibold mb-1">Gráficos</p>
                    <p className="text-xs text-zinc-400">Visualize tendências</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">💰</div>
                    <p className="font-semibold mb-1">Ticket Médio</p>
                    <p className="text-xs text-zinc-400">Seu preço médio</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">📈</div>
                    <p className="font-semibold mb-1">Crescimento</p>
                    <p className="text-xs text-zinc-400">Evolução mensal</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="text-2xl mb-2">🏆</div>
                    <p className="font-semibold mb-1">Top Categoria</p>
                    <p className="text-xs text-zinc-400">Mais analisada</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: TUTORIAL - HISTÓRICO */}
            {step === 9 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="text-orange-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Histórico e Exportação</h2>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl p-6 border border-orange-500/20 mb-6">
                  <p className="text-lg mb-2">
                    📥 <strong>Todas suas análises ficam salvas!</strong>
                  </p>
                  <p className="text-zinc-300 text-sm">
                    Acesse o histórico completo, busque por produtos, exporte em PDF profissional.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      🔍
                    </div>
                    <div>
                      <p className="font-semibold">Busca e Filtros</p>
                      <p className="text-sm text-zinc-400">Encontre análises por nome, categoria ou preço</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      📄
                    </div>
                    <div>
                      <p className="font-semibold">Exportar PDF</p>
                      <p className="text-sm text-zinc-400">Download de relatórios profissionais</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      👁️
                    </div>
                    <div>
                      <p className="font-semibold">Ver Detalhes</p>
                      <p className="text-sm text-zinc-400">Revise análises completas a qualquer momento</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 10: PREFERÊNCIAS FINAIS */}
            {step === 10 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <Settings className="text-yellow-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Últimos ajustes</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Idioma */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Idioma preferido</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "pt", label: "🇧🇷 Português" },
                        { value: "en", label: "🇺🇸 English" },
                        { value: "es", label: "🇪🇸 Español" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setData({ ...data, idioma: option.value })}
                          className={`p-3 rounded-xl border-2 transition text-sm ${
                            data.idioma === option.value
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Tema</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "dark", label: "🌙 Escuro" },
                        { value: "light", label: "☀️ Claro" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setData({ ...data, tema: option.value })}
                          className={`p-3 rounded-xl border-2 transition ${
                            data.tema === option.value
                              ? "border-yellow-500 bg-yellow-500/10"
                              : "border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notificações */}
                  <div>
                    <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-medium">Notificações por email</p>
                        <p className="text-sm text-zinc-400">Receba dicas e novidades</p>
                      </div>
                      <button
                        onClick={() => setData({ ...data, emailNotifications: !data.emailNotifications })}
                        className={`w-12 h-6 rounded-full transition ${
                          data.emailNotifications ? "bg-yellow-500" : "bg-zinc-600"
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition transform ${
                          data.emailNotifications ? "translate-x-6" : "translate-x-0.5"
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition flex items-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Voltar
                </button>
              )}

              <button
                onClick={nextStep}
                disabled={!canProceed() || loading}
                className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  canProceed() && !loading
                    ? "bg-yellow-500 text-black hover:bg-yellow-400"
                    : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  "Salvando..."
                ) : step === totalSteps ? (
                  <>
                    Finalizar
                    <Check size={20} />
                  </>
                ) : (
                  <>
                    Continuar
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>

            {/* SKIP */}
            {step < totalSteps && step > 1 && (
              <button
                onClick={handleFinish}
                className="w-full mt-4 text-sm text-zinc-500 hover:text-zinc-400 transition"
              >
                Pular tutorial →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE SUCESSO */}
      {success && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fadeIn">
          <div className="bg-zinc-900 border-2 border-yellow-500 rounded-3xl p-12 max-w-md text-center">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Check className="text-black" size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-3">Tudo pronto! 🎉</h2>
            <p className="text-zinc-400 mb-6">
              Sua conta foi configurada com sucesso. Redirecionando para o dashboard...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}