const OpenAI = require('openai');
const User = require('../models/User');
const { canAnalyze, getMonthlyLimit } = require('../config/planLimits');
const { prisma } = require('../lib/prisma');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 💸 SIMULADOR DE DESCONTOS INTELIGENTE
 * Ferramenta PRO
 */
exports.simulateDiscount = async (req, res) => {
  try {
    const {
      productName,
      currentPrice,
      currentMargin,
      discountPercent,
      expectedSalesIncrease,
      currentMonthlySales
    } = req.body;

    // Validações
    if (!productName || !currentPrice || !currentMargin || !discountPercent) {
      return res.status(400).json({
        message: 'Preencha todos os campos obrigatórios'
      });
    }

    const user = req.user;
    const plan = user.plan || 'free';

    // Verificar se tem plano PRO ou superior
    if (plan === 'free') {
      return res.status(403).json({
        message: 'Ferramenta exclusiva para planos Pro e Business',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    // Verificar limite mensal
    const stats = await prisma.userStats.findUnique({
      where: { userId: user._id.toString() }
    });

    const monthlyRequests = stats?.monthlyRequests || 0;

    if (!canAnalyze(plan, monthlyRequests)) {
      const limit = getMonthlyLimit(plan);
      return res.status(403).json({
        message: 'Limite mensal atingido',
        limit,
        used: monthlyRequests,
        upgrade: plan === 'pro' ? true : false
      });
    }

    // 🧮 CÁLCULOS DE DESCONTO
    const price = parseFloat(currentPrice);
    const margin = parseFloat(currentMargin);
    const discount = parseFloat(discountPercent);
    const salesIncrease = expectedSalesIncrease ? parseFloat(expectedSalesIncrease) : 0;
    const currentSales = currentMonthlySales ? parseFloat(currentMonthlySales) : 100;

    // Preço com desconto
    const discountedPrice = price * (1 - discount / 100);
    const discountAmount = price - discountedPrice;

    // Lucro atual por unidade
    const currentProfit = price * (margin / 100);
    
    // Nova margem após desconto
    const newMargin = margin - discount;
    const newProfit = discountedPrice * (newMargin / 100);

    // Perda de lucro por unidade
    const profitLoss = currentProfit - newProfit;
    const profitLossPercent = (profitLoss / currentProfit) * 100;

    // 📊 CENÁRIO SEM AUMENTO DE VENDAS
    const scenarioNoIncrease = {
      sales: currentSales,
      revenue: currentSales * discountedPrice,
      profit: currentSales * newProfit,
      vs_current: {
        revenue: currentSales * price,
        profit: currentSales * currentProfit
      }
    };

    scenarioNoIncrease.revenueDiff = scenarioNoIncrease.revenue - scenarioNoIncrease.vs_current.revenue;
    scenarioNoIncrease.profitDiff = scenarioNoIncrease.profit - scenarioNoIncrease.vs_current.profit;

    // 📈 CENÁRIO COM AUMENTO ESPERADO
    const newSales = currentSales * (1 + salesIncrease / 100);
    const scenarioWithIncrease = {
      sales: Math.round(newSales),
      revenue: newSales * discountedPrice,
      profit: newSales * newProfit,
      vs_current: {
        revenue: currentSales * price,
        profit: currentSales * currentProfit
      }
    };

    scenarioWithIncrease.revenueDiff = scenarioWithIncrease.revenue - scenarioWithIncrease.vs_current.revenue;
    scenarioWithIncrease.profitDiff = scenarioWithIncrease.profit - scenarioWithIncrease.vs_current.profit;

    // 🎯 BREAK-EVEN (quantas vendas a mais precisa?)
    const salesNeededToCompensate = Math.ceil(
      (currentSales * currentProfit) / newProfit
    );
    const additionalSalesNeeded = salesNeededToCompensate - currentSales;
    const minimumIncreasePercent = (additionalSalesNeeded / currentSales) * 100;

    // ⚠️ ANÁLISE DE RISCO
    let riskLevel = 'low';
    let riskMessage = '';

    if (discount > 30) {
      riskLevel = 'high';
      riskMessage = 'Desconto muito alto! Pode desvalorizar sua marca.';
    } else if (discount > 20) {
      riskLevel = 'medium';
      riskMessage = 'Desconto considerável. Garanta que o aumento de vendas compense.';
    } else if (discount > 10) {
      riskLevel = 'medium';
      riskMessage = 'Desconto moderado. Bom para promoções pontuais.';
    } else {
      riskLevel = 'low';
      riskMessage = 'Desconto conservador. Baixo risco para a margem.';
    }

    if (newMargin < 20) {
      riskLevel = 'high';
      riskMessage += ' ATENÇÃO: Margem muito baixa após desconto!';
    }

    // 🤖 ANÁLISE COM IA
    const prompt = `
Você é um especialista em estratégia de preços e promoções.

DADOS DA PROMOÇÃO:
📦 Produto: ${productName}
💰 Preço atual: R$ ${price.toFixed(2)}
📊 Margem atual: ${margin.toFixed(1)}%
🏷️ Desconto proposto: ${discount}%
💵 Novo preço: R$ ${discountedPrice.toFixed(2)}
📉 Nova margem: ${newMargin.toFixed(1)}%

IMPACTO:
${salesIncrease > 0 ? `📈 Aumento esperado: +${salesIncrease}%` : '📊 Sem aumento de vendas previsto'}
🎯 Vendas extras necessárias: +${additionalSalesNeeded} (${minimumIncreasePercent.toFixed(1)}%)
${scenarioWithIncrease.profitDiff > 0 ? `✅ Lucro adicional: R$ ${scenarioWithIncrease.profitDiff.toFixed(2)}` : `⚠️ Perda de lucro: R$ ${Math.abs(scenarioWithIncrease.profitDiff).toFixed(2)}`}

Faça uma análise PRÁTICA em 3 parágrafos curtos:

1. VIABILIDADE: O desconto vale a pena? O aumento de vendas esperado compensa?
2. RISCOS: Quais os riscos desta estratégia? Como mitigar?
3. RECOMENDAÇÕES: Qual desconto ideal? Alternativas melhores?

Seja direto, honesto e use números. Use emojis para destacar pontos.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em estratégia de preços e promoções. Seja prático e objetivo.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const aiAnalysis = response.choices[0].message.content;

    // 💡 Recomendações automáticas
    const recommendations = [];

    if (scenarioWithIncrease.profitDiff < 0) {
      recommendations.push({
        type: 'danger',
        title: '🚨 ALERTA: Prejuízo Esperado',
        description: `Mesmo com aumento de ${salesIncrease}% nas vendas, você teria prejuízo de R$ ${Math.abs(scenarioWithIncrease.profitDiff).toFixed(2)}. Reconsidere este desconto!`
      });
    }

    if (minimumIncreasePercent > 50) {
      recommendations.push({
        type: 'warning',
        title: '⚠️ Meta Difícil',
        description: `Você precisa aumentar vendas em ${minimumIncreasePercent.toFixed(0)}% só para empatar. Isso é muito arriscado.`
      });
    }

    if (discount >= 50) {
      recommendations.push({
        type: 'danger',
        title: '💔 Desvalorização da Marca',
        description: 'Descontos acima de 50% podem fazer clientes acharem que seu produto não vale o preço original.'
      });
    }

    if (scenarioWithIncrease.profitDiff > 0 && salesIncrease >= minimumIncreasePercent) {
      recommendations.push({
        type: 'success',
        title: '✅ Estratégia Viável',
        description: `Se conseguir ${salesIncrease}% de aumento, você terá lucro adicional de R$ ${scenarioWithIncrease.profitDiff.toFixed(2)}!`
      });
    }

    // 📊 Incrementar estatísticas
    await prisma.userStats.upsert({
      where: { userId: user._id.toString() },
      update: { monthlyRequests: { increment: 1 }, totalRequests: { increment: 1 } },
      create: {
        userId: user._id.toString(),
        monthlyRequests: 1,
        totalRequests: 1
      }
    });

    // 💾 Salvar no histórico
    await prisma.premiumAnalysis.create({
      data: {
        userId: user._id.toString(),
        type: 'discount-simulator',
        productName,
        price,
        category: 'pricing-strategy',
        description: `Desconto ${discount}%: R$ ${price.toFixed(2)} → R$ ${discountedPrice.toFixed(2)}`,
        aiResponse: aiAnalysis,
        metadata: {
          currentPrice: price,
          discountedPrice,
          discountPercent: discount,
          currentMargin: margin,
          newMargin,
          profitLoss,
          minimumIncreasePercent,
          scenarioNoIncrease,
          scenarioWithIncrease,
          riskLevel,
          riskMessage,
          recommendations
        }
      }
    });

    return res.json({
      productName,
      currentPrice: price,
      discountedPrice,
      discountAmount,
      discountPercent: discount,
      currentMargin: margin,
      newMargin,
      profitLoss,
      profitLossPercent,
      minimumSalesIncrease: minimumIncreasePercent,
      additionalSalesNeeded,
      scenarioNoIncrease,
      scenarioWithIncrease,
      riskLevel,
      riskMessage,
      recommendations,
      aiAnalysis
    });

  } catch (error) {
    console.error('❌ Erro ao simular desconto:', error);
    return res.status(500).json({
      message: 'Erro ao processar simulação',
      error: error.message
    });
  }
};