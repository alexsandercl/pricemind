/**
 * 🎯 LIMITES DE ANÁLISES POR PLANO
 */

const PLAN_LIMITS = {
  free: 10,        // 10 análises/mês
  starter: 50,     // 50 análises/mês
  pro: 100,        // 100 análises/mês
  business: -1     // Ilimitado
};

/**
 * 🔧 FEATURES POR PLANO
 */
const PLAN_FEATURES = {
  free: {
    tools: ['basic-analysis'],
    maxRequests: 10,
    historyDays: 30,
    label: 'Free',
    color: 'zinc'
  },
  starter: {
    tools: ['basic-analysis', 'profit-calculator', 'pdf-analysis'],
    maxRequests: 50,
    historyDays: 90,
    label: 'Starter',
    color: 'blue'
  },
  pro: {
    tools: [
      'basic-analysis', 
      'profit-calculator', 
      'pdf-analysis',
      'image-analysis',
      'link-analysis',
      'competitor-comparison'
    ],
    maxRequests: 100,
    historyDays: -1, // ilimitado
    label: 'Pro',
    color: 'yellow'
  },
  business: {
    tools: [
      'basic-analysis',
      'profit-calculator',
      'pdf-analysis',
      'image-analysis',
      'link-analysis',
      'competitor-comparison',
      'scenario-simulator',
      'executive-dashboard',
      'batch-analysis',
      'price-monitor',
      'ai-assistant',
      'integrations',
      'custom-reports'
    ],
    maxRequests: -1, // ilimitado
    historyDays: -1, // ilimitado
    label: 'Business',
    color: 'orange'
  }
};

/**
 * Retorna o limite mensal de análises para um plano
 * @param {string} plan - Nome do plano ('free', 'starter', 'pro', 'business')
 * @returns {number} Limite mensal (-1 para ilimitado)
 */
function getMonthlyLimit(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Verifica se usuário pode fazer análise
 * @param {string} plan - Plano do usuário
 * @param {number} monthlyRequests - Número de análises no mês
 * @returns {boolean} True se pode analisar
 */
function canAnalyze(plan, monthlyRequests) {
  const limit = getMonthlyLimit(plan);
  
  // Business = ilimitado
  if (limit === -1) {
    return true;
  }
  
  // Free, Starter e Pro = verificar limite
  return monthlyRequests < limit;
}

/**
 * Retorna informações de uso
 * @param {string} plan - Plano do usuário
 * @param {number} monthlyRequests - Análises feitas no mês
 * @returns {object} Informações de uso
 */
function getUsageInfo(plan, monthlyRequests) {
  const limit = getMonthlyLimit(plan);
  
  if (limit === -1) {
    return {
      used: monthlyRequests,
      limit: 'unlimited',
      remaining: 'unlimited',
      canAnalyze: true
    };
  }
  
  return {
    used: monthlyRequests,
    limit,
    remaining: Math.max(0, limit - monthlyRequests),
    canAnalyze: monthlyRequests < limit
  };
}

/**
 * Verifica se usuário tem acesso a uma ferramenta específica
 * @param {string} plan - Plano do usuário
 * @param {string} tool - Nome da ferramenta
 * @returns {boolean} True se tem acesso
 */
function hasToolAccess(plan, tool) {
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  return features.tools.includes(tool);
}

/**
 * Retorna todas as features de um plano
 * @param {string} plan - Plano do usuário
 * @returns {object} Features do plano
 */
function getPlanFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}

module.exports = {
  PLAN_LIMITS,
  PLAN_FEATURES,
  getMonthlyLimit,
  canAnalyze,
  getUsageInfo,
  hasToolAccess,
  getPlanFeatures
};