import React, { useState } from 'react';
import { Loader2, CheckCircle, Sparkles, CreditCard, Shield } from 'lucide-react';
import { api } from '../../services/api';

interface CheckoutButtonProps {
  plan: 'starter' | 'pro' | 'business';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

type ButtonState = 'idle' | 'loading' | 'redirecting' | 'error';

export default function CheckoutButton({
  plan,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  onSuccess,
  onError
}: CheckoutButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');
  const [progress, setProgress] = useState(0);

  const handleCheckout = async () => {
    try {
      setState('loading');
      setProgress(0);

      // Simula progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 150);

      const response = await api.get(`/checkout/url/${plan}`);
      
      clearInterval(progressInterval);
      setProgress(100);
      setState('redirecting');

      onSuccess?.(response.data.url);

      // Aguarda animação antes de redirecionar
      setTimeout(() => {
        window.location.href = response.data.url;
      }, 1000);

    } catch (error: any) {
      setState('error');
      const errorMessage = error.response?.data?.error || 'Erro ao processar pagamento';
      onError?.(errorMessage);
      
      // Volta ao estado idle após 3s
      setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, 3000);
    }
  };

  // Configurações de variante
  const variants = {
    primary: {
      base: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700',
      disabled: 'bg-yellow-400/50 cursor-not-allowed'
    },
    secondary: {
      base: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700',
      disabled: 'bg-blue-500/50 cursor-not-allowed'
    },
    outline: {
      base: 'border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/10',
      disabled: 'border-yellow-500/50 text-yellow-400/50 cursor-not-allowed'
    }
  };

  // Configurações de tamanho
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantStyles = state === 'idle' || state === 'redirecting' 
    ? variants[variant].base 
    : variants[variant].disabled;

  const sizeStyles = sizes[size];
  const widthStyles = fullWidth ? 'w-full' : '';

  // Conteúdo do botão baseado no estado
  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processando</span>
            <div className="loading-dots w-6"></div>
          </>
        );

      case 'redirecting':
        return (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Redirecionando</span>
            <div className="w-5 h-5 animate-pulse">✨</div>
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
        return (
          <>
            {children || (
              <>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Assinar Agora</span>
                <CreditCard className="w-5 h-5" />
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCheckout}
        disabled={state !== 'idle'}
        className={`
          group relative overflow-hidden
          ${variantStyles}
          ${sizeStyles}
          ${widthStyles}
          ${className}
          rounded-xl font-bold
          transform transition-all duration-300
          hover:scale-105 hover:shadow-2xl
          disabled:transform-none disabled:shadow-none
          flex items-center justify-center gap-2
        `}
      >
        {/* Shimmer effect */}
        {state === 'idle' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}

        {/* Progress bar (loading) */}
        {state === 'loading' && (
          <div className="absolute bottom-0 left-0 h-1 bg-yellow-600/50 transition-all duration-300" style={{ width: `${progress}%` }} />
        )}

        {/* Conteúdo */}
        <div className="relative z-10 flex items-center gap-2">
          {getButtonContent()}
        </div>

        {/* Glow effect ao redirecionar */}
        {state === 'redirecting' && (
          <div className="absolute inset-0 bg-green-500/20 animate-pulse rounded-xl" />
        )}
      </button>

      {/* Badge "Pagamento Seguro" */}
      {state === 'idle' && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-zinc-500 whitespace-nowrap">
          <Shield className="w-3 h-3 text-green-400" />
          <span>Pagamento 100% Seguro</span>
        </div>
      )}
    </div>
  );
}

// Variantes pré-configuradas

export function StarterButton(props: Omit<CheckoutButtonProps, 'plan'>) {
  return (
    <CheckoutButton 
      {...props}
      plan="starter"
      variant="secondary"
    >
      <div className="flex items-center gap-2">
        <span>🚀</span>
        <span>Começar com Starter</span>
      </div>
    </CheckoutButton>
  );
}

export function ProButton(props: Omit<CheckoutButtonProps, 'plan'>) {
  return (
    <CheckoutButton 
      {...props}
      plan="pro"
      variant="primary"
    >
      <div className="flex items-center gap-2">
        <span>⚡</span>
        <span>Garantir 50% OFF</span>
      </div>
    </CheckoutButton>
  );
}

export function BusinessButton(props: Omit<CheckoutButtonProps, 'plan'>) {
  return (
    <CheckoutButton 
      {...props}
      plan="business"
      variant="primary"
    >
      <div className="flex items-center gap-2">
        <span>👑</span>
        <span>Assinar Business</span>
      </div>
    </CheckoutButton>
  );
}