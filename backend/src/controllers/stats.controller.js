const { prisma } = require('../lib/prisma');
const { getMonthlyLimit } = require('../config/planLimits');

/**
 * GET /stats
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    let stats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!stats) {
      stats = await prisma.userStats.create({
        data: {
          userId,
          lastAccessAt: new Date(),
          lastResetAt: new Date()
        }
      });
    }

    // 🔥 Resetar contador se mudou o mês
    stats = await resetMonthlyCounterIfNeeded(userId, stats);

    return res.json(stats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar stats' });
  }
};

/**
 * 🔥 GET /stats/usage - Uso atual vs limite
 */
exports.getUsage = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    let stats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!stats) {
      stats = await prisma.userStats.create({
        data: {
          userId,
          lastAccessAt: new Date(),
          lastResetAt: new Date()
        }
      });
    }

    stats = await resetMonthlyCounterIfNeeded(userId, stats);

    // 🔥 PEGAR PLANO DO MONGODB (req.user)
    const plan = req.user.plan || 'free';
    const limit = getMonthlyLimit(plan);

    return res.json({
      used: stats.monthlyRequests,
      limit: limit === -1 ? 'unlimited' : limit,
      remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - stats.monthlyRequests),
      plan
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar usage' });
  }
};

/**
 * GET /stats/dashboard - Dados para gráficos
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const totalAnalyses = await prisma.analysis.count({
      where: { userId }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnalyses = await prisma.analysis.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        price: true,
        category: true,
        isValid: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const analysesByDay = recentAnalyses.reduce((acc, analysis) => {
      const day = analysis.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const timelineData = Object.entries(analysesByDay).map(([date, count]) => ({
      date,
      count
    }));

    const categoriesCount = recentAnalyses.reduce((acc, analysis) => {
      const cat = analysis.category || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const categoriesData = Object.entries(categoriesCount).map(([name, value]) => ({
      name,
      value
    }));

    const priceRanges = {
      '0-50': 0,
      '50-100': 0,
      '100-500': 0,
      '500+': 0
    };

    recentAnalyses.forEach((a) => {
      if (a.price < 50) priceRanges['0-50']++;
      else if (a.price < 100) priceRanges['50-100']++;
      else if (a.price < 500) priceRanges['100-500']++;
      else priceRanges['500+']++;
    });

    const priceDistribution = Object.entries(priceRanges).map(([range, count]) => ({
      range,
      count
    }));

    const avgPrice = recentAnalyses.length > 0
      ? recentAnalyses.reduce((sum, a) => sum + a.price, 0) / recentAnalyses.length
      : 0;

    const validCount = recentAnalyses.filter(a => a.isValid === true).length;
    const approvalRate = recentAnalyses.length > 0
      ? (validCount / recentAnalyses.length) * 100
      : 0;

    return res.json({
      totalAnalyses,
      avgPrice: avgPrice.toFixed(2),
      approvalRate: approvalRate.toFixed(1),
      timelineData,
      categoriesData,
      priceDistribution
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar dashboard stats' });
  }
};

/**
 * 🔥 GET /stats/history - Histórico de análises (COM BUSCA E FILTROS)
 */
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { 
      page = 1, 
      limit = 10,
      search = '',
      category = '',
      minPrice = '',
      maxPrice = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔍 CONSTRUIR FILTROS
    const where = {
      userId,
      ...(search && {
        productName: {
          contains: search,
          mode: 'insensitive'
        }
      }),
      ...(category && { category }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { 
        price: { 
          ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
          lte: parseFloat(maxPrice) 
        } 
      })
    };

    // 📊 ORDENAÇÃO
    const orderBy = {
      [sortBy]: sortOrder
    };

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          productName: true,
          price: true,
          category: true,
          description: true,
          aiResponse: true,
          isValid: true,
          createdAt: true
        }
      }),
      prisma.analysis.count({ where })
    ]);

    return res.json({
      analyses,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + analyses.length < total
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
};

/**
 * 🔥 GET /stats/analysis/:id - Buscar análise específica
 */
exports.getAnalysisById = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    const analysis = await prisma.analysis.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }

    return res.json(analysis);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar análise' });
  }
};

/**
 * 🔥 DELETE /stats/analysis/:id - Deletar análise
 */
exports.deleteAnalysis = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    const analysis = await prisma.analysis.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }

    await prisma.analysis.delete({
      where: { id }
    });

    return res.json({ 
      message: 'Análise deletada com sucesso',
      id 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar análise' });
  }
};

/**
 * 🔥 Incrementa contador mensal
 * 🔥 CORRIGIDO: NÃO INCREMENTA PARA BUSINESS
 */
exports.incrementRequest = async (userId, plan) => {
  let stats = await prisma.userStats.findUnique({
    where: { userId }
  });

  if (stats) {
    stats = await resetMonthlyCounterIfNeeded(userId, stats);
  }

  // 🔥 NÃO INCREMENTAR PARA BUSINESS (ilimitado)
  const shouldCount = plan !== 'business';

  await prisma.userStats.upsert({
    where: { userId },
    update: {
      totalRequests: { increment: 1 },
      monthlyRequests: shouldCount ? { increment: 1 } : undefined,  // 🔥 CONDICIONAL
      lastAccessAt: new Date()
    },
    create: {
      userId,
      totalRequests: 1,
      monthlyRequests: shouldCount ? 1 : 0,  // 🔥 CONDICIONAL
      lastAccessAt: new Date(),
      lastResetAt: new Date()
    }
  });
};

/**
 * Salvar análise
 */
exports.saveAnalysis = async (userId, data) => {
  await prisma.analysis.create({
    data: {
      userId,
      productName: data.productName,
      price: parseFloat(data.price),
      category: data.category || null,
      description: data.description || null,
      aiResponse: data.aiResponse,
      isValid: data.isValid || null
    }
  });
};

/**
 * 🔥 HELPER: Reset contador mensal se mudou o mês
 */
async function resetMonthlyCounterIfNeeded(userId, stats) {
  const now = new Date();
  const lastReset = new Date(stats.lastResetAt);

  const needsReset = 
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (needsReset) {
    return await prisma.userStats.update({
      where: { userId },
      data: {
        monthlyRequests: 0,
        lastResetAt: now
      }
    });
  }

  return stats;
}