import { useEffect, useState } from "react";
import { 
  Zap, TrendingUp, DollarSign, BarChart3, Check, Sparkles, Target, ChevronDown,
  ArrowRight, Users, Shield, Crown, Star, Clock, MessageCircle, X, Calculator,
  Award, AlertCircle, CheckCircle2, Lock, Mail, Flame, FileText, 
  Image as ImageIcon, Link as LinkIcon, Repeat, Activity, Bell, Settings, Gift, Rocket, Phone,
  TrendingDown
} from "lucide-react";

export default function LandingPage({ 
  onLogin, 
  onRegister 
}: { 
  onLogin: () => void;
  onRegister: () => void;
}) {

  // 💰 Formatação padrão brasileiro
  function formatBRL(value: number): string {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showProofBar, setShowProofBar] = useState(false);
  const [currentProof, setCurrentProof] = useState(0);
  const [timeLeft, setTimeLeft] = useState(86400);
  const [calcPrice, setCalcPrice] = useState(89.90);
  const [calcSales, setCalcSales] = useState(100);
  const [calcNiche, setCalcNiche] = useState('eletronicos');
  const [calcCost, setCalcCost] = useState(10);
  const [calcPlatformFee, setCalcPlatformFee] = useState(5);
  const [calcDesiredMargin, setCalcDesiredMargin] = useState(40);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ 
    name: '',
    business: '', 
    revenue: '', 
    difficulty: '',
    goal: '',
    monthlyLoss: '',
    urgency: '',
    email: '',
    whatsapp: ''
  });
  const [quizErrors, setQuizErrors] = useState<{[key: string]: string}>({});
  const [showChatbot, setShowChatbot] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [remainingSlots, setRemainingSlots] = useState(7);
  const [quizDiscount, setQuizDiscount] = useState(0);
  
  const proofMessages = [
    { name: "Carlos Mendes", city: "São Paulo, SP", action: "aumentou lucro em R$ 18k/mês", time: "2 min" },
    { name: "Ana Beatriz", city: "Curitiba, PR", action: "descobriu preço ideal com IA", time: "5 min" },
    { name: "Rafael Costa", city: "Belo Horizonte, MG", action: "economizou 12h/semana", time: "9 min" }
  ];

  // TODAS AS 14 FERRAMENTAS DETALHADAS
  const allTools = [
    // FREE (1)
    { 
      icon: <Sparkles />, 
      title: 'Análise de Preço com IA', 
      desc: 'IA analisa milhares de produtos concorrentes e sugere preço competitivo em segundos',
      benefit: 'Preço ideal instantâneo',
      plan: 'FREE',
      highlight: true 
    },
    // STARTER (3)
    { 
      icon: <Calculator />, 
      title: 'Calculadora de Margem', 
      desc: 'Calcule margem, markup e custos variáveis automaticamente',
      benefit: 'Entenda seu lucro real',
      plan: 'STARTER' 
    },
    { 
      icon: <FileText />, 
      title: 'Análise de Planilha', 
      desc: 'Upload de catálogo ou lista de produtos para análise em massa',
      benefit: 'Analise 50+ produtos de uma vez',
      plan: 'STARTER' 
    },
    { 
      icon: <Clock />, 
      title: 'Histórico 90 dias', 
      desc: 'Acesse suas análises e acompanhe evolução de preços dos últimos 3 meses',
      benefit: 'Monitore tendências',
      plan: 'STARTER' 
    },
    // PRO (6)
    { 
      icon: <ImageIcon />, 
      title: 'Análise de Imagem (OCR)', 
      desc: 'Tire foto de etiquetas, produtos físicos ou anúncios e extraia preços automaticamente',
      benefit: 'Digitaliza qualquer preço',
      plan: 'PRO' 
    },
    { 
      icon: <LinkIcon />, 
      title: 'Análise de Link (Web Scraping)', 
      desc: 'Cole link de Amazon, Mercado Livre, concorrentes e extraia preço + descrição',
      benefit: 'Espiona concorrência legalmente',
      plan: 'PRO' 
    },
    { 
      icon: <Users />, 
      title: 'Comparador de Concorrentes', 
      desc: 'Compare até 3 produtos/lojas lado a lado com análise detalhada de posicionamento',
      benefit: 'Veja onde você perde vendas',
      plan: 'PRO' 
    },
    { 
      icon: <Clock />, 
      title: 'Histórico Ilimitado', 
      desc: 'Acesse todas análises anteriores, compare evolução de mercado e exporte relatórios',
      benefit: 'Nunca perca uma análise',
      plan: 'PRO' 
    },
    { 
      icon: <Target />, 
      title: 'Metas de Precificação', 
      desc: 'Defina metas de lucro e vendas, receba alertas quando atingir ou desviar',
      benefit: 'Alcance seus objetivos',
      plan: 'PRO' 
    },
    { 
      icon: <Award />, 
      title: 'Relatórios Avançados', 
      desc: 'Gere relatórios executivos com gráficos, tendências e insights acionáveis',
      benefit: 'Decisões baseadas em dados',
      plan: 'PRO' 
    },
    // BUSINESS (7)
    { 
      icon: <Repeat />, 
      title: 'Simulador de Cenários', 
      desc: 'Teste 5 estratégias de preço diferentes e veja impacto em vendas, lucro e competitividade',
      benefit: 'Preveja o futuro do mercado',
      plan: 'BUSINESS' 
    },
    { 
      icon: <BarChart3 />, 
      title: 'Dashboard Executivo', 
      desc: 'Métricas em tempo real: ticket médio, conversão, ROI por produto, sazonalidade',
      benefit: 'Visão 360° da operação',
      plan: 'BUSINESS' 
    },
    { 
      icon: <Activity />, 
      title: 'Análise em Lote (CSV)', 
      desc: 'Analise até 100 produtos simultaneamente com upload de planilha Excel ou CSV',
      benefit: 'Escale sua precificação',
      plan: 'BUSINESS' 
    },
    { 
      icon: <Bell />, 
      title: 'Monitor de Preços 24/7', 
      desc: 'Monitore até 20 URLs de concorrentes e receba alertas via email/WhatsApp',
      benefit: 'Reaja antes do mercado',
      plan: 'BUSINESS' 
    },
    { 
      icon: <MessageCircle />, 
      title: 'Assistente IA 24/7', 
      desc: 'Chat inteligente que responde dúvidas, sugere estratégias e analisa oportunidades',
      benefit: 'Consultor de pricing no bolso',
      plan: 'BUSINESS' 
    },
    { 
      icon: <Settings />, 
      title: 'Integrações E-commerce', 
      desc: 'Conecte com Shopify, WooCommerce, Mercado Livre, Amazon via API',
      benefit: 'Sincronização automática',
      plan: 'BUSINESS' 
    },
    { 
      icon: <FileText />, 
      title: 'Relatórios Customizados', 
      desc: 'Crie relatórios personalizados para sócios/investidores, agende envios automáticos',
      benefit: 'Decisões baseadas em dados',
      plan: 'BUSINESS' 
    }
  ];

  useEffect(() => {
    const slots = localStorage.getItem('remainingSlots');
    if (slots) setRemainingSlots(parseInt(slots));
  }, []);

  useEffect(() => {
    let canShowPopup = false;
    const timer = setTimeout(() => { canShowPopup = true; }, 10000);
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && canShowPopup && !localStorage.getItem('exitPopupShown') && !hasInteracted) {
        setShowExitPopup(true);
        localStorage.setItem('exitPopupShown', 'true');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => { clearTimeout(timer); document.removeEventListener('mouseleave', handleMouseLeave); };
  }, [hasInteracted]);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setShowProofBar(true);
      const interval = setInterval(() => {
        setCurrentProof(p => (p + 1) % proofMessages.length);
      }, 6000);
      return () => clearInterval(interval);
    }, 3000);
    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 86400;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // VALIDAÇÕES DO QUIZ
  const validateQuizStep = (step: number): boolean => {
    const errors: {[key: string]: string} = {};
    
    switch(step) {
      case 1:
        if (!quizAnswers.name.trim()) {
          errors.name = 'Por favor, digite seu nome';
        } else if (quizAnswers.name.trim().length < 3) {
          errors.name = 'Nome muito curto';
        }
        break;
        
      case 2:
        if (!quizAnswers.business) {
          errors.business = 'Selecione o tipo da sua loja';
        }
        break;
        
      case 3:
        if (!quizAnswers.revenue) {
          errors.revenue = 'Selecione sua faixa de faturamento';
        }
        break;
        
      case 4:
        if (!quizAnswers.difficulty) {
          errors.difficulty = 'Selecione sua maior dificuldade';
        }
        break;
        
      case 5:
        if (!quizAnswers.goal) {
          errors.goal = 'Selecione seu principal objetivo';
        }
        break;
        
      case 6:
        if (!quizAnswers.monthlyLoss) {
          errors.monthlyLoss = 'Selecione o valor estimado de perda';
        }
        break;
        
      case 7:
        if (!quizAnswers.urgency) {
          errors.urgency = 'Selecione o nível de urgência';
        }
        break;
        
      case 8:
        if (!quizAnswers.email.trim()) {
          errors.email = 'Digite seu email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quizAnswers.email)) {
          errors.email = 'Email inválido';
        }
        break;
        
      case 9:
        if (!quizAnswers.whatsapp.trim()) {
          errors.whatsapp = 'Digite seu WhatsApp';
        } else if (!/^\d{10,11}$/.test(quizAnswers.whatsapp.replace(/\D/g, ''))) {
          errors.whatsapp = 'WhatsApp inválido (use apenas números)';
        }
        break;
    }
    
    setQuizErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleQuizNext = () => {
    if (validateQuizStep(quizStep)) {
      if (quizStep < 9) {
        setQuizStep(quizStep + 1);
        setQuizErrors({});
      } else {
        // Calcular desconto baseado nas respostas
        let discount = 0;
        if (quizAnswers.urgency === 'Imediato') discount += 15;
        if (quizAnswers.monthlyLoss === 'R$ 5.000+') discount += 10;
        if (quizAnswers.revenue === 'Menos de R$ 10k/mês') discount += 5;
        
        setQuizDiscount(Math.min(discount, 25));
        setShowQuiz(false);
        
        // Salvar no localStorage para não perder os dados
        localStorage.setItem('quizCompleted', 'true');
        localStorage.setItem('quizData', JSON.stringify(quizAnswers));
      }
    }
  };

  const handleQuizPrev = () => {
    if (quizStep > 1) {
      setQuizStep(quizStep - 1);
      setQuizErrors({});
    }
  };

  const handleCTAClick = () => {
    setHasInteracted(true);
    if (remainingSlots > 0) {
      const newSlots = remainingSlots - 1;
      setRemainingSlots(newSlots);
      localStorage.setItem('remainingSlots', newSlots.toString());
    }
    onRegister();
  };

  // CALCULADORA AVANÇADA
  const calculateMetrics = () => {
    const price = parseFloat(String(calcPrice)) || 0;
    const sales = parseFloat(String(calcSales)) || 0;
    const cost = parseFloat(String(calcCost)) || 0;
    const platformFee = parseFloat(String(calcPlatformFee)) || 0;
    const desiredMargin = parseFloat(String(calcDesiredMargin)) || 0;

    const grossRevenue = price * sales;
    const totalCost = (cost + (price * platformFee / 100)) * sales;
    const netProfit = grossRevenue - totalCost;
    const currentMargin = (netProfit / grossRevenue) * 100;
    
    const targetProfit = grossRevenue * (desiredMargin / 100);
    const costPerUnit = cost + (price * platformFee / 100);
    const idealPrice = (costPerUnit * sales + targetProfit) / sales;
    const priceDifference = idealPrice - price;
    const potentialGain = Math.max(0, priceDifference * sales);

    return {
      grossRevenue: formatBRL(grossRevenue),
      totalCost: formatBRL(totalCost),
      netProfit: formatBRL(netProfit),
      currentMargin: currentMargin.toFixed(1),
      idealPrice: formatBRL(idealPrice),
      priceDifference: formatBRL(priceDifference),
      potentialGain: formatBRL(potentialGain),
      yearlyGain: formatBRL(potentialGain * 12)
    };
  };

  const loss = calculateMetrics();

  const renderQuizContent = () => {
    switch(quizStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Qual é o seu nome?</h3>
            <p className="text-zinc-400 mb-6">Queremos personalizar sua experiência</p>
            <input
              type="text"
              value={quizAnswers.name}
              onChange={(e) => setQuizAnswers({...quizAnswers, name: e.target.value})}
              placeholder="Digite seu nome completo"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none"
            />
            {quizErrors.name && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.name}
              </p>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Que tipo de loja você tem?</h3>
            <p className="text-zinc-400 mb-6">Isso nos ajuda a personalizar as recomendações</p>
            <div className="grid grid-cols-2 gap-4">
              {['Shopify/WooCommerce', 'Mercado Livre/Amazon', 'Dropshipping', 'Loja Física+Online', 'Atacado/B2B', 'Outro'].map(type => (
                <button
                  key={type}
                  onClick={() => setQuizAnswers({...quizAnswers, business: type})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    quizAnswers.business === type 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {quizErrors.business && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.business}
              </p>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Qual seu faturamento mensal?</h3>
            <p className="text-zinc-400 mb-6">Não se preocupe, seus dados são 100% sigilosos</p>
            <div className="space-y-3">
              {['Menos de R$ 10k/mês', 'R$ 10k - R$ 50k/mês', 'R$ 50k - R$ 100k/mês', 'Mais de R$ 100k/mês'].map(range => (
                <button
                  key={range}
                  onClick={() => setQuizAnswers({...quizAnswers, revenue: range})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    quizAnswers.revenue === range 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            {quizErrors.revenue && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.revenue}
              </p>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Qual sua MAIOR dificuldade hoje?</h3>
            <p className="text-zinc-400 mb-6">Seja honesto, isso impacta sua recomendação</p>
            <div className="space-y-3">
              {[
                'Não sei se meu preço está correto',
                'Estou perdendo para concorrentes mais baratos',
                'Margem de lucro muito baixa',
                'Dificuldade em precificar novos produtos',
                'Clientes acham caro demais'
              ].map(diff => (
                <button
                  key={diff}
                  onClick={() => setQuizAnswers({...quizAnswers, difficulty: diff})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    quizAnswers.difficulty === diff 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
            {quizErrors.difficulty && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.difficulty}
              </p>
            )}
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Qual seu principal objetivo?</h3>
            <p className="text-zinc-400 mb-6">O que você mais deseja alcançar?</p>
            <div className="space-y-3">
              {[
                'Aumentar lucro sem perder vendas',
                'Vender mais sem baixar preço',
                'Competir melhor com concorrentes',
                'Entender meus custos reais',
                'Tomar decisões baseadas em dados'
              ].map(goal => (
                <button
                  key={goal}
                  onClick={() => setQuizAnswers({...quizAnswers, goal: goal})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    quizAnswers.goal === goal 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
            {quizErrors.goal && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.goal}
              </p>
            )}
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Quanto você estima estar perdendo por mês?</h3>
            <p className="text-zinc-400 mb-6">Com preço errado, falta de estratégia, etc.</p>
            <div className="space-y-3">
              {['Menos de R$ 1.000', 'R$ 1.000 - R$ 2.500', 'R$ 2.500 - R$ 5.000', 'R$ 5.000+'].map(loss => (
                <button
                  key={loss}
                  onClick={() => setQuizAnswers({...quizAnswers, monthlyLoss: loss})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    quizAnswers.monthlyLoss === loss 
                      ? 'border-red-500 bg-red-500/10' 
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {loss}
                </button>
              ))}
            </div>
            {quizErrors.monthlyLoss && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.monthlyLoss}
              </p>
            )}
          </div>
        );
        
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Qual a urgência em resolver isso?</h3>
            <p className="text-zinc-400 mb-6">Seja sincero sobre sua situação</p>
            <div className="space-y-3">
              {[
                { label: 'Imediato (preciso resolver agora)', value: 'Imediato', color: 'red' },
                { label: 'Urgente (nas próximas semanas)', value: 'Urgente', color: 'orange' },
                { label: 'Importante (próximo mês)', value: 'Importante', color: 'yellow' },
                { label: 'Posso esperar (só explorando)', value: 'Posso esperar', color: 'zinc' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setQuizAnswers({...quizAnswers, urgency: opt.value})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    quizAnswers.urgency === opt.value 
                      ? `border-${opt.color}-500 bg-${opt.color}-500/10` 
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {quizErrors.urgency && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.urgency}
              </p>
            )}
          </div>
        );
        
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Qual seu melhor email?</h3>
            <p className="text-zinc-400 mb-6">Para enviar seu diagnóstico personalizado</p>
            <input
              type="email"
              value={quizAnswers.email}
              onChange={(e) => setQuizAnswers({...quizAnswers, email: e.target.value})}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none"
            />
            {quizErrors.email && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.email}
              </p>
            )}
            <div className="flex items-start gap-2 text-sm text-zinc-500 bg-zinc-900/50 p-3 rounded-lg">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Seus dados estão seguros. Não enviamos spam.</span>
            </div>
          </div>
        );
        
      case 9:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-2">Qual seu WhatsApp?</h3>
            <p className="text-zinc-400 mb-6">Para enviar acesso exclusivo e suporte VIP</p>
            <input
              type="tel"
              value={quizAnswers.whatsapp}
              onChange={(e) => setQuizAnswers({...quizAnswers, whatsapp: e.target.value.replace(/\D/g, '')})}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none"
            />
            {quizErrors.whatsapp && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {quizErrors.whatsapp}
              </p>
            )}
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-500 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <p className="font-bold text-green-400">Bônus Exclusivo Liberado!</p>
              </div>
              <p className="text-sm text-zinc-300">
                Ao completar, você ganha acesso ao diagnóstico completo + 30 min de consultoria gratuita
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Social Proof Bar */}
      {showProofBar && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 shadow-2xl max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{proofMessages[currentProof].name}</p>
                <p className="text-xs text-zinc-400 truncate">{proofMessages[currentProof].city}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 mt-2">{proofMessages[currentProof].action}</p>
            <p className="text-xs text-zinc-500 mt-1">há {proofMessages[currentProof].time}</p>
          </div>
        </div>
      )}

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-yellow-500 rounded-3xl p-8 max-w-2xl w-full relative animate-scale-in">
            <button 
              onClick={() => setShowExitPopup(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Espera! Não vá embora ainda...</h2>
              <p className="text-xl text-zinc-400 mb-6">
                Você está a <span className="text-yellow-400 font-bold">30 segundos</span> de descobrir se está <span className="text-red-400 font-bold">perdendo dinheiro</span> com preço errado
              </p>
              
              <div className="bg-zinc-800/50 rounded-2xl p-6 mb-6">
                <p className="text-2xl font-bold text-yellow-400 mb-2">
                  Oferta Especial de Última Chance
                </p>
                <p className="text-zinc-300 mb-4">
                  Complete o diagnóstico AGORA e ganhe acesso <span className="font-bold text-white">GRATUITO</span> ao plano PRO por 7 dias
                </p>
                <p className="text-sm text-zinc-500">
                  (Valor: R$ 97 • 100% Grátis por tempo limitado)
                </p>
              </div>

              <button 
                onClick={() => { setShowExitPopup(false); setShowQuiz(true); }}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-xl text-lg hover:scale-105 transition mb-3"
              >
                Sim! Quero Meu Diagnóstico Gratuito
              </button>
              <button 
                onClick={() => setShowExitPopup(false)}
                className="text-sm text-zinc-500 hover:text-zinc-400 transition"
              >
                Não, prefiro continuar perdendo dinheiro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-yellow-500 rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative my-8">
            <button 
              onClick={() => setShowQuiz(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-zinc-400">Pergunta {quizStep} de 9</span>
                <span className="text-sm font-bold text-yellow-400">{Math.round((quizStep / 9) * 100)}% completo</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(quizStep / 9) * 100}%` }}
                />
              </div>
            </div>

            {renderQuizContent()}

            <div className="flex gap-3 mt-6">
              {quizStep > 1 && (
                <button 
                  onClick={handleQuizPrev}
                  className="flex-1 py-3 border-2 border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition font-bold"
                >
                  Voltar
                </button>
              )}
              <button 
                onClick={handleQuizNext}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-xl hover:scale-105 transition font-bold"
              >
                {quizStep === 9 ? 'Finalizar Diagnóstico' : 'Próxima'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating CTA Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <MessageCircle className="w-7 h-7 text-black" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <span className="text-xl font-bold">PriceMind</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-zinc-400 hover:text-white transition text-sm font-medium">Recursos</a>
                <a href="#pricing" className="text-zinc-400 hover:text-white transition text-sm font-medium">Preços</a>
                <button onClick={onLogin} className="text-zinc-400 hover:text-white transition text-sm font-medium">Entrar</button>
                <button onClick={handleCTAClick} className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-xl hover:scale-105 transition text-sm">
                  Começar Grátis
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
                <Flame className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">+5.247 empresas já otimizaram seus preços</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Descubra o <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Preço Ideal</span> do Seu Produto em 30 Segundos
              </h1>
              
              <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-3xl mx-auto">
                Pare de perder dinheiro cobrando errado. Nossa IA analisa o mercado e revela se você está <span className="text-red-400 font-bold">perdendo dinheiro</span> ou <span className="text-green-400 font-bold">deixando lucro na mesa</span>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <button 
                  onClick={handleCTAClick}
                  className="group relative overflow-hidden px-8 py-4 rounded-xl w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl" />
                  <span className="relative text-black font-bold text-lg flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Analisar Meu Preço Grátis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                  </span>
                </button>
                
                <button 
                  onClick={() => setShowQuiz(true)}
                  className="px-8 py-4 border-2 border-zinc-700 text-white rounded-xl hover:border-yellow-500 transition font-bold text-lg w-full sm:w-auto"
                >
                  Fazer Diagnóstico Completo
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>100% Gratuito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Sem Cadastro</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Resultado Instantâneo</span>
                </div>
              </div>
            </div>

            {/* Calculadora Visual */}
            <div className="mt-16 max-w-5xl mx-auto">
              <div className="bg-zinc-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                    <Calculator className="w-8 h-8 inline-block mr-2 text-yellow-400" />
                    Simulador de Precificação
                  </h3>
                  <p className="text-zinc-400">Veja quanto você pode estar perdendo agora</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Preço Atual (R$)</label>
                    <input
                      type="number"
                      value={calcPrice}
                      onChange={(e) => setCalcPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none text-lg font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Vendas/Mês</label>
                    <input
                      type="number"
                      value={calcSales}
                      onChange={(e) => setCalcSales(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none text-lg font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Custo Unitário (R$)</label>
                    <input
                      type="number"
                      value={calcCost}
                      onChange={(e) => setCalcCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none text-lg font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Taxa Plataforma (%)</label>
                    <input
                      type="number"
                      value={calcPlatformFee}
                      onChange={(e) => setCalcPlatformFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none text-lg font-bold"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Margem Desejada (%)</label>
                    <input
                      type="number"
                      value={calcDesiredMargin}
                      onChange={(e) => setCalcDesiredMargin(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none text-lg font-bold"
                    />
                  </div>
                </div>

                {/* Resultados */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-sm text-zinc-400 mb-1">Faturamento Bruto</p>
                    <p className="text-2xl font-bold text-blue-400">R$ {loss.grossRevenue}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-sm text-zinc-400 mb-1">Custos Totais</p>
                    <p className="text-2xl font-bold text-red-400">R$ {loss.totalCost}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                    <p className="text-sm text-zinc-400 mb-1">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-green-400">R$ {loss.netProfit}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-sm text-zinc-400 mb-1">Margem Atual</p>
                    <p className="text-2xl font-bold text-yellow-400">{loss.currentMargin}%</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-2">Recomendação da IA:</h4>
                      <p className="text-zinc-300 mb-4">
                        {parseFloat(loss.priceDifference) > 0 
                          ? `Você está cobrando ABAIXO do ideal. Aumente para R$ ${loss.idealPrice} e ganhe R$ ${loss.potentialGain}/mês`
                          : parseFloat(loss.priceDifference) < 0
                          ? `Você está cobrando ACIMA do mercado. Seu preço está ok, mas pode otimizar custos.`
                          : 'Seu preço está no ponto ideal! Continue assim.'}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm text-zinc-400 mb-1">Preço Ideal</p>
                          <p className="text-3xl font-bold text-yellow-400">R$ {loss.idealPrice}</p>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm text-zinc-400 mb-1">Ganho Potencial/Ano</p>
                          <p className="text-3xl font-bold text-green-400">R$ {loss.yearlyGain}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-2">+5.000</div>
                <p className="text-zinc-400">Empresas ativas</p>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-2">+127k</div>
                <p className="text-zinc-400">Análises realizadas</p>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-2">R$ 18M</div>
                <p className="text-zinc-400">Economizados pelos clientes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Cards - Redesenhado Profissionalmente */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Você está <span className="text-red-400">perdendo dinheiro</span> todos os dias?
              </h2>
              <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
                A maioria dos empreendedores comete estes erros críticos de precificação
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-red-500/5 to-red-600/5 border-2 border-red-500/30 hover:border-red-500 rounded-3xl p-8 transition-all hover:scale-105">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Preço do Concorrente</h3>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                  Copiar preço da concorrência sem entender seus custos reais é o caminho mais rápido para o prejuízo
                </p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <AlertCircle className="w-5 h-5" />
                    <span>Perda até 30%</span>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-orange-500/5 to-orange-600/5 border-2 border-orange-500/30 hover:border-orange-500 rounded-3xl p-8 transition-all hover:scale-105">
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Cobrar Mais sem Estratégia</h3>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                  Aumentar preço achando que vai vender mais barato pode destruir sua margem e afastar clientes
                </p>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-400 font-bold">
                    <TrendingDown className="w-5 h-5" />
                    <span>-40% em vendas</span>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-yellow-500/5 to-yellow-600/5 border-2 border-yellow-500/30 hover:border-yellow-500 rounded-3xl p-8 transition-all hover:scale-105">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Planilha Confusa</h3>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                  Passar 3+ horas calculando na planilha e ainda ficar com dúvida se o resultado está certo
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold">
                    <Clock className="w-5 h-5" />
                    <span>5h por semana</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Detalhadas */}
        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Todas as <span className="text-yellow-400">Ferramentas</span> que Você Precisa
              </h2>
              <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
                Do básico ao profissional: escolha o plano certo para o seu momento
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTools.map((tool, i) => (
                <div 
                  key={i}
                  className={`bg-zinc-900/80 backdrop-blur-xl border rounded-2xl p-6 hover:scale-105 transition-all ${
                    tool.plan === 'FREE' ? 'border-zinc-700' :
                    tool.plan === 'STARTER' ? 'border-blue-500/30' :
                    tool.plan === 'PRO' ? 'border-yellow-500/30' :
                    'border-orange-500/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    tool.plan === 'FREE' ? 'bg-zinc-700/30' :
                    tool.plan === 'STARTER' ? 'bg-blue-500/20' :
                    tool.plan === 'PRO' ? 'bg-yellow-500/20' :
                    'bg-orange-500/20'
                  }`}>
                    <div className={
                      tool.plan === 'FREE' ? 'text-zinc-400' :
                      tool.plan === 'STARTER' ? 'text-blue-400' :
                      tool.plan === 'PRO' ? 'text-yellow-400' :
                      'text-orange-400'
                    }>
                      {tool.icon}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{tool.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      tool.plan === 'FREE' ? 'bg-zinc-700 text-zinc-300' :
                      tool.plan === 'STARTER' ? 'bg-blue-500/20 text-blue-400' :
                      tool.plan === 'PRO' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {tool.plan}
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-400 mb-3">{tool.desc}</p>
                  
                  <div className={`text-sm font-medium ${
                    tool.plan === 'FREE' ? 'text-zinc-300' :
                    tool.plan === 'STARTER' ? 'text-blue-400' :
                    tool.plan === 'PRO' ? 'text-yellow-400' :
                    'text-orange-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    {tool.benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING - 4 CARDS */}
        <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Escolha Seu <span className="text-yellow-400">Plano</span>
              </h2>
              <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
                Do gratuito ao enterprise: temos a solução certa para cada momento do seu negócio
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {/* FREE */}
              <div className="relative bg-zinc-900/80 backdrop-blur-xl border-2 border-zinc-700 rounded-3xl p-8 hover:border-zinc-600 transition">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-zinc-300">Free</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-4">
                    <span className="text-5xl font-bold">R$ 0</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-500">Para quem está começando</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {['10 análises/mês', 'Análise IA básica', 'Histórico 30 dias'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={handleCTAClick} 
                  className="w-full py-3 border-2 border-zinc-600 text-zinc-300 rounded-xl hover:bg-zinc-800 transition font-bold"
                >
                  Começar Grátis
                </button>
              </div>

              {/* STARTER */}
              <div className="relative bg-zinc-900/80 backdrop-blur-xl border-2 border-blue-500/50 rounded-3xl p-8 hover:border-blue-500 transition">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-blue-400">Starter</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-4">
                    <span className="text-5xl font-bold text-blue-400">R$ 27</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-500">Para pequenos negócios</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {['50 análises/mês', '3 ferramentas', 'Análise de PDF', 'Histórico 90 dias'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-white text-sm">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={handleCTAClick} 
                  className="w-full py-3 bg-blue-500/20 border-2 border-blue-500 text-blue-400 rounded-xl hover:bg-blue-500/30 transition font-bold"
                >
                  Assinar Starter
                </button>
              </div>

              {/* PRO */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl blur-xl opacity-30" />
                <div className="relative bg-zinc-900 border-2 border-yellow-500 rounded-3xl p-8">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-500 text-black text-sm font-bold rounded-full">
                    POPULAR
                  </div>
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">Pro</h3>
                    <div className="flex items-baseline justify-center gap-2 mb-1">
                      <span className="text-3xl font-bold text-zinc-500 line-through">R$ 97</span>
                      <span className="text-5xl font-bold text-yellow-400">R$ 48,50</span>
                    </div>
                    <p className="text-sm text-yellow-400 mb-2 font-bold">50% OFF!</p>
                    <p className="text-sm text-zinc-500">Para profissionais</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {['100 análises/mês', '6 ferramentas PRO', 'Análise de imagem', 'Web scraping', 'Histórico ilimitado'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-white text-sm">
                        <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={handleCTAClick} 
                    className="w-full relative overflow-hidden py-3 rounded-xl mb-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl" />
                    <span className="relative text-black font-bold">Garantir 50% OFF</span>
                  </button>
                  <p className="text-center text-xs text-yellow-400 font-bold flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4" />
                    {remainingSlots} vagas hoje
                  </p>
                </div>
              </div>

              {/* BUSINESS */}
              <div className="relative bg-zinc-900/80 backdrop-blur-xl border-2 border-orange-500/50 rounded-3xl p-8 hover:border-orange-500 transition">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-orange-400">Business</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-4">
                    <span className="text-5xl font-bold text-orange-400">R$ 97</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-500">Para empresas</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {['Análises ilimitadas', '14 ferramentas', 'Dashboard executivo', 'Monitor de preços', 'Suporte VIP'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-white text-sm">
                      <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={handleCTAClick} 
                  className="w-full py-3 bg-orange-500/20 border-2 border-orange-500 text-orange-400 rounded-xl hover:bg-orange-500/30 transition font-bold"
                >
                  Assinar Business
                </button>
              </div>
            </div>

            {/* Comparação de Planos */}
            <div className="mt-12 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 overflow-x-auto">
              <h3 className="text-2xl font-bold mb-6 text-center">Comparação Completa</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Recurso</th>
                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Free</th>
                    <th className="text-center py-3 px-4 text-blue-400 font-medium">Starter</th>
                    <th className="text-center py-3 px-4 text-yellow-400 font-medium">Pro</th>
                    <th className="text-center py-3 px-4 text-orange-400 font-medium">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Análises/mês', '10', '50', '100', 'Ilimitado'],
                    ['Ferramentas', '1', '3', '6', '14'],
                    ['Histórico', '30 dias', '90 dias', 'Ilimitado', 'Ilimitado'],
                    ['Suporte', 'Email', 'Email', 'Email', 'VIP 24/7'],
                    ['Dashboard', '✗', '✗', 'Básico', 'Completo'],
                    ['API', '✗', '✗', '✗', '✓']
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      <td className="py-3 px-4 text-zinc-300">{row[0]}</td>
                      <td className="py-3 px-4 text-center text-zinc-400">{row[1]}</td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row[2]}</td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row[3]}</td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Perguntas <span className="text-yellow-400">Frequentes</span>
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { 
                  q: 'Como funciona a análise de preço com IA?', 
                  a: 'Nossa IA analisa milhares de dados do mercado, compara com seus custos e margem desejada, e sugere o preço ideal em 30 segundos. Simples, rápido e preciso.' 
                },
                { 
                  q: 'Preciso de cartão de crédito para o plano Free?', 
                  a: 'Não! O plano Free é 100% gratuito e não requer cartão. Você pode começar a usar imediatamente sem nenhum compromisso.' 
                },
                { 
                  q: 'Posso cancelar a qualquer momento?', 
                  a: 'Sim! Todos os planos são sem fidelidade. Você pode cancelar quando quiser, sem multas ou taxas ocultas.' 
                },
                { 
                  q: 'Qual a diferença entre os planos?', 
                  a: 'Cada plano oferece mais ferramentas e análises. Free é ideal para testes, Starter para pequenos negócios, Pro para profissionais e Business para empresas que precisam de recursos avançados.' 
                },
                { 
                  q: 'Quanto tempo demora para ver resultados?', 
                  a: 'A análise é instantânea - leva apenas 30 segundos. Você recebe o resultado imediatamente e pode implementar as mudanças no mesmo dia.' 
                },
                { 
                  q: 'Meus dados estão seguros?', 
                  a: 'Sim! Usamos criptografia de ponta e seguimos todas as normas da LGPD. Seus dados jamais são compartilhados com terceiros.' 
                }
              ].map((faq, i) => (
                <details 
                  key={i} 
                  className="group bg-zinc-900/80 backdrop-blur-xl border border-zinc-700 rounded-2xl overflow-hidden hover:border-yellow-500/40 transition-all"
                >
                  <summary className="cursor-pointer p-6 font-bold text-base sm:text-lg flex items-center justify-between list-none">
                    <span>{faq.q}</span>
                    <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                  </summary>
                  <div className="px-6 pb-6 text-zinc-400 text-sm border-t border-zinc-800 pt-4 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6">
              Pronto para <span className="text-yellow-400">Maximizar Seus Lucros</span>?
            </h2>
            <p className="text-lg sm:text-xl text-zinc-400 mb-10">
              Junte-se a +5.247 empreendedores que já otimizaram seus preços e aumentaram seus lucros
            </p>
            
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500 rounded-2xl p-8 mb-10 inline-block">
              <p className="text-2xl sm:text-3xl font-bold text-red-400 mb-3">
                <AlertCircle className="w-8 h-8 inline mr-2" />
                Você está perdendo dinheiro AGORA
              </p>
              <p className="text-xl text-zinc-300 mb-2">
                Cada dia sem otimizar = <strong className="text-red-400">R$ {(parseFloat(loss.yearlyGain) / 365).toFixed(0)}</strong> perdidos
              </p>
              <p className="text-zinc-400">
                Em 1 ano isso representa <strong className="text-red-400 text-2xl">R$ {loss.yearlyGain}</strong> que poderia estar no seu bolso
              </p>
            </div>

            <button 
              onClick={handleCTAClick} 
              className="relative group overflow-hidden px-12 py-6 rounded-xl mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl" />
              <span className="relative text-black font-bold text-xl flex flex-col items-center justify-center gap-2">
                <span className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  Fazer Análise Grátis em 30 Segundos
                </span>
                <span className="text-sm font-normal">
                  Sem cadastro • Sem cartão • Resultado instantâneo
                </span>
              </span>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>100% Gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Resultado em 30s</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>{remainingSlots} vagas hoje</span>
              </div>
            </div>

            <div className="inline-block bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl p-6">
              <p className="text-sm text-zinc-400 mb-2 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Promoção 50% OFF expira em:
              </p>
              <p className="text-3xl font-mono font-bold text-yellow-400">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </section>

        {/* Garantia */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500 rounded-3xl p-8 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Garantia Incondicional de 30 Dias</h3>
              <p className="text-lg text-zinc-300 mb-6 max-w-2xl mx-auto">
                Se você não otimizar seus preços ou não ficar 100% satisfeito, devolvemos seu dinheiro. 
                Sem perguntas, sem burocracia.
              </p>
              <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Risco Zero • Satisfação Garantida</span>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-zinc-800 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-xl font-bold">PriceMind</span>
                </div>
                <p className="text-sm text-zinc-500">
                  A plataforma de precificação inteligente que já ajudou +5.000 empresas a otimizarem seus lucros.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-4 text-zinc-300">Produto</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                  <li><a href="#features" className="hover:text-white transition">Recursos</a></li>
                  <li><a href="#pricing" className="hover:text-white transition">Preços</a></li>
                  <li><a href="#" className="hover:text-white transition">Roadmap</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4 text-zinc-300">Suporte</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                  <li><a href="#" className="hover:text-white transition">Central de Ajuda</a></li>
                  <li><a href="#" className="hover:text-white transition">Status</a></li>
                  <li><a href="#" className="hover:text-white transition">Contato</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4 text-zinc-300">Legal</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                  <li><a href="#" className="hover:text-white transition">Termos de Uso</a></li>
                  <li><a href="#" className="hover:text-white transition">Privacidade</a></li>
                  <li><a href="#" className="hover:text-white transition">LGPD</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
              <p>© 2025 PriceMind. Todos os direitos reservados.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-white transition">Twitter</a>
                <a href="#" className="hover:text-white transition">LinkedIn</a>
                <a href="#" className="hover:text-white transition">Instagram</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}