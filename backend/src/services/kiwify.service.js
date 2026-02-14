const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// 🆕 PRODUTOS KIWIFY ATUALIZADOS - 3 PLANOS PAGOS
// ⚠️ IMPORTANTE: Você precisa criar 3 produtos na Kiwify:
// 1. PriceMind Starter - R$ 27/mês (mensal)
// 2. PriceMind Pro - R$ 67/mês (mensal) - ATUALIZAR O EXISTENTE
// 3. PriceMind Business - R$ 247/mês (mensal) - ATUALIZAR O EXISTENTE

// Depois de criar/atualizar, copie os Product IDs aqui:
const KIWIFY_PRODUCTS = {
  STARTER_MONTHLY: {
    id: process.env.KIWIFY_PRODUCT_STARTER || 'ebe60460-fcac-11f0-a88b-fb619bcf217c',
    name: 'PriceMind Starter - Mensal',
    plan: 'starter',
    price: 2700, // R$ 27,00 em centavos
    duration: 1
  },
  PRO_MONTHLY: {
    id: process.env.KIWIFY_PRODUCT_PRO || '80e88f00-f277-11f0-b816-2fe10b11cdf5',
    name: 'PriceMind Pro - Mensal',
    plan: 'pro',
    price: 4850, // R$ 67,00 em centavos (ATUALIZADO de 4850)
    duration: 1
  },
  BUSINESS_MONTHLY: {
    id: process.env.KIWIFY_PRODUCT_BUSINESS || '10039ed0-f27a-11f0-b816-2fe10b11cdf5',
    name: 'PriceMind Business - Mensal',
    plan: 'business',
    price: 9700, // R$ 977,00 em centavos (ATUALIZADO de 9700)
    duration: 1
  }
};

// CONFIGURAÇÃO KIWIFY
const KIWIFY_WEBHOOK_SECRET = process.env.KIWIFY_WEBHOOK_SECRET || '';

