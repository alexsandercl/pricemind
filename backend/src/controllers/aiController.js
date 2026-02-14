const OpenAI = require('openai');
const User = require('../models/User');
const { prisma } = require('../lib/prisma');
const { incrementRequest, saveAnalysis } = require('./stats.controller');
const { canAnalyze, getMonthlyLimit } = require('../config/planLimits');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 🎲 VARIAÇÕES DE PROMPTS
 */
const PROMPT_VARIATIONS = [
  {
    style: 'consultoria',
    intro: 'Você é um consultor especialista em precificação estratégica.',
    focus: 'Analise de forma consultiva e estratégica'
  },
  {
    style: 'analista',
    intro: 'Você é um analista de mercado com foco em pricing.',
    focus: 'Faça uma análise detalhada baseada em dados de mercado'
  },
  {
    style: 'mentor',
    intro: 'Você é um mentor de negócios focado em estratégias de preço.',
    focus: 'Forneça insights práticos e acionáveis'
  },
  {
    style: 'estrategista',
    intro: 'Você é um estrategista de precificação com expertise em posicionamento.',
    focus: 'Analise o posicionamento estratégico do preço'
  }
];

function getRandomPromptStyle() {
  return PROMPT_VARIATIONS[Math.floor(Math.random() * PROMPT_VARIATIONS.length)];
}

function generateSmartPrompt(data) {
  const style = getRandomPromptStyle();
  
  const {
    productName,
    price,
    category,
    description,
    targetAudience,
    competitors,
    competitorsPricing,
    productionCost,
    desiredMargin,
    differentials,
    goal
  } = data;

  let context = `${style.intro}\n\n`;
  context += `${style.focus}:\n\n`;
  
  context += `📦 PRODUTO: ${productName}\n`;
  context += `💰 PREÇO ATUAL: R$ ${price}\n`;
  context += `🏷️ CATEGORIA: ${category}\n\n`;
  
  if (description) {
    context += `📝 DESCRIÇÃO:\n${description}\n\n`;
  }
  
  if (targetAudience) {
    context += `👥 PÚBLICO-ALVO: ${targetAudience}\n\n`;
  }
  
  if (competitors) {
    context += `🎯 PRINCIPAIS CONCORRENTES: ${competitors}\n`;
    if (competitorsPricing) {
      context += `💵 PREÇOS DOS CONCORRENTES: ${competitorsPricing}\n`;
    }
    context += `\n`;
  }
  
  if (productionCost) {
    context += `🏭 CUSTO DE PRODUÇÃO: R$ ${productionCost}\n`;
    const currentMargin = ((parseFloat(price) - parseFloat(productionCost)) / parseFloat(price) * 100).toFixed(1);
    context += `📊 MARGEM ATUAL: ${currentMargin}%\n`;
  }
  
  if (desiredMargin) {
    context += `🎯 MARGEM DESEJADA: ${desiredMargin}%\n`;
  }
  
  if (productionCost || desiredMargin) {
    context += `\n`;
  }
  
  if (differentials) {
    context += `⭐ DIFERENCIAIS:\n${differentials}\n\n`;
  }
  
  if (goal) {
    context += `🎯 OBJETIVO PRINCIPAL: ${goal}\n\n`;
  }
  
  context += `---\n\n`;
  
  if (style.style === 'consultoria') {
    context += `Forneça uma análise consultiva estruturada com:\n`;
    context += `1. ✅ PONTOS FORTES do preço atual\n`;
    context += `2. ⚠️ PONTOS DE ATENÇÃO e riscos\n`;
    context += `3. 💡 RECOMENDAÇÕES estratégicas\n`;
    context += `4. 📈 CENÁRIOS de precificação (otimista, realista, conservador)\n`;
    context += `5. 🎯 PRÓXIMOS PASSOS acionáveis\n`;
  } else if (style.style === 'analista') {
    context += `Faça uma análise de mercado completa incluindo:\n`;
    context += `1. 📊 ANÁLISE COMPETITIVA do preço\n`;
    context += `2. 💰 POSICIONAMENTO no mercado (premium/médio/econômico)\n`;
    context += `3. 📈 ELASTICIDADE estimada de demanda\n`;
    context += `4. ⚖️ VIABILIDADE financeira\n`;
    context += `5. 🔮 TENDÊNCIAS de mercado relevantes\n`;
  } else if (style.style === 'mentor') {
    context += `Forneça orientação prática incluindo:\n`;
    context += `1. 🎯 VALIDAÇÃO do preço (está adequado?)\n`;
    context += `2. 💡 INSIGHTS sobre percepção de valor\n`;
    context += `3. 🛠️ TÁTICAS para otimização\n`;
    context += `4. ⚠️ ERROS comuns a evitar\n`;
    context += `5. 🚀 OPORTUNIDADES de crescimento\n`;
  } else {
    context += `Analise o posicionamento estratégico:\n`;
    context += `1. 🎯 ESTRATÉGIA de pricing atual\n`;
    context += `2. 🏆 VANTAGEM COMPETITIVA pelo preço\n`;
    context += `3. 💎 PERCEPÇÃO DE VALOR esperada\n`;
    context += `4. 🔄 AJUSTES estratégicos sugeridos\n`;
    context += `5. 📊 MÉTRICAS para acompanhar\n`;
  }
  
  context += `\nSeja específico, prático e baseie suas recomendações nos dados fornecidos.`;
  context += `\nUse emojis para destacar pontos importantes.`;
  context += `\nMantenha um tom profissional mas acessível.`;
  
  return context;
}

