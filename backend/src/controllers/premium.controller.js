const OpenAI = require('openai');
const { prisma } = require('../lib/prisma');
const { canAnalyze } = require('../config/planLimits');
const { incrementRequest } = require('./stats.controller');
const { getIO } = require('../socket');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const cheerio = require('cheerio');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ========================================
// CONFIGURAÇÃO DE UPLOAD
// ========================================

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/premium');
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'));
    }
  }
});

exports.upload = upload;

// ========================================
// 1️⃣ ANÁLISE POR PDF
// ✅ PLANOS PERMITIDOS: STARTER, PRO, BUSINESS
// ========================================

exports.analyzePDF = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { plan: true }
    });

    // ✅ VALIDAÇÃO ATUALIZADA: Aceita starter, pro e business
    const allowedPlans = ['starter', 'pro', 'business'];
    if (!allowedPlans.includes(profile?.plan)) {
      return res.status(403).json({
        message: 'Recurso exclusivo para planos Starter, Pro ou Business. Faça upgrade!',
        upgrade: true,
        requiredPlan: 'starter'
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo PDF não enviado' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log('📄 Analisando PDF:', fileName);

    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    const extractedText = pdfData.text.substring(0, 3000);

    const prompt = `Analise este PDF de produto/serviço e forneça insights detalhados de precificação:

TEXTO EXTRAÍDO:
${extractedText}

Forneça uma análise completa incluindo:
1. Identificação do tipo de produto/serviço
2. Público-alvo identificado
3. Sugestões de faixa de preço
4. Estratégia de posicionamento
5. Pontos fortes e fracos identificados

Use emojis para destacar pontos importantes.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um especialista em análise de documentos e precificação estratégica.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

    const analysis = response.choices[0].message.content;

    await prisma.premiumAnalysis.create({
      data: {
        userId,
        type: 'pdf',
        fileName,
        fileUrl: `/uploads/premium/${req.file.filename}`,
        extractedText,
        aiResponse: analysis,
        metadata: { pages: pdfData.numpages }
      }
    });

    // CRIAR NOTIFICAÇÃO
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: "success",
          title: "✅ Análise PDF Concluída!",
          message: `Análise de "${fileName}" processada com sucesso.`,
          link: `/history`,
        },
      });

      const io = req.app?.get?.("io") || getIO();
      if (io) {
        io.to(`user_${userId}`).emit("new_notification", {
          type: "success",
          title: "✅ Análise PDF Concluída!",
          message: `Análise de "${fileName}" processada com sucesso.`,
        });
      }

      console.log(`🔔 Notificação: Análise PDF concluída para ${userId}`);
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificação:', notifError);
    }

    return res.json({
      analysis,
      metadata: {
        fileName,
        pages: pdfData.numpages
      }
    });

  } catch (error) {
    console.error('❌ Erro em analyzePDF:', error);
    return res.status(500).json({ 
      message: 'Erro ao analisar PDF',
      error: error.message 
    });
  }
};

// ========================================
// 2️⃣ ANÁLISE POR LINK
// ❌ PLANOS PERMITIDOS: PRO, BUSINESS (Starter NÃO)
// ========================================

exports.analyzeLink = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { plan: true }
    });

    // ❌ VALIDAÇÃO: Apenas Pro e Business
    const allowedPlans = ['pro', 'business'];
    if (!allowedPlans.includes(profile?.plan)) {
      return res.status(403).json({
        message: 'Recurso exclusivo para planos Pro ou Business. Faça upgrade!',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL é obrigatória' });
    }

    console.log('🔗 Analisando link:', url);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Sem título';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';

    const bodyText = $('body').text().substring(0, 2000);
    
    const priceRegex = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;
    const prices = bodyText.match(priceRegex) || [];

    const prompt = `Analise esta página de vendas:

TÍTULO: ${title}
DESCRIÇÃO: ${description}
PREÇOS ENCONTRADOS: ${prices.length > 0 ? prices.join(', ') : 'Não encontrado'}

CONTEÚDO (trecho):
${bodyText.substring(0, 1000)}

Forneça uma análise de precificação incluindo:
1. Tipo de produto/serviço identificado
2. Análise do preço encontrado (se houver)
3. Posicionamento de mercado
4. Sugestões de otimização de preço
5. Análise da página de vendas

Use emojis para destacar pontos.`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um especialista em análise de páginas de vendas e precificação.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

    const analysis = aiResponse.choices[0].message.content;

    await prisma.premiumAnalysis.create({
      data: {
        userId,
        type: 'link',
        link: url,
        extractedText: `${title} - ${description}`,
        aiResponse: analysis,
        metadata: { 
          title, 
          description,
          prices: prices.slice(0, 5)
        }
      }
    });

    // CRIAR NOTIFICAÇÃO
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: "success",
          title: "✅ Análise de Link Concluída!",
          message: `Análise de "${title}" processada com sucesso.`,
          link: `/history`,
        },
      });

      const io = req.app?.get?.("io") || getIO();
      if (io) {
        io.to(`user_${userId}`).emit("new_notification", {
          type: "success",
          title: "✅ Análise de Link Concluída!",
          message: `Análise de "${title}" processada com sucesso.`,
        });
      }

      console.log(`🔔 Notificação: Análise Link concluída para ${userId}`);
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificação:', notifError);
    }

    return res.json({
      analysis,
      extractedData: {
        title,
        description,
        prices: prices.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('❌ Erro em analyzeLink:', error);
    return res.status(500).json({ 
      message: 'Erro ao analisar link',
      error: error.message 
    });
  }
};

// ========================================
// 3️⃣ ANÁLISE POR IMAGEM
// ❌ PLANOS PERMITIDOS: PRO, BUSINESS (Starter NÃO)
// ========================================

exports.analyzeImage = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { plan: true }
    });

    // ❌ VALIDAÇÃO: Apenas Pro e Business
    const allowedPlans = ['pro', 'business'];
    if (!allowedPlans.includes(profile?.plan)) {
      return res.status(403).json({
        message: 'Recurso exclusivo para planos Pro ou Business. Faça upgrade!',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Imagem não enviada' });
    }

    const imagePath = req.file.path;
    const fileName = req.file.originalname;

    console.log('🖼️ Analisando imagem:', fileName);

    const { data: { text } } = await Tesseract.recognize(imagePath, 'por', {
      logger: m => console.log(m)
    });

    const extractedText = text.substring(0, 2000);

    const prompt = `Analise esta imagem/screenshot de produto:

TEXTO EXTRAÍDO (OCR):
${extractedText}

Forneça análise de precificação incluindo:
1. O que foi identificado na imagem
2. Preços ou valores encontrados
3. Sugestões de precificação
4. Análise de apresentação visual
5. Recomendações de melhoria

Use emojis para destacar pontos.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um especialista em análise de imagens e precificação visual.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

    const analysis = response.choices[0].message.content;

    await prisma.premiumAnalysis.create({
      data: {
        userId,
        type: 'image',
        fileName,
        fileUrl: `/uploads/premium/${req.file.filename}`,
        extractedText,
        aiResponse: analysis
      }
    });

    // CRIAR NOTIFICAÇÃO
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: "success",
          title: "✅ Análise de Imagem Concluída!",
          message: `Análise de "${fileName}" processada com sucesso.`,
          link: `/history`,
        },
      });

      const io = req.app?.get?.("io") || getIO();
      if (io) {
        io.to(`user_${userId}`).emit("new_notification", {
          type: "success",
          title: "✅ Análise de Imagem Concluída!",
          message: `Análise de "${fileName}" processada com sucesso.`,
        });
      }

      console.log(`🔔 Notificação: Análise Imagem concluída para ${userId}`);
    } catch (notifError) {
      console.error('⚠️ Erro ao criar notificação:', notifError);
    }

    return res.json({
      analysis,
      extractedText,
      imageUrl: `/uploads/premium/${req.file.filename}`
    });

  } catch (error) {
    console.error('❌ Erro em analyzeImage:', error);
    return res.status(500).json({ 
      message: 'Erro ao analisar imagem',
      error: error.message 
    });
  }
};