class KiwifyService {
  /**
   * Valida assinatura do webhook Kiwify
   */
  validateWebhookSignature(payload, signature) {
    if (!KIWIFY_WEBHOOK_SECRET) {
      console.error('❌ KIWIFY_WEBHOOK_SECRET não configurado!');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', KIWIFY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Identifica qual plano baseado no product_id
   */
  getPlanFromProductId(productId) {
    for (const [key, product] of Object.entries(KIWIFY_PRODUCTS)) {
      if (product.id === productId) {
        return { plan: product.plan, duration: product.duration };
      }
    }
    return null;
  }

  /**
   * Processa pagamento aprovado
   */
  async processPayment(webhookData) {
    const { order_id, product_id, customer, payment } = webhookData.data;

    console.log(`📦 Processando pagamento Kiwify - Order: ${order_id}`);
    console.log(`📦 Product ID: ${product_id}`);

    // 1. Identifica o plano
    const planInfo = this.getPlanFromProductId(product_id);
    if (!planInfo) {
      console.error(`❌ Produto Kiwify não reconhecido: ${product_id}`);
      console.log('Produtos registrados:', Object.values(KIWIFY_PRODUCTS).map(p => ({ id: p.id, name: p.name })));
      throw new Error(`Produto Kiwify não reconhecido: ${product_id}`);
    }

    console.log(`✅ Plano identificado: ${planInfo.plan.toUpperCase()}`);

    // 2. Busca ou cria usuário
    let user = await User.findOne({ email: customer.email });
    
    if (!user) {
      // Cria usuário automaticamente se não existir
      const bcrypt = require('bcryptjs');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = new User({
        name: customer.name,
        email: customer.email,
        password: hashedPassword,
        kiwifyCustomerId: customer.id
      });
      await user.save();
      console.log(`✅ Usuário criado automaticamente: ${customer.email}`);
    } else {
      // Atualiza kiwifyCustomerId se não tiver
      if (!user.kiwifyCustomerId) {
        user.kiwifyCustomerId = customer.id;
        await user.save();
      }
    }

    // 3. Verifica se já existe subscription para este order_id
    let subscription = await Subscription.findOne({ kiwifyOrderId: order_id });
    
    if (subscription) {
      console.log(`⚠️ Subscription já existe para order ${order_id}, atualizando...`);
      subscription.status = 'active';
      subscription.webhookData = webhookData;
      await subscription.save();
    } else {
      // 4. Cria nova subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + planInfo.duration);

      subscription = new Subscription({
        userId: user._id,
        plan: planInfo.plan,
        status: 'active',
        kiwifyOrderId: order_id,
        kiwifyProductId: product_id,
        kiwifyCustomerId: customer.id,
        amount: payment.amount,
        currency: 'BRL',
        paymentMethod: payment.method,
        startDate,
        endDate,
        nextBillingDate: endDate,
        webhookData
      });
      await subscription.save();
      console.log(`✅ Subscription criada: ${subscription._id}`);
    }

    // 5. Ativa plano no usuário
    user.activatePlan(planInfo.plan, planInfo.duration);
    user.activeSubscriptionId = subscription._id;
    await user.save();

    console.log(`🎉 Plano ${planInfo.plan.toUpperCase()} ativado para ${user.email}!`);
    
    return { user, subscription };
  }

  /**
   * Processa renovação de assinatura
   */
  async processRenewal(webhookData) {
    const { order_id } = webhookData.data;

    console.log(`🔄 Processando renovação - Order: ${order_id}`);

    // Busca subscription existente
    const subscription = await Subscription.findOne({ kiwifyOrderId: order_id });
    if (!subscription) {
      throw new Error(`Subscription não encontrada para order: ${order_id}`);
    }

    // Renova por mais 1 mês
    subscription.renew(1);
    subscription.webhookData = webhookData;
    await subscription.save();

    // Atualiza usuário
    const user = await User.findById(subscription.userId);
    if (user) {
      user.planExpiry = subscription.endDate;
      await user.save();
      console.log(`✅ Assinatura renovada para ${user.email}`);
    }
  }

  /**
   * Processa cancelamento de assinatura
   */
  async processCancellation(webhookData) {
    const { order_id } = webhookData.data;

    console.log(`❌ Processando cancelamento - Order: ${order_id}`);

    // Busca subscription
    const subscription = await Subscription.findOne({ kiwifyOrderId: order_id });
    if (!subscription) {
      throw new Error(`Subscription não encontrada para order: ${order_id}`);
    }

    // Cancela subscription
    subscription.cancel();
    subscription.webhookData = webhookData;
    await subscription.save();

    // Mantém acesso até o fim do período pago
    console.log(`⏰ Acesso mantido até ${subscription.endDate}`);
  }

  /**
   * Cronjob para verificar assinaturas expiradas
   */
  async checkExpiredSubscriptions() {
    const now = new Date();
    
    // Busca subscriptions ativas que expiraram
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lt: now }
    });

    console.log(`🔍 Verificando ${expiredSubscriptions.length} assinaturas expiradas...`);

    for (const subscription of expiredSubscriptions) {
      // Marca como expirada
      subscription.status = 'expired';
      await subscription.save();

      // Downgrade usuário para free
      const user = await User.findById(subscription.userId);
      if (user) {
        user.downgradeToFree();
        await user.save();
        console.log(`⬇️ Usuário ${user.email} downgrade para FREE (plano expirou: ${subscription.plan})`);
      }
    }

    return expiredSubscriptions.length;
  }

  /**
   * Retorna informações dos produtos (para debug)
   */
  getProductsInfo() {
    return Object.entries(KIWIFY_PRODUCTS).map(([key, product]) => ({
      key,
      id: product.id,
      name: product.name,
      plan: product.plan,
      price: `R$ ${(product.price / 100).toFixed(2)}`,
      configured: !product.id.includes('COLE_ID')
    }));
  }
}

module.exports = new KiwifyService();