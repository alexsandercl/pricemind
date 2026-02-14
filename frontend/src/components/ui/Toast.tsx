import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, Loader2, CreditCard, Shield } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'checkout';

export interface ToastProps {
  id?: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Toast({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, type]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'from-green-500/20 to-green-600/20',
      borderColor: 'border-green-500/50',
      iconColor: 'text-green-400',
      progressColor: 'bg-green-500',
      iconAnimation: 'animate-check-mark'
    },
    error: {
      icon: XCircle,
      bgColor: 'from-red-500/20 to-red-600/20',
      borderColor: 'border-red-500/50',
      iconColor: 'text-red-400',
      progressColor: 'bg-red-500',
      iconAnimation: 'animate-shake'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'from-yellow-500/20 to-yellow-600/20',
      borderColor: 'border-yellow-500/50',
      iconColor: 'text-yellow-400',
      progressColor: 'bg-yellow-500',
      iconAnimation: 'animate-wiggle'
    },
    info: {
      icon: Info,
      bgColor: 'from-blue-500/20 to-blue-600/20',
      borderColor: 'border-blue-500/50',
      iconColor: 'text-blue-400',
      progressColor: 'bg-blue-500',
      iconAnimation: 'animate-bounce-subtle'
    },
    loading: {
      icon: Loader2,
      bgColor: 'from-zinc-700/20 to-zinc-800/20',
      borderColor: 'border-zinc-600/50',
      iconColor: 'text-zinc-400',
      progressColor: 'bg-zinc-500',
      iconAnimation: 'animate-spin'
    },
    checkout: {
      icon: CreditCard,
      bgColor: 'from-yellow-500/20 to-yellow-600/20',
      borderColor: 'border-yellow-500/50',
      iconColor: 'text-yellow-400',
      progressColor: 'bg-yellow-500',
      iconAnimation: 'animate-pulse-glow'
    }
  };

  const { icon: Icon, bgColor, borderColor, iconColor, progressColor, iconAnimation } = config[type];

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${bgColor}
        backdrop-blur-xl border ${borderColor}
        rounded-xl p-4 shadow-2xl
        min-w-[320px] max-w-md
        transform transition-all duration-300
        ${isLeaving ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
    >
      {/* Progress bar */}
      {duration > 0 && type !== 'loading' && !isLeaving && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/50">
          <div
            className={`h-full ${progressColor} transition-all ease-linear`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          ></div>
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${iconColor} flex-shrink-0 mt-0.5 ${iconAnimation}`}>
          <Icon size={24} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-8">
          <h4 className="font-semibold text-white text-sm mb-1">
            {title}
          </h4>
          {message && (
            <p className="text-zinc-300 text-xs leading-relaxed">
              {message}
            </p>
          )}

          {/* Action button */}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className="mt-2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              {action.label} →
            </button>
          )}
        </div>

        {/* Close button */}
        {type !== 'loading' && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Special badge for checkout */}
      {type === 'checkout' && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-400">
          <Shield className="w-3 h-3" />
          <span>Seguro</span>
        </div>
      )}

      {/* CSS for progress bar animation */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Container para múltiplos toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto space-y-3">
        {children}
      </div>
    </div>
  );
}

// Hook para gerenciar toasts
export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const show = (props: Omit<ToastProps, 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast = { ...props, id };
    
    setToasts(prev => [...prev, toast]);

    // Auto-remove após duração
    if (props.duration !== 0 && props.type !== 'loading') {
      setTimeout(() => {
        remove(id);
      }, props.duration || 5000);
    }

    return id;
  };

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (title: string, message?: string, duration?: number) => {
    return show({ type: 'success', title, message, duration });
  };

  const error = (title: string, message?: string, duration?: number) => {
    return show({ type: 'error', title, message, duration });
  };

  const warning = (title: string, message?: string, duration?: number) => {
    return show({ type: 'warning', title, message, duration });
  };

  const info = (title: string, message?: string, duration?: number) => {
    return show({ type: 'info', title, message, duration });
  };

  const loading = (title: string, message?: string) => {
    return show({ type: 'loading', title, message, duration: 0 });
  };

  const checkout = (title: string, message?: string, duration?: number) => {
    return show({ type: 'checkout', title, message, duration: duration || 3000 });
  };

  return {
    toasts,
    show,
    remove,
    success,
    error,
    warning,
    info,
    loading,
    checkout
  };
}

// Toasts pré-configurados para checkout

export const CheckoutToasts = {
  processing: (toastId?: string) => ({
    id: toastId,
    type: 'loading' as ToastType,
    title: 'Processando pagamento',
    message: 'Gerando link seguro...',
    duration: 0
  }),

  redirecting: {
    type: 'checkout' as ToastType,
    title: 'Redirecionando para pagamento',
    message: 'Você será levado para uma página segura',
    duration: 3000
  },

  success: {
    type: 'success' as ToastType,
    title: 'Link gerado com sucesso!',
    message: 'Redirecionando em instantes...',
    duration: 2000
  },

  error: (message?: string) => ({
    type: 'error' as ToastType,
    title: 'Erro ao processar',
    message: message || 'Tente novamente ou entre em contato',
    duration: 5000
  })
};