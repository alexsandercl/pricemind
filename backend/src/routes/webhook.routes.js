const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const webhookMiddleware = require('../middlewares/webhook.middleware');

const router = express.Router();

/**
 * POST /api/webhooks/kiwify
 * Webhook principal do Kiwify com segurança completa
 */
router.post('/kiwify',
  webhookMiddleware.getRateLimiter(),           // Rate limiting
  webhookMiddleware.logWebhook,                 // Log de auditoria
  webhookMiddleware.validatePayloadStructure,   // Valida estrutura
  webhookMiddleware.checkIdempotency,           // Previne duplicação
  webhookMiddleware.validateKiwifySignature,    // Valida assinatura HMAC
  webhookController.handleKiwifyWebhook
);

/**
 * POST /api/webhooks/kiwify/test
 * Testar webhook localmente (apenas desenvolvimento)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/kiwify/test', webhookController.testWebhook);
}

// Error handler para webhooks
router.use(webhookMiddleware.handleWebhookError);

module.exports = router;