// ========================================
// 4️⃣ CALCULADORA DE LUCRO
// ✅ PLANOS PERMITIDOS: STARTER, PRO, BUSINESS
// ========================================

exports.calculateProfit = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { plan: true }
    });

    // ✅ VALIDAÇÃO ATUALIZADA: Aceita starter, pro e business
    const allowedPlans = ['starter', 'pro', 'business'];
    if (!allowedPlans.includes(profile?.plan)) {
      return res.status(403).json({
        message: 'Recurso exclusivo para planos Starter, Pro ou Business. Faça upgrade!',
        upgrade: true,
        requiredPlan: 'starter'
      });
    }

    const {
      productName,
      sellingPrice,
      productionCost,
      platformFee = 0,
      taxes = 0,
      otherCosts = 0
    } = req.body;

    if (!productName || !sellingPrice || !productionCost) {
      return res.status(400).json({ 
        message: 'Preencha nome, preço de venda e custo de produção' 
      });
    }

    const totalCost = parseFloat(productionCost) + parseFloat(platformFee) + parseFloat(taxes) + parseFloat(otherCosts);
    const profitAmount = parseFloat(sellingPrice) - totalCost;
    const profitMargin = (profitAmount / parseFloat(sellingPrice)) * 100;
    const netProfit = profitAmount;

    const prompt = `Analise esta estrutura de custos e lucros:

PRODUTO: ${productName}
PREÇO DE VENDA: R$ ${sellingPrice}
CUSTO DE PRODUÇÃO: R$ ${productionCost}
TAXA DE PLATAFORMA: R$ ${platformFee}
IMPOSTOS: R$ ${taxes}
OUTROS CUSTOS: R$ ${otherCosts}

CUSTO TOTAL: R$ ${totalCost.toFixed(2)}
LUCRO LÍQUIDO: R$ ${netProfit.toFixed(2)}
MARGEM DE LUCRO: ${profitMargin.toFixed(1)}%

Forneça sugestões de otimização incluindo:
1. Análise da margem atual (está saudável?)
2. Oportunidades de redução de custos
3. Possibilidades de aumento de preço
4. Estratégias de maximização de lucro
5. Alertas importantes

Use emojis para destacar pontos.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um especialista em otimização de lucros e análise financeira.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const aiSuggestion = response.choices[0].message.content;

    await prisma.profitCalculation.create({
      data: {
        userId,
        productName,
        sellingPrice: parseFloat(sellingPrice),
        productionCost: parseFloat(productionCost),
        platformFee: parseFloat(platformFee),
        taxes: parseFloat(taxes),
        otherCosts: parseFloat(otherCosts),
        totalCost,
        profitAmount,
        profitMargin,
        netProfit,
        aiSuggestion
      }
    });

    return res.json({
      sellingPrice: parseFloat(sellingPrice),
      productionCost: parseFloat(productionCost),
      platformFee: parseFloat(platformFee),
      taxes: parseFloat(taxes),
      otherCosts: parseFloat(otherCosts),
      totalCost,
      profitAmount,
      profitMargin,
      netProfit,
      aiSuggestion
    });

  } catch (error) {
    console.error('❌ Erro em calculateProfit:', error);
    return res.status(500).json({ 
      message: 'Erro ao calcular lucro',
      error: error.message 
    });
  }
};

// ========================================
// 🆕 5️⃣ COMPARADOR DE PREÇOS (BUSINESS)
// ========================================

exports.comparePrice = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const plan = req.user.plan;

    if (plan !== 'business') {
      return res.status(403).json({
        message: 'Ferramenta exclusiva para plano Business',
        upgrade: 'business'
      });
    }

    const { myProduct, competitors } = req.body;

    if (!myProduct || !competitors || competitors.length === 0) {
      return res.status(400).json({
        message: 'Envie seu produto e pelo menos 1 concorrente'
      });
    }

    let prompt = `Você é um especialista em análise competitiva de preços.\n\n`;
    prompt += `PRODUTO DO CLIENTE:\n`;
    prompt += `Nome: ${myProduct.name}\n`;
    prompt += `Preço: R$ ${myProduct.price}\n`;
    prompt += `Features: ${myProduct.features || 'Não informado'}\n\n`;
    
    prompt += `CONCORRENTES:\n`;
    competitors.forEach((comp, idx) => {
      prompt += `${idx + 1}. ${comp.name} - R$ ${comp.price}\n`;
      if (comp.features) prompt += `   Features: ${comp.features}\n`;
    });

    prompt += `\n---\n\n`;
    prompt += `Faça uma análise estratégica completa:\n`;
    prompt += `1. Posicionamento de preço (premium/médio/econômico)\n`;
    prompt += `2. Principais diferenças vs concorrentes\n`;
    prompt += `3. Vantagens e desvantagens do preço atual\n`;
    prompt += `4. Oportunidades de ajuste\n`;
    prompt += `5. Recomendação final clara\n\n`;
    prompt += `Seja específico e prático. Use emojis para destacar pontos importantes.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um especialista em análise competitiva e precificação estratégica.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const analysis = response.choices[0].message.content;

    await prisma.priceComparison.create({
      data: {
        userId,
        comparisonName: `${myProduct.name} vs ${competitors.length} concorrentes`,
        myProduct: myProduct,
        competitors: competitors,
        aiAnalysis: analysis,
        recommendation: analysis
      }
    });

    return res.json({
      analysis,
      recommendation: analysis,
      myProduct,
      competitors
    });

  } catch (error) {
    console.error('❌ Erro em comparePrice:', error);
    return res.status(500).json({
      message: 'Erro ao comparar preços',
      error: error.message
    });
  }
};

