import { api } from './api';

export interface CheckoutResponse {
  url: string;
  plan: string;
  price: string;
}

export interface CheckoutError {
  error: string;
  details?: string;
}

/**
 * Gera URL de checkout do Kiwify para um plano
 */
export async function generateCheckoutUrl(plan: 'starter' | 'pro' | 'business'): Promise<CheckoutResponse> {
  try {
    const response = await api.get<CheckoutResponse>(`/checkout/url/${plan}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao gerar link de checkout');
  }
}

/**
 * Redireciona para checkout com validações
 */
export async function redirectToCheckout(plan: 'starter' | 'pro' | 'business'): Promise<void> {
  try {
    const { url } = await generateCheckoutUrl(plan);
    
    // Valida URL antes de redirecionar
    if (!url || !url.startsWith('https://')) {
      throw new Error('URL de checkout inválida');
    }

    window.location.href = url;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Obtém informações dos planos disponíveis
 */
export async function getAvailablePlans() {
  try {
    const response = await api.get('/checkout/plans');
    return response.data.plans;
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return [];
  }
}

/**
 * Formata preço para exibição (R$ 27,00)
 */
export function formatPrice(cents: number): string {
  const reais = cents / 100;
  return `R$ ${reais.toFixed(2).replace('.', ',')}`;
}

/**
 * Retorna cor do plano para UI
 */
export function getPlanColor(plan: string): string {
  const colors = {
    starter: 'green',
    pro: 'yellow',
    business: 'purple'
  };
  return colors[plan as keyof typeof colors] || 'gray';
}

/**
 * Retorna ícone do plano
 */
export function getPlanIcon(plan: string): string {
  const icons = {
    starter: '🚀',
    pro: '⚡',
    business: '👑'
  };
  return icons[plan as keyof typeof icons] || '📦';
}

/**
 * Valida se usuário pode fazer upgrade
 */
export function canUpgrade(currentPlan: string, targetPlan: string): boolean {
  const planOrder = ['free', 'starter', 'pro', 'business'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  
  return targetIndex > currentIndex;
}

/**
 * Valida se usuário pode fazer downgrade
 */
export function canDowngrade(currentPlan: string, targetPlan: string): boolean {
  const planOrder = ['free', 'starter', 'pro', 'business'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  
  return targetIndex < currentIndex;
}

/**
 * Retorna mensagem de erro amigável
 */
export function getCheckoutErrorMessage(error: any): string {
  if (error.response) {
    // Erro da API
    switch (error.response.status) {
      case 400:
        return 'Dados inválidos. Verifique as informações.';
      case 401:
        return 'Você precisa estar logado para continuar.';
      case 404:
        return 'Plano não encontrado. Tente novamente.';
      case 500:
        return 'Erro no servidor. Tente novamente em alguns instantes.';
      default:
        return error.response.data?.error || 'Erro ao processar pagamento';
    }
  } else if (error.request) {
    // Erro de rede
    return 'Sem conexão com o servidor. Verifique sua internet.';
  } else {
    // Erro desconhecido
    return error.message || 'Erro inesperado. Tente novamente.';
  }
}

/**
 * Rastreia evento de checkout (para analytics)
 */
export function trackCheckoutEvent(
  event: 'started' | 'completed' | 'failed',
  plan: string,
  metadata?: Record<string, any>
) {
  // Integração com Google Analytics, Facebook Pixel, etc
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', `checkout_${event}`, {
      plan,
      ...metadata
    });
  }
  
  console.log(`[Checkout] ${event}:`, { plan, ...metadata });
}

export default {
  generateCheckoutUrl,
  redirectToCheckout,
  getAvailablePlans,
  formatPrice,
  getPlanColor,
  getPlanIcon,
  canUpgrade,
  canDowngrade,
  getCheckoutErrorMessage,
  trackCheckoutEvent
};