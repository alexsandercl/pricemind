const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * 🔗 VERSÃO DEBUG - SEM AUTH (TEMPORÁRIO)
 * 
 * Teste para ver se o problema é o authMiddleware
 */
router.get('/url/:plan', async (req, res) => {
  try {
    const { plan } = req.params;
    
    console.log(`🔗 [DEBUG] Checkout chamado - Plan: ${plan}`);
    console.log(`🔗 [DEBUG] Headers:`, req.headers);
    console.log(`🔗 [DEBUG] Token presente?`, !!req.headers.authorization);
    
    // Validar plano
    const validPlans = ['starter', 'pro', 'business'];
    if (!validPlans.includes(plan)) {
      console.log(`❌ [DEBUG] Plano inválido: ${plan}`);
      return res.status(400).json({ 
        error: 'Plano inválido. Use: starter, pro ou business' 
      });
    }
    
    // URLs de checkout (TEMPORÁRIO - HARDCODED PARA TESTE)
    const checkoutUrls = {
      starter: 'https://pay.kiwify.com.br/RKfFFEV',
      pro: 'https://pay.kiwify.com.br/0yi6Iqa',
      business: 'https://pay.kiwify.com.br/35RTNy3'
    };
    
    const checkoutUrl = checkoutUrls[plan];
    
    console.log(`✅ [DEBUG] Checkout URL gerada: ${checkoutUrl}`);
    
    return res.json({ 
      url: checkoutUrl,
      plan,
      price: {
        starter: 'R$ 27,00',
        pro: 'R$ 48,50',
        business: 'R$ 97,00'
      }[plan],
      debug: true
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao gerar checkout URL:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar link de checkout',
      details: error.message
    });
  }
});

/**
 * 🔗 VERSÃO FINAL COM AUTH
 * 
 * Descomente esta e comente a de cima quando funcionar
 */
/*
router.get('/url/:plan', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.params;
    const user = req.user;
    
    console.log(`🔗 Gerando checkout URL - User: ${user.email}, Plan: ${plan}`);
    
    const validPlans = ['starter', 'pro', 'business'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ 
        error: 'Plano inválido. Use: starter, pro ou business' 
      });
    }
    
    const checkoutUrls = {
      starter: process.env.KIWIFY_CHECKOUT_STARTER || 'https://pay.kiwify.com.br/RKfFFEV',
      pro: process.env.KIWIFY_CHECKOUT_PRO || 'https://pay.kiwify.com.br/mIaiFHn',
      business: process.env.KIWIFY_CHECKOUT_BUSINESS || 'https://pay.kiwify.com.br/QuOFzLt'
    };
    
    const checkoutUrl = checkoutUrls[plan];
    
    // Adicionar parâmetros
    const urlWithParams = new URL(checkoutUrl);
    urlWithParams.searchParams.set('email', user.email);
    urlWithParams.searchParams.set('name', user.name);
    
    console.log(`✅ Checkout URL gerada: ${urlWithParams.toString()}`);
    
    return res.json({ 
      url: urlWithParams.toString(),
      plan,
      price: {
        starter: 'R$ 27,00',
        pro: 'R$ 67,00',
        business: 'R$ 247,00'
      }[plan]
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar checkout URL:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar link de checkout' 
    });
  }
});
*/

router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        price: 27.00,
        currency: 'BRL',
        features: [
          '50 análises/mês',
          '3 ferramentas',
          'Análise por PDF',
          'Calculadora de Lucro',
          'Histórico 90 dias'
        ],
        badge: 'NOVO!'
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 67.00,
        currency: 'BRL',
        features: [
          '100 análises/mês',
          '6 ferramentas',
          'Análise por PDF',
          'Análise por Link',
          'Análise por Imagem',
          'Calculadora de Lucro',
          'Break-even Calculator',
          'Simulador de Descontos',
          'Histórico ilimitado'
        ],
        popular: true
      },
      {
        id: 'business',
        name: 'Business',
        price: 247.00,
        currency: 'BRL',
        features: [
          'Análises ilimitadas',
          '14 ferramentas',
          'Todas as ferramentas Pro',
          'Comparador 5 Concorrentes',
          'Monitor Automático 24/7',
          'Assistente IA Chat',
          'Dashboard Executivo',
          'Análise em Lote CSV',
          'Integrações E-commerce',
          'Suporte VIP WhatsApp'
        ]
      }
    ];
    
    return res.json({ plans });
    
  } catch (error) {
    console.error('❌ Erro ao buscar planos:', error);
    return res.status(500).json({ error: 'Erro ao buscar planos' });
  }
});

module.exports = router;