// ========================================
// 🆕 6️⃣ SIMULADOR DE CENÁRIOS (BUSINESS)
// ========================================

exports.simulateScenarios = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const plan = req.user.plan;

    if (plan !== 'business') {
      return res.status(403).json({
        message: 'Ferramenta exclusiva para plano Business',
        upgrade: 'business'
      });
    }

    const { productName, basePrice, productionCost, targetMargin } = req.body;

    if (!productName || !basePrice) {
      return res.status(400).json({
        message: 'Envie nome do produto e preço base'
      });
    }

    const scenarios = {
      conservative: {
        price: parseFloat(basePrice) * 0.9,
        estimatedSales: 100,
        revenue: 0,
        profit: 0
      },
      realistic: {
        price: parseFloat(basePrice),
        estimatedSales: 80,
        revenue: 0,
        profit: 0
      },
      optimistic: {
        price: parseFloat(basePrice) * 1.15,
        estimatedSales: 50,
        revenue: 0,
        profit: 0
      }
    };

    Object.keys(scenarios).forEach(key => {
      const s = scenarios[key];
      s.revenue = s.price * s.estimatedSales;
      if (productionCost) {
        s.profit = (s.price - parseFloat(productionCost)) * s.estimatedSales;
      }
    });

    let prompt = `Você é um analista de precificação.\n\n`;
    prompt += `PRODUTO: ${productName}\n`;
    prompt += `PREÇO BASE: R$ ${basePrice}\n`;
    if (productionCost) prompt += `CUSTO: R$ ${productionCost}\n`;
    if (targetMargin) prompt += `MARGEM DESEJADA: ${targetMargin}%\n`;
    
    prompt += `\n3 CENÁRIOS CALCULADOS:\n\n`;
    
    prompt += `CONSERVADOR:\n`;
    prompt += `- Preço: R$ ${scenarios.conservative.price.toFixed(2)} (-10%)\n`;
    prompt += `- Vendas estimadas: ${scenarios.conservative.estimatedSales}/mês\n`;
    prompt += `- Receita: R$ ${scenarios.conservative.revenue.toFixed(2)}\n`;
    if (productionCost) prompt += `- Lucro: R$ ${scenarios.conservative.profit.toFixed(2)}\n`;
    
    prompt += `\nREALISTA:\n`;
    prompt += `- Preço: R$ ${scenarios.realistic.price.toFixed(2)}\n`;
    prompt += `- Vendas estimadas: ${scenarios.realistic.estimatedSales}/mês\n`;
    prompt += `- Receita: R$ ${scenarios.realistic.revenue.toFixed(2)}\n`;
    if (productionCost) prompt += `- Lucro: R$ ${scenarios.realistic.profit.toFixed(2)}\n`;
    
    prompt += `\nOTIMISTA:\n`;
    prompt += `- Preço: R$ ${scenarios.optimistic.price.toFixed(2)} (+15%)\n`;
    prompt += `- Vendas estimadas: ${scenarios.optimistic.estimatedSales}/mês\n`;
    prompt += `- Receita: R$ ${scenarios.optimistic.revenue.toFixed(2)}\n`;
    if (productionCost) prompt += `- Lucro: R$ ${scenarios.optimistic.profit.toFixed(2)}\n`;

    prompt += `\n---\n\nAnalise os cenários e recomende:\n`;
    prompt += `1. Qual cenário é mais viável?\n`;
    prompt += `2. Riscos e oportunidades de cada um\n`;
    prompt += `3. Estratégia de teste recomendada\n`;
    prompt += `4. Próximos passos práticos\n`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um especialista em simulação de cenários de precificação.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

    const analysis = response.choices[0].message.content;

    await prisma.priceSimulation.create({
      data: {
        userId,
        productName,
        basePrice: parseFloat(basePrice),
        scenarios,
        aiAnalysis: analysis
      }
    });

    return res.json({
      scenarios,
      analysis
    });

  } catch (error) {
    console.error('❌ Erro em simulateScenarios:', error);
    return res.status(500).json({
      message: 'Erro ao simular cenários',
      error: error.message
    });
  }
};

