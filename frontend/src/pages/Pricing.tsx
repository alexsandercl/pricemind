import React, { useState } from 'react';
import { Check, Zap, Crown, Star, Gift, ArrowLeft, Loader2, CheckCircle, Shield, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import Toast, { useToast, ToastContainer, CheckoutToasts } from '../components/ui/Toast';

// ✅ ÚNICA MUDANÇA: onSelectPlan → onCheckout
interface PricingProps {
  onCheckout: (plan: 'starter' | 'pro' | 'business') => void;
  onBack: () => void;
}

type ButtonState = 'idle' | 'loading' | 'redirecting' | 'error';

const Pricing: React.FC<PricingProps> = ({ onCheckout, onBack }) => {
  // ✅ Alias para manter compatibilidade com código existente
  const onSelectPlan = onCheckout;
  
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [buttonState, setButtonState] = useState<Record<string, ButtonState>>({
    starter: 'idle',
    pro: 'idle',
    business: 'idle'
  });
  const toast = useToast();

  const handleSelectPlan = async (plan: 'starter' | 'pro' | 'business') => {
    try {
      setLoadingPlan(plan);
      setButtonState(prev => ({ ...prev, [plan]: 'loading' }));

      // Toast: Processando
      const loadingToastId = toast.loading(
        'Processando pagamento',
        'Gerando link seguro...'
      );

      const response = await api.get(`/checkout/url/${plan}`);
      
      // Remove toast de loading
      toast.remove(loadingToastId);

      // Toast: Sucesso
      toast.checkout(
        'Link gerado com sucesso!',
        'Redirecionando para pagamento seguro...'
      );

      setButtonState(prev => ({ ...prev, [plan]: 'redirecting' }));

      // Aguarda animação antes de redirecionar
      setTimeout(() => {
        window.location.href = response.data.url;
      }, 1500);

    } catch (error: any) {
      console.error('Erro ao gerar checkout:', error);
      
      setButtonState(prev => ({ ...prev, [plan]: 'error' }));
      
      const errorMessage = error.response?.data?.error || 'Erro ao processar pagamento';
      toast.error('Erro ao processar', errorMessage);
      
      // Volta ao estado idle após 3s
      setTimeout(() => {
        setLoadingPlan(null);
        setButtonState(prev => ({ ...prev, [plan]: 'idle' }));
      }, 3000);
    }
  };

  const getButtonContent = (plan: string, defaultText: string) => {
    const state = buttonState[plan];
    
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
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
            <CheckCircle className="w-5 h-5 animate-check-mark" />
            <span>Redirecionando</span>
            <Sparkles className="w-5 h-5 animate-pulse" />
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
        return defaultText;
    }
  };

  const isButtonDisabled = (plan: string) => {
    return buttonState[plan] !== 'idle' || loadingPlan !== null;
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer>
        {toast.toasts.map(t => (
          <Toast
            key={t.id}
            {...t}
            onClose={() => toast.remove(t.id!)}
          />
        ))}
      </ToastContainer>

      {/* Background animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-yellow-600/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <button
          onClick={onBack}
          className="mb-8 text-zinc-400 hover:text-yellow-400 transition flex items-center gap-2 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fadeIn">
            Escolha seu <span className="text-yellow-400">Plano</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Desbloqueie todo o potencial do PriceMind e maximize seus lucros
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <Gift className="w-5 h-5 text-green-400 animate-bounce-subtle" />
            <span className="text-sm text-green-400 font-semibold">
              🎉 Preços de Lançamento - 50% OFF primeiros 100 clientes!
            </span>
          </div>
        </div>

        {/* Cards de Planos - GRID 3 COLUNAS */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-12">
          
          {/* PLANO STARTER */}
          <div className="relative group animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            {/* Badge NOVO */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-lg animate-pulse">
                🚀 NOVO!
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-green-500/30 rounded-3xl p-8 hover:border-green-500/60 transition-all duration-300 hover-lift">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-green-500/10 rounded-2xl mb-4">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <p className="text-zinc-400 text-sm mb-4">Perfeito para começar</p>
                
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-sm text-zinc-500 line-through">R$ 54</span>
                  <span className="text-5xl font-bold text-white">R$ 27</span>
                  <span className="text-zinc-400">/mês</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {[
                  '50 análises/mês',
                  '3 ferramentas essenciais',
                  'Análise por PDF',
                  'Calculadora de Lucro',
                  'Histórico 90 dias',
                  'Suporte por email'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan('starter')}
                disabled={isButtonDisabled('starter')}
                className={`
                  relative w-full py-3 rounded-xl font-bold transition-all transform
                  flex items-center justify-center gap-2
                  ${buttonState.starter === 'idle' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:scale-105' 
                    : buttonState.starter === 'redirecting'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-green-500/50 text-white/70 cursor-not-allowed'
                  }
                  disabled:transform-none
                  overflow-hidden
                  group/btn
                `}
              >
                {/* Shimmer effect */}
                {buttonState.starter === 'idle' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
                
                <div className="relative z-10 flex items-center gap-2">
                  {getButtonContent('starter', 'Começar com Starter')}
                </div>
              </button>

              {buttonState.starter === 'idle' && (
                <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 mt-3">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span>Pagamento 100% Seguro</span>
                </div>
              )}

              <p className="text-center text-xs text-zinc-500 mt-3">
                🛡️ Garantia de 7 dias
              </p>
            </div>
          </div>

          {/* PLANO PRO - POPULAR */}
          <div className="relative group animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            {/* Badge POPULAR */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-1.5 rounded-full font-bold text-xs shadow-lg animate-pulse">
                ⚡ MAIS POPULAR
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-500 rounded-3xl p-8 hover:border-yellow-400 transition-all duration-300 hover-lift shadow-2xl shadow-yellow-500/20 scale-105">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-yellow-500/20 rounded-2xl mb-4">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <p className="text-zinc-400 text-sm mb-4">Para quem quer crescer</p>
                
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-sm text-zinc-500 line-through">R$ 134</span>
                  <span className="text-5xl font-bold text-yellow-400">R$ 67</span>
                  <span className="text-zinc-400">/mês</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {[
                  '100 análises/mês',
                  '6 ferramentas avançadas',
                  'Análise por PDF + Link + Imagem',
                  'Todas calculadoras',
                  'Break-even Calculator',
                  'Simulador de Descontos',
                  'Histórico ilimitado',
                  'Suporte prioritário'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-yellow-400" />
                    </div>
                    <span className="text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan('pro')}
                disabled={isButtonDisabled('pro')}
                className={`
                  relative w-full py-3 rounded-xl font-bold transition-all transform
                  flex items-center justify-center gap-2
                  ${buttonState.pro === 'idle' 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 hover:scale-105' 
                    : buttonState.pro === 'redirecting'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-yellow-500/50 text-black/70 cursor-not-allowed'
                  }
                  disabled:transform-none
                  overflow-hidden
                `}
              >
                {/* Shimmer effect */}
                {buttonState.pro === 'idle' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                )}
                
                <div className="relative z-10 flex items-center gap-2">
                  {getButtonContent('pro', 'Garantir 50% OFF')}
                </div>
              </button>

              {buttonState.pro === 'idle' && (
                <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 mt-3">
                  <Shield className="w-3 h-3 text-yellow-400" />
                  <span>Pagamento 100% Seguro</span>
                </div>
              )}

              <p className="text-center text-xs text-zinc-500 mt-3">
                🛡️ Garantia de 7 dias + Bônus
              </p>
            </div>
          </div>

          {/* PLANO BUSINESS */}
          <div className="relative group animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            {/* Badge VIP */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-lg animate-pulse">
                👑 VIP
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border-2 border-purple-500/30 rounded-3xl p-8 hover:border-purple-500/60 transition-all duration-300 hover-lift">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-purple-500/20 rounded-2xl mb-4">
                  <Crown className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Business</h3>
                <p className="text-zinc-400 text-sm mb-4">Tudo ilimitado</p>
                
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-sm text-zinc-500 line-through">R$ 494</span>
                  <span className="text-5xl font-bold text-purple-400">R$ 247</span>
                  <span className="text-zinc-400">/mês</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {[
                  '✨ Análises ilimitadas',
                  '14 ferramentas completas',
                  'Tudo do Pro +',
                  'Comparador 5 Concorrentes',
                  'Monitor Automático 24/7',
                  'Assistente IA Chat',
                  'Dashboard Executivo',
                  'Análise em Lote CSV',
                  'Integrações E-commerce',
                  '🔥 Suporte VIP WhatsApp'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-400" />
                    </div>
                    <span className="text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan('business')}
                disabled={isButtonDisabled('business')}
                className={`
                  relative w-full py-3 rounded-xl font-bold transition-all transform
                  flex items-center justify-center gap-2
                  ${buttonState.business === 'idle' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 hover:scale-105' 
                    : buttonState.business === 'redirecting'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-purple-500/50 text-white/70 cursor-not-allowed'
                  }
                  disabled:transform-none
                  overflow-hidden
                `}
              >
                {/* Shimmer effect */}
                {buttonState.business === 'idle' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
                
                <div className="relative z-10 flex items-center gap-2">
                  {getButtonContent('business', 'Assinar Business')}
                </div>
              </button>

              {buttonState.business === 'idle' && (
                <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 mt-3">
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>Pagamento 100% Seguro</span>
                </div>
              )}

              <p className="text-center text-xs text-zinc-500 mt-3">
                🛡️ Garantia de 7 dias + Bônus Exclusivos
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-zinc-500 text-sm max-w-2xl mx-auto">
          <p className="mb-2">
            🔒 Pagamentos processados com segurança pela <strong className="text-yellow-400">Kiwify</strong>
          </p>
          <p>
            Todos os planos incluem garantia de 7 dias - cancele a qualquer momento
          </p>
        </div>

      </div>
    </div>
  );
};

export default Pricing;