import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

// ✅ LINKS DE CHECKOUT KIWIFY - TODOS CONFIGURADOS
// Product IDs confirmados:
// - Starter: ebe60460-fcac-11f0-a88b-fb619bcf217c
// - Pro: 80e88f00-f277-11f0-b816-2fe10b11cdf5
// - Business: 10039ed0-f27a-11f0-b816-2fe10b11cdf5

const KIWIFY_CHECKOUT_LINKS = {
  // ⚠️ IMPORTANTE: Você precisa copiar o LINK DE PAGAMENTO do produto Starter
  // Vá em: https://dashboard.kiwify.com.br/products/edit/ebe60460-fcac-11f0-a88b-fb619bcf217c
  // Clique em "Link de Pagamento" e cole aqui:
  starter: 'https://pay.kiwify.com.br/RKfFFEV',  // Ex: https://pay.kiwify.com.br/XyZ123
  
  // Links Pro e Business (já existem, mas confirme se estão corretos)
  pro: 'https://pay.kiwify.com.br/mIaiFHn',
  business: 'https://pay.kiwify.com.br/QuOFzLt'
};

interface CheckoutProps {
  plan: 'starter' | 'pro' | 'business';
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ plan, onBack }) => {
  const [redirecting, setRedirecting] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!['starter', 'pro', 'business'].includes(plan)) {
      onBack();
      return;
    }

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          redirectToKiwify();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [plan]);

  const redirectToKiwify = () => {
    const checkoutUrl = KIWIFY_CHECKOUT_LINKS[plan];
    
    // Verifica se o link está configurado
    if (!checkoutUrl || checkoutUrl.includes('COLE_')) {
      alert(`⚠️ Link de checkout do plano ${plan.toUpperCase()} não configurado!

Por favor:
1. Acesse: https://dashboard.kiwify.com.br/products/edit/ebe60460-fcac-11f0-a88b-fb619bcf217c
2. Clique em "Link de Pagamento"
3. Copie o link (ex: https://pay.kiwify.com.br/XyZ123)
4. Cole no arquivo Checkout.tsx na linha 16`);
      onBack();
      return;
    }

    // Adiciona email e nome do usuário na URL (se disponível)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const urlWithParams = user.email 
      ? `${checkoutUrl}?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`
      : checkoutUrl;

    // Redireciona para Kiwify
    window.location.href = urlWithParams;
  };

  const planDetails = {
    starter: {
      name: 'Starter',
      price: 'R$ 27',
      badge: '✨ NOVO PLANO',
      badgeColor: 'bg-green-500',
      features: [
        '30 análises de preços por mês',
        'Análise Básica com IA',
        'Dashboard de Estatísticas',
        'Análise por PDF (e-books, catálogos)',
        'Calculadora de Lucro',
        'Histórico de 30 dias'
      ],
      color: 'bg-green-400',
      economy: null
    },
    pro: {
      name: 'Pro',
      price: 'R$ 67',
      badge: '⭐ MAIS POPULAR',
      badgeColor: 'bg-yellow-500',
      features: [
        '100 análises de preços por mês',
        'Todas as ferramentas FREE + STARTER',
        'Análise por Link (páginas de vendas)',
        'Análise por Imagem (screenshots)',
        'Break-even Calculator (NOVO!)',
        'Simulador de Descontos (NOVO!)',
        'Histórico ilimitado',
        'Suporte prioritário (resposta em 24h)'
      ],
      color: 'bg-yellow-400',
      economy: 'Economize R$ 360/ano vs ferramentas separadas'
    },
    business: {
      name: 'Business',
      price: 'R$ 247',
      badge: '🔥 MAIS COMPLETO',
      badgeColor: 'bg-orange-500',
      features: [
        'Análises ILIMITADAS',
        'Todas as 19 ferramentas',
        'Comparador de 5 Concorrentes',
        'Simulador de 3 Cenários',
        'Assistente IA 24/7 (Chat)',
        'Dashboard Executivo (PDF mensal)',
        'Análise em Lote (CSV)',
        'Monitor Automático de Preços',
        'Integrações E-commerce',
        'Suporte VIP (WhatsApp direto)'
      ],
      color: 'bg-orange-600',
      economy: 'Economize R$ 600/ano + 1h consultoria/mês inclusa'
    }
  };

  const details = planDetails[plan];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-zinc-900 rounded-2xl shadow-2xl p-8 md:p-12">
        
        {/* Header com loading */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-yellow-400/10 rounded-full mb-4">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Redirecionando para pagamento...
          </h1>
          <p className="text-zinc-400 text-lg">
            Você será redirecionado em <span className="text-yellow-400 font-bold">{countdown}s</span>
          </p>
        </div>

        {/* Detalhes do plano */}
        <div className="bg-zinc-800 rounded-xl p-6 mb-6">
          {/* Badge do plano */}
          <div className="flex justify-center mb-4">
            <span className={`${details.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
              {details.badge}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">
              Plano {details.name}
            </h3>
            <div className="text-right">
              <p className="text-3xl font-bold text-yellow-400">{details.price}</p>
              <p className="text-sm text-zinc-400">/mês</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {details.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Economia (se tiver) */}
        {details.economy && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-green-400 font-semibold mb-1">💰 {details.economy}</h4>
                <p className="text-sm text-zinc-400">
                  {plan === 'pro' 
                    ? 'Comparado a contratar ferramentas de análise e precificação separadamente'
                    : 'Inclui todas as ferramentas + suporte VIP + 1h consultoria mensal'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info de pagamento seguro */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-blue-400 font-semibold mb-1">Pagamento 100% Seguro</h4>
              <p className="text-sm text-zinc-400">
                Você será redirecionado para o Kiwify, nossa plataforma de pagamentos segura. 
                Aceitamos <strong>PIX</strong>, <strong>cartão de crédito</strong> e <strong>boleto</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Garantia */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-green-400 font-semibold mb-1">🛡️ Garantia de 7 Dias</h4>
              <p className="text-sm text-zinc-400">
                Se não ficar satisfeito, devolvemos <strong>100% do seu dinheiro</strong>. Sem perguntas.
              </p>
            </div>
          </div>
        </div>

        {/* Botão manual (se não redirecionar automaticamente) */}
        <div className="text-center">
          <p className="text-sm text-zinc-500 mb-3">
            Não foi redirecionado automaticamente?
          </p>
          <button
            onClick={redirectToKiwify}
            className="px-8 py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-500 transition-all transform hover:scale-105"
          >
            Clique aqui para prosseguir →
          </button>
        </div>

        {/* Botão voltar */}
        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;