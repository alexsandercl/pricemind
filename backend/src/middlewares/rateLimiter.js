// =============================================
// RATE LIMITER MIDDLEWARE (CORRIGIDO)
// =============================================
const rateLimit = require('express-rate-limit');

// =============================================
// 1. LIMITER GERAL DA API
// =============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator removido - usa IP automaticamente de forma segura
});

// =============================================
// 2. LIMITER DE LOGIN
// =============================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Muitas tentativas de login. Conta bloqueada temporariamente.',
    retryAfter: '15 minutos'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// 3. LIMITER DE REGISTRO
// =============================================
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    error: 'Muitos registros deste IP. Aguarde 1 hora.',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// 4. LIMITER DE ANÁLISE IA
// =============================================
const aiAnalysisLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    error: 'Muitas análises em curto período.',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// 5. LIMITER DE UPLOAD
// =============================================
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    error: 'Muitos uploads em curto período.',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// 6. LIMITER DE WEBHOOK
// =============================================
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    error: 'Webhook rate limit exceeded.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// 7. LIMITER DE RESET PASSWORD
// =============================================
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'Muitas solicitações de reset de senha.',
    retryAfter: '1 hora'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// EXPORTAR
// =============================================
module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  aiAnalysisLimiter,
  uploadLimiter,
  webhookLimiter,
  passwordResetLimiter
};