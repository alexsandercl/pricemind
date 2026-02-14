const kiwifyService = require('../services/kiwify.service');
const emailService = require('../services/email.service');
const User = require('../models/User');

class WebhookController {
  /**
   * Endpoint principal do webhook Kiwify
   * POST /api/webhooks/kiwify
   */
  async handleKiwifyWebhook(req, res) {
    try {
      const webhookData = req.body;
      const signature = req.headers['x-kiwify-signature'];

      console.log('🔨 Webhook Kiwify recebido:', webhookData.event);

      // 1. Valida assinatura do webhook
      const payload = JSON.stringify(req.body);
      const isValid = kiwifyService.validateWebhookSignature(payload, signature);

      if (!isValid) {
        console.error('❌ Assinatura inválida do webhook Kiwify');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // 2. Processa evento baseado no tipo
      const event = webhookData.event;

      switch (event) {
        case 'order.paid':
        case 'order.approved':
          const { user, subscription } = await kiwifyService.processPayment(webhookData);
          
          // Envia email de boas-vindas
          if (user && emailService) {
            try {
              await emailService.sendWelcomeEmail(user, subscription.plan);
            } catch (emailError) {
              console.error('⚠️ Erro ao enviar email de boas-vindas:', emailError);
            }
          }
          break;

        case 'subscription.renewed':
          await kiwifyService.processRenewal(webhookData);
          break;

        case 'subscription.cancelled':
          await kiwifyService.processCancellation(webhookData);
          break;

        case 'order.refunded':
          await this.handleRefund(webhookData);
          break;

        case 'order.chargeback':
          await this.handleChargeback(webhookData);
          break;

        default:
          console.log(`⚠️ Evento não tratado: ${event}`);
      }

      return res.status(200).json({ 
        success: true,
        message: 'Webhook processed successfully' 
      });

    } catch (error) {
      console.error('❌ Erro ao processar webhook Kiwify:', error);
      
      return res.status(200).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async handleRefund(webhookData) {
    const { customer } = webhookData.data;
    
    const user = await User.findOne({ email: customer.email });
    if (user) {
      user.downgradeToFree();
      await user.save();
      
      if (emailService) {
        await emailService.sendRefundEmail(user);
      }
      
      console.log(`💸 Reembolso processado para ${user.email}`);
    }
  }

  async handleChargeback(webhookData) {
    const { order_id, customer } = webhookData.data;
    
    console.log(`⚠️ CHARGEBACK detectado - Order: ${order_id}`);

    const user = await User.findOne({ email: customer.email });
    if (user) {
      user.downgradeToFree();
      user.hasChargeback = true;
      await user.save();
      
      if (emailService) {
        await emailService.sendChargebackAlert(user, order_id);
      }
      
      console.log(`🚨 Chargeback marcado para ${user.email}`);
    }
  }

  /**
   * Endpoint para testar webhook localmente
   * GET /api/webhooks/test
   * 
   * 🆕 ATUALIZADO: Agora testa os 3 planos
   */
  async testWebhook(req, res) {
    try {
      const { plan = 'pro' } = req.query; // ?plan=starter ou ?plan=pro ou ?plan=business

      // Mapeia planos para Product IDs
      const productIds = {
        starter: process.env.KIWIFY_PRODUCT_STARTER || 'ebe60460-fcac-11f0-a88b-fb619bcf217c',
        pro: process.env.KIWIFY_PRODUCT_PRO || '80e88f00-f277-11f0-b816-2fe10b11cdf5',
        business: process.env.KIWIFY_PRODUCT_BUSINESS || '10039ed0-f27a-11f0-b816-2fe10b11cdf5'
      };

      const prices = {
        starter: 2700,  // R$ 27,00
        pro: 6700,      // R$ 67,00
        business: 24700 // R$ 247,00
      };

      if (!['starter', 'pro', 'business'].includes(plan)) {
        return res.status(400).json({
          error: 'Plano inválido. Use: ?plan=starter ou ?plan=pro ou ?plan=business'
        });
      }

      const fakeWebhook = {
        event: 'order.paid',
        data: {
          order_id: `test_order_${plan}_${Date.now()}`,
          product_id: productIds[plan],
          customer: {
            id: 'test_customer_123',
            email: 'teste@example.com',
            name: 'Usuário Teste'
          },
          payment: {
            amount: prices[plan],
            method: 'credit_card',
            status: 'approved'
          }
        }
      };

      console.log(`🧪 Testando webhook para plano: ${plan.toUpperCase()}`);
      const result = await kiwifyService.processPayment(fakeWebhook);

      return res.json({ 
        success: true, 
        message: `Webhook de teste processado com sucesso para plano ${plan.toUpperCase()}!`,
        user: {
          email: result.user.email,
          plan: result.user.plan,
          planExpiry: result.user.planExpiry
        },
        subscription: {
          id: result.subscription._id,
          plan: result.subscription.plan,
          status: result.subscription.status,
          amount: `R$ ${(result.subscription.amount / 100).toFixed(2)}`
        }
      });

    } catch (error) {
      console.error('❌ Erro no teste do webhook:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * 🆕 Endpoint para debugar produtos Kiwify
   * GET /api/webhooks/products
   */
  async getProducts(req, res) {
    try {
      const products = kiwifyService.getProductsInfo();
      
      return res.json({
        success: true,
        products,
        message: products.some(p => !p.configured) 
          ? '⚠️ Alguns produtos ainda não estão configurados!' 
          : '✅ Todos os produtos configurados!'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new WebhookController();