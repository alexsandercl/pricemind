const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

/**
 * 🔒 MIDDLEWARE DE SEGURANÇA PARA WEBHOOKS KIWIFY
 */

class WebhookMiddleware {
  /**
   * Valida se a requisição veio do Kiwify
   * Verifica a assinatura HMAC SHA256
   */
  validateKiwifySignature(req, res, next) {
    try {
      const signature = req.headers['x-kiwify-signature'];
      const secret = process.env.KIWIFY_WEBHOOK_SECRET;

      // 1. Verifica se tem secret configurado
      if (!secret) {
        console.error('❌ KIWIFY_WEBHOOK_SECRET não configurado no .env');
        return res.status(500).json({ 
          error: 'Webhook secret not configured' 
        });
      }

      // 2. Verifica se tem assinatura no header
      if (!signature) {
        console.error('❌ Webhook sem assinatura');
        return res.status(401).json({ 
          error: 'Missing signature header' 
        });
      }

      // 3. Calcula assinatura esperada
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // 4. Compara assinaturas (timing-safe)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        console.error('❌ Assinatura inválida do webhook Kiwify');
        return res.status(401).json({ 
          error: 'Invalid signature' 
        });
      }

      console.log('✅ Assinatura do webhook validada');
      next();

    } catch (error) {
      console.error('❌ Erro ao validar assinatura:', error);
      return res.status(401).json({ 
        error: 'Signature validation failed' 
      });
    }
  }

  /**
   * Previne processamento duplicado de webhooks
   * Usa idempotency key baseada no order_id
   */
  checkIdempotency(req, res, next) {
    try {
      const webhookData = req.body;
      const orderId = webhookData.data?.order_id;

      if (!orderId) {
        console.warn('⚠️ Webhook sem order_id');
        return next();
      }

      // Verifica se já processou este order_id nos últimos 5 minutos
      // (em produção, use Redis para isso)
      const cacheKey = `webhook:${orderId}`;
      
      if (global.webhookCache && global.webhookCache[cacheKey]) {
        const timeDiff = Date.now() - global.webhookCache[cacheKey];
        
        if (timeDiff < 5 * 60 * 1000) { // 5 minutos
          console.log(`⚠️ Webhook duplicado ignorado: ${orderId}`);
          return res.status(200).json({ 
            success: true,
            message: 'Webhook already processed (idempotent)' 
          });
        }
      }

      // Marca como processado
      if (!global.webhookCache) {
        global.webhookCache = {};
      }
      global.webhookCache[cacheKey] = Date.now();

      // Limpa cache antigo (> 10 minutos)
      setImmediate(() => {
        Object.keys(global.webhookCache).forEach(key => {
          if (Date.now() - global.webhookCache[key] > 10 * 60 * 1000) {
            delete global.webhookCache[key];
          }
        });
      });

      next();

    } catch (error) {
      console.error('❌ Erro no checkIdempotency:', error);
      next(); // Continua mesmo com erro
    }
  }

  /**
   * Valida estrutura básica do payload do webhook
   */
  validatePayloadStructure(req, res, next) {
    try {
      const { event, data } = req.body;

      // 1. Verifica campos obrigatórios
      if (!event) {
        return res.status(400).json({ 
          error: 'Missing event field' 
        });
      }

      if (!data) {
        return res.status(400).json({ 
          error: 'Missing data field' 
        });
      }

      // 2. Valida eventos conhecidos
      const validEvents = [
        'order.paid',
        'order.approved',
        'order.refunded',
        'order.chargeback',
        'subscription.renewed',
        'subscription.cancelled'
      ];

      if (!validEvents.includes(event)) {
        console.warn(`⚠️ Evento desconhecido: ${event}`);
      }

      // 3. Valida campos essenciais baseado no evento
      if (event.startsWith('order.') || event.startsWith('subscription.')) {
        if (!data.order_id) {
          return res.status(400).json({ 
            error: 'Missing order_id in data' 
          });
        }

        if (!data.customer || !data.customer.email) {
          return res.status(400).json({ 
            error: 'Missing customer email in data' 
          });
        }
      }

      next();

    } catch (error) {
      console.error('❌ Erro ao validar payload:', error);
      return res.status(400).json({ 
        error: 'Invalid payload structure' 
      });
    }
  }

  /**
   * Rate limiting para prevenir abuso
   */
  getRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Máximo 100 webhooks em 15min
      message: 'Too many webhook requests',
      standardHeaders: true,
      legacyHeaders: false,
      // Não bloqueia IP do Kiwify em produção
      skip: (req) => {
        // Em produção, adicione IPs do Kiwify aqui
        // const kiwifyIPs = ['IP1', 'IP2'];
        // return kiwifyIPs.includes(req.ip);
        return false;
      }
    });
  }

  /**
   * Log estruturado de webhooks para auditoria
   */
  logWebhook(req, res, next) {
    const { event, data } = req.body;
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;

    console.log('\n' + '='.repeat(60));
    console.log(`📥 WEBHOOK RECEBIDO - ${timestamp}`);
    console.log(`Event: ${event}`);
    console.log(`Order ID: ${data?.order_id || 'N/A'}`);
    console.log(`Customer: ${data?.customer?.email || 'N/A'}`);
    console.log(`IP: ${ip}`);
    console.log('='.repeat(60) + '\n');

    // TODO: Em produção, salvar em banco de dados
    // await WebhookLog.create({ event, data, ip, timestamp });

    next();
  }

  /**
   * Middleware de erro para webhooks
   */
  handleWebhookError(err, req, res, next) {
    console.error('❌ Erro no processamento do webhook:', err);

    // Sempre retorna 200 para o Kiwify não reenviar
    // Mas loga o erro internamente
    return res.status(200).json({ 
      success: false,
      error: 'Internal error, webhook logged for review',
      // Não expõe detalhes do erro por segurança
    });
  }
}

module.exports = new WebhookMiddleware();