/**
 * 🚀 ANALISAR PREÇO (ROTA PRINCIPAL)
 * 🔥 CORRIGIDO: Ordem correta de declarações
 */
exports.analyzePrice = async (req, res) => {
  try {
    const {
      productName,
      price,
      category,
      description,
      targetAudience,
      competitors,
      competitorsPricing,
      productionCost,
      desiredMargin,
      differentials,
      goal
    } = req.body;

    if (!productName || !price || !category) {
      return res.status(400).json({ 
        message: 'Nome do produto, preço e categoria são obrigatórios' 
      });
    }

    const user = req.user;

    // 🔥 PEGAR PLANO DO MONGODB (req.user.plan)
    const plan = user.plan || 'free';

    // 🔥 BUSCAR STATS PRIMEIRO (ANTES DE USAR monthlyRequests)
    const stats = await prisma.userStats.findUnique({
      where: { userId: user._id.toString() }
    });

    const monthlyRequests = stats?.monthlyRequests || 0;

    // 🐛 DEBUG COMPLETO (AGORA TODAS AS VARIÁVEIS EXISTEM)
    console.log('🔍 === DEBUG ANÁLISE BUSINESS ===');
    console.log('User completo:', user);
    console.log('Plan extraído:', plan);
    console.log('Plan type:', typeof plan);
    console.log('Monthly requests:', monthlyRequests);
    console.log('Can analyze?:', canAnalyze(plan, monthlyRequests));
    console.log('Monthly limit:', getMonthlyLimit(plan));
    console.log('================================');

    // 🔥 VERIFICAR LIMITE (business = ilimitado)
    if (!canAnalyze(plan, monthlyRequests)) {
      const limit = getMonthlyLimit(plan);
      return res.status(403).json({
        message: 'Limite mensal atingido',
        limit,
        used: monthlyRequests,
        upgrade: true
      });
    }

    // 📊 Incrementa estatísticas (🔥 PASSA O PLANO)
    await incrementRequest(user._id.toString(), plan);

    // 🧠 GERAR PROMPT INTELIGENTE
    const prompt = generateSmartPrompt({
      productName,
      price,
      category,
      description,
      targetAudience,
      competitors,
      competitorsPricing,
      productionCost,
      desiredMargin,
      differentials,
      goal
    });

    console.log('🧠 Prompt gerado:', prompt.substring(0, 200) + '...');

    // 🤖 CHAMAR OPENAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um especialista em precificação estratégica. Forneça análises detalhadas, práticas e personalizadas.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });

    const aiResponse = response.choices[0].message.content;

    // 🔥 SALVAR ANÁLISE NO HISTÓRICO
    await saveAnalysis(user._id.toString(), {
      productName,
      price: parseFloat(price),
      category,
      description: description || null,
      aiResponse: aiResponse,
      isValid: null
    });

    return res.json({
      analysis: aiResponse,
      remainingCredits: null, // Sistema de créditos removido
      analysisId: Date.now()
    });

  } catch (error) {
    console.error('❌ Erro AI:', error);
    return res.status(500).json({ 
      message: 'Erro ao processar IA',
      error: error.message 
    });
  }
};