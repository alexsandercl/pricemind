const OpenAI = require('openai');
const User = require('../models/User');
const { canAnalyze, getMonthlyLimit } = require('../config/planLimits');
const { prisma } = require('../lib/prisma');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 📊 CALCULAR ROI DE TRÁFEGO PAGO
 */
exports.calculateROI = async (req, res) => {
  try {
    const {
      investment,
      cpc,
      conversionRate,
      productPrice,
      installments,
      productionCost
    } = req.body;

    // Validações
    if (!investment || !cpc || !conversionRate || !productPrice) {
      return res.status(400).json({
        message: 'Preencha todos os campos obrigatórios'
      });
    }

    const user = req.user;
    const plan = user.plan || 'free';

    // Verificar limite (BUSINESS = ilimitado)
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
        upgrade: true
      });
    }

    // 🧮 CÁLCULOS BÁSICOS
    const clicks = investment / cpc;
    const convRate = conversionRate / 100;
    const sales = Math.floor(clicks * convRate);
    const revenue = sales * productPrice;
    const costPerSale = productionCost || 0;
    const totalCosts = investment + (sales * costPerSale);
    const profit = revenue - totalCosts;
    const roi = ((profit / investment) * 100);

    // 📈 MULTIPLICADORES DE PARCELAMENTO
    const installmentMultipliers = {
      '1x': 1.0,
      '3x': 1.15,  // +15% conversão
      '12x': 1.50  // +50% conversão
    };

    const conversionBoost = installmentMultipliers[installments] || 1.0;

    // 🎯 OTIMIZAÇÕES SUGERIDAS
    const optimizations = [];

    // Otimização 1: Parcelamento (se não estiver em 12x)
    if (installments !== '12x') {
      const newConvRate = convRate * 1.5;
      const newSales = Math.floor(clicks * newConvRate);
      const newRevenue = newSales * productPrice;
      const newProfit = newRevenue - investment - (newSales * costPerSale);
      const newROI = ((newProfit / investment) * 100);

      optimizations.push({
        title: '💳 Oferecer 12x no Cartão',
        description: `Parcelamento aumenta conversão em até 50%`,
        impact: `+${newSales - sales} vendas = +R$ ${(newRevenue - revenue).toFixed(2)}`,
        newROI: newROI.toFixed(0)
      });
    }

    // Otimização 2: Reduzir CPC
    const optimizedCPC = cpc * 0.8; // -20%
    const newClicks = investment / optimizedCPC;
    const newSales2 = Math.floor(newClicks * convRate);
    const newRevenue2 = newSales2 * productPrice;
    const newProfit2 = newRevenue2 - investment - (newSales2 * costPerSale);
    const newROI2 = ((newProfit2 / investment) * 100);

    optimizations.push({
      title: '🎯 Otimizar CPC (Reduzir 20%)',
      description: `Melhorar criativos e segmentação para reduzir custo por clique`,
      impact: `CPC de R$ ${optimizedCPC.toFixed(2)} = ${Math.floor(newClicks)} cliques`,
      newROI: newROI2.toFixed(0)
    });

    // Otimização 3: Aumentar preço
    const newPrice = productPrice * 1.15; // +15%
    const newConvRate3 = convRate * 0.95; // -5% conversão
    const newSales3 = Math.floor(clicks * newConvRate3);
    const newRevenue3 = newSales3 * newPrice;
    const newProfit3 = newRevenue3 - investment - (newSales3 * costPerSale);
    const newROI3 = ((newProfit3 / investment) * 100);

    optimizations.push({
      title: '💰 Aumentar Preço (+15%)',
      description: `Preço de R$ ${newPrice.toFixed(2)} com leve queda de conversão`,
      impact: `Menos vendas (${newSales3}) mas maior lucro total`,
      newROI: newROI3.toFixed(0)
    });

    // 🤖 ANÁLISE COM IA
    const prompt = `
Você é um especialista em tráfego pago e ROI de marketing digital.

DADOS DO INVESTIMENTO:
💰 Investimento: R$ ${investment.toLocaleString('pt-BR')}
🖱️ CPC médio: R$ ${cpc.toFixed(2)}
👆 Cliques estimados: ${Math.floor(clicks).toLocaleString('pt-BR')}
📊 Taxa de conversão: ${conversionRate}%
🛒 Vendas esperadas: ${sales}
💵 Preço do produto: R$ ${productPrice.toFixed(2)}
💳 Parcelamento: ${installments}
📦 Custo de produção: R$ ${(costPerSale || 0).toFixed(2)}

RESULTADOS:
💰 Receita: R$ ${revenue.toFixed(2)}
💸 Lucro: R$ ${profit.toFixed(2)}
📈 ROI: ${roi.toFixed(1)}%

Faça uma análise PRÁTICA e OBJETIVA em 3 parágrafos curtos:

1. DIAGNÓSTICO: O ROI está bom ou ruim? É viável investir?
2. PONTOS DE ATENÇÃO: Quais métricas precisam melhorar?
3. PRÓXIMOS PASSOS: 2-3 ações concretas para otimizar

Seja direto, use números e seja honesto sobre a viabilidade.
Use emojis para destacar pontos importantes.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em ROI de tráfego pago. Seja prático e objetivo.'
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

    // 💡 RECOMENDAÇÃO FINAL
    let recommendation = '';
    if (roi > 100) {
      recommendation = `Excelente! Com ROI de ${roi.toFixed(0)}%, este investimento é muito lucrativo. Continue investindo e escale gradualmente.`;
    } else if (roi > 50) {
      recommendation = `Bom resultado! ROI de ${roi.toFixed(0)}% é positivo. Foque nas otimizações sugeridas para aumentar ainda mais o retorno.`;
    } else if (roi > 0) {
      recommendation = `ROI positivo (${roi.toFixed(0)}%), mas pode melhorar. Implemente as otimizações urgentemente para aumentar a margem.`;
    } else {
      recommendation = `⚠️ ATENÇÃO: ROI negativo (${roi.toFixed(0)}%). NÃO invista até otimizar! Revise CPC, conversão e preço antes de escalar.`;
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

    // 💾 Salvar análise no histórico (AGORA COM SCHEMA ATUALIZADO)
    await prisma.analysis.create({
      data: {
        userId: user._id.toString(),
        type: 'traffic-roi', // ✅ Campo agora existe no schema
        category: 'marketing',
        productName: `Investimento de R$ ${investment}`,
        price: productPrice, // ✅ Campo obrigatório
        description: `Análise de ROI - CPC: R$ ${cpc} | Conv: ${conversionRate}% | Vendas: ${sales}`,
        
        // ✅ Novos campos do schema atualizado
        productData: {
          investment,
          cpc,
          conversionRate,
          productPrice,
          installments,
          productionCost,
          results: {
            clicks: Math.floor(clicks),
            sales,
            revenue: parseFloat(revenue.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            roi: parseFloat(roi.toFixed(2))
          }
        },
        suggestedPrice: productPrice,
        priceRangeMin: productPrice * 0.9,
        priceRangeMax: productPrice * 1.15,
        justification: aiAnalysis,
        recommendations: optimizations,
        
        aiResponse: aiAnalysis // ✅ Campo obrigatório
      }
    });

    return res.json({
      investment,
      cpc,
      clicks: Math.floor(clicks),
      conversionRate,
      sales,
      revenue: parseFloat(revenue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      optimizations,
      aiAnalysis,
      recommendation
    });

  } catch (error) {
    console.error('❌ Erro ao calcular ROI:', error);
    return res.status(500).json({
      message: 'Erro ao processar cálculo',
      error: error.message
    });
  }
};