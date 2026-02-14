const OpenAI = require('openai');
const User = require('../models/User');
const { canAnalyze, getMonthlyLimit } = require('../config/planLimits');
const { prisma } = require('../lib/prisma');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 📊 CALCULADORA DE PONTO DE EQUILÍBRIO (BREAK-EVEN)
 * Ferramenta PRO
 */
exports.calculateBreakEven = async (req, res) => {
  try {
    const {
      productName,
      sellingPrice,
      variableCost,
      fixedCosts,
      targetProfit
    } = req.body;

    // Validações
    if (!productName || !sellingPrice || !variableCost || !fixedCosts) {
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

    // 🧮 CÁLCULOS DE BREAK-EVEN
    const price = parseFloat(sellingPrice);
    const varCost = parseFloat(variableCost);
    const fixedCost = parseFloat(fixedCosts);
    const targetProfitValue = targetProfit ? parseFloat(targetProfit) : 0;

    // Margem de contribuição unitária
    const contributionMargin = price - varCost;
    const contributionMarginPercent = (contributionMargin / price) * 100;

    // Ponto de equilíbrio em unidades
    const breakEvenUnits = Math.ceil(fixedCost / contributionMargin);

    // Ponto de equilíbrio em receita
    const breakEvenRevenue = breakEvenUnits * price;

    // Unidades para atingir lucro alvo
    const unitsForTargetProfit = targetProfitValue > 0 
      ? Math.ceil((fixedCost + targetProfitValue) / contributionMargin)
      : breakEvenUnits;

    const revenueForTargetProfit = unitsForTargetProfit * price;

    // Margem de segurança (se vender 20% a mais que break-even)
    const safetyMarginUnits = Math.ceil(breakEvenUnits * 1.2);
    const safetyMarginRevenue = safetyMarginUnits * price;

    // 📊 Projeções (30/60/90 dias)
    const projections = [
      {
        period: '30 dias',
        sales: Math.ceil(breakEvenUnits / 3),
        revenue: Math.ceil(breakEvenUnits / 3) * price,
        profit: (Math.ceil(breakEvenUnits / 3) * contributionMargin) - fixedCost,
        status: (Math.ceil(breakEvenUnits / 3) * contributionMargin) >= fixedCost ? 'Lucrando' : 'Prejuízo'
      },
      {
        period: '60 dias',
        sales: Math.ceil((breakEvenUnits / 3) * 2),
        revenue: Math.ceil((breakEvenUnits / 3) * 2) * price,
        profit: (Math.ceil((breakEvenUnits / 3) * 2) * contributionMargin) - fixedCost,
        status: (Math.ceil((breakEvenUnits / 3) * 2) * contributionMargin) >= fixedCost ? 'Lucrando' : 'Prejuízo'
      },
      {
        period: '90 dias',
        sales: breakEvenUnits,
        revenue: breakEvenRevenue,
        profit: (breakEvenUnits * contributionMargin) - fixedCost,
        status: 'Break-even'
      }
    ];

    // 🤖 ANÁLISE COM IA
    const prompt = `
Você é um especialista em gestão financeira e análise de viabilidade de negócios.

DADOS DO PRODUTO:
📦 Produto: ${productName}
💰 Preço de venda: R$ ${price.toFixed(2)}
📉 Custo variável: R$ ${varCost.toFixed(2)}
🏢 Custos fixos mensais: R$ ${fixedCost.toFixed(2)}
${targetProfitValue > 0 ? `🎯 Meta de lucro: R$ ${targetProfitValue.toFixed(2)}` : ''}

RESULTADOS CALCULADOS:
💵 Margem de contribuição: R$ ${contributionMargin.toFixed(2)} (${contributionMarginPercent.toFixed(1)}%)
🎯 Break-even: ${breakEvenUnits} unidades = R$ ${breakEvenRevenue.toFixed(2)}
${targetProfitValue > 0 ? `📈 Para lucro alvo: ${unitsForTargetProfit} unidades` : ''}

Faça uma análise PRÁTICA em 3 parágrafos curtos:

1. VIABILIDADE: Este negócio é viável? A margem de contribuição é saudável?
2. DESAFIOS: Quantas vendas por dia são necessárias? É realista?
3. RECOMENDAÇÕES: 2-3 ações para reduzir break-even ou aumentar margem

Seja direto, honesto e use números. Use emojis para destacar pontos.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise financeira. Seja prático e objetivo.'
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

    if (contributionMarginPercent < 30) {
      recommendations.push({
        type: 'warning',
        title: '⚠️ Margem Baixa',
        description: `Sua margem de contribuição de ${contributionMarginPercent.toFixed(1)}% é baixa. Considere aumentar preço ou reduzir custos variáveis.`
      });
    }

    if (breakEvenUnits > 100) {
      recommendations.push({
        type: 'info',
        title: '📊 Volume Alto',
        description: `Você precisa vender ${breakEvenUnits} unidades. Isso equivale a ${Math.ceil(breakEvenUnits / 30)} vendas/dia. Avalie se é realista.`
      });
    }

    if (contributionMarginPercent > 50) {
      recommendations.push({
        type: 'success',
        title: '✅ Margem Excelente',
        description: `Margem de ${contributionMarginPercent.toFixed(1)}% é muito boa! Você tem espaço para testar descontos.`
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
        type: 'break-even',
        productName,
        price,
        category: 'financial',
        description: `Break-even: ${breakEvenUnits} unidades`,
        aiResponse: aiAnalysis,
        metadata: {
          sellingPrice: price,
          variableCost: varCost,
          fixedCosts: fixedCost,
          targetProfit: targetProfitValue,
          contributionMargin,
          contributionMarginPercent,
          breakEvenUnits,
          breakEvenRevenue,
          unitsForTargetProfit,
          projections,
          recommendations
        }
      }
    });

    return res.json({
      productName,
      sellingPrice: price,
      variableCost: varCost,
      fixedCosts: fixedCost,
      targetProfit: targetProfitValue,
      contributionMargin,
      contributionMarginPercent,
      breakEvenUnits,
      breakEvenRevenue,
      unitsForTargetProfit,
      revenueForTargetProfit,
      safetyMarginUnits,
      safetyMarginRevenue,
      dailySalesNeeded: Math.ceil(breakEvenUnits / 30),
      projections,
      recommendations,
      aiAnalysis
    });

  } catch (error) {
    console.error('❌ Erro ao calcular break-even:', error);
    return res.status(500).json({
      message: 'Erro ao processar cálculo',
      error: error.message
    });
  }
};