// ========================================
// 🆕 7️⃣ ASSISTENTE IA CHAT (BUSINESS)
// ========================================

exports.chatAssistant = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const plan = req.user.plan;

    if (plan !== 'business') {
      return res.status(403).json({
        message: 'Ferramenta exclusiva para plano Business',
        upgrade: 'business'
      });
    }

    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({
        message: 'Envie uma mensagem'
      });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId }
      });
    }

    const messages = conversation?.messages || [];
    
    const systemPrompt = `Você é um assistente especializado em precificação de produtos digitais e infoprodutos.
    
Você ajuda empreendedores a:
- Definir preços estratégicos
- Analisar concorrência
- Calcular margens e lucros
- Posicionar produtos no mercado
- Criar estratégias de pricing

Seja prático, objetivo e dê exemplos quando possível.
Use emojis para deixar a conversa mais amigável.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 800
    });

    const aiReply = response.choices[0].message.content;

    const newMessages = [
      ...messages,
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: aiReply, timestamp: new Date() }
    ];

    if (conversation) {
      conversation = await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { messages: newMessages, updatedAt: new Date() }
      });
    } else {
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + '...',
          messages: newMessages
        }
      });
    }

    return res.json({
      reply: aiReply,
      conversationId: conversation.id
    });

  } catch (error) {
    console.error('❌ Erro em chatAssistant:', error);
    return res.status(500).json({
      message: 'Erro no assistente',
      error: error.message
    });
  }
};

// ========================================
// 🆕 8️⃣ HISTÓRICO DE CHAT
// ========================================

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    const conversations = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    return res.json({ conversations });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return res.status(500).json({
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
};