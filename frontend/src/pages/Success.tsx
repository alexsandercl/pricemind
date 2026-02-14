import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface SuccessProps {
  onGoToDashboard: () => void;
  onGoToHome: () => void;
}

const Success: React.FC<SuccessProps> = ({ onGoToDashboard, onGoToHome }) => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [plan, setPlan] = useState<string>('');
  
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');
  const status = params.get('status');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const token = localStorage.getItem('token');
      const response = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = response.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      setPlan(userData.plan || 'free');
      setVerified(true);
      setLoading(false);

    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      setLoading(false);
      setVerified(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verificando pagamento...</p>
          <p className="text-zinc-400 text-sm mt-2">Aguarde alguns instantes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="text-yellow-400" size={20} />
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 md:p-12 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-green-500/20 rounded-full mb-4 animate-pulse">
              <CheckCircle className="w-20 h-20 text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Pagamento Confirmado!
            </h1>
            <p className="text-zinc-400 text-lg">
              Bem-vindo ao PriceMind <span className="text-yellow-400 font-bold uppercase">{plan}</span>
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">O que acontece agora?</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Acesso Liberado</h4>
                  <p className="text-zinc-400 text-sm">
                    Seu plano já está ativo! Todas as funcionalidades estão disponíveis agora.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Email de Confirmação</h4>
                  <p className="text-zinc-400 text-sm">
                    Enviamos um email com todos os detalhes da sua assinatura.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Comece a Usar</h4>
                  <p className="text-zinc-400 text-sm">
                    Faça sua primeira análise de preços e otimize seus lucros!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onGoToDashboard}
              className="w-full py-4 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 group"
            >
              Ir para Dashboard
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onGoToHome}
              className="w-full py-3 border border-zinc-700 text-white rounded-xl hover:bg-zinc-800 transition-all"
            >
              Voltar para Início
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 mb-2">Precisa de ajuda?</p>
            <a 
              href="mailto:suporte@pricemind.com.br" 
              className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
            >
              Fale com nosso suporte
            </a>
          </div>

          {orderId && (
            <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-600">
                ID do Pedido: {orderId}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            🛡️ <span className="text-white">Garantia de 7 dias</span> - 100% do seu dinheiro de volta se não ficar satisfeito
          </p>
        </div>
      </div>
    </div>
  );
};

export default Success;