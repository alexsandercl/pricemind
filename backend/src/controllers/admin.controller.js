const { prisma } = require('../lib/prisma');
const User = require('../models/User');

async function logAdminAction(adminId, action, targetId = null, details = null) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        targetId,
        action,
        details: details || {}
      }
    });
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
}

async function getUserRole(userId) {
  const user = await User.findById(userId);
  return user?.role || 'user';
}

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const usersByPlanMongo = await User.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } }
    ]);

    const usersByPlan = usersByPlanMongo.map(item => ({
      plan: item._id || 'free',
      _count: item.count
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const analysesToday = await prisma.analysis.count({
      where: { createdAt: { gte: today } }
    });

    const totalAnalyses = await prisma.analysis.count();

    const premiumAnalysesToday = await prisma.premiumAnalysis.count({
      where: { createdAt: { gte: today } }
    });

    const usersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalCEOs = await User.countDocuments({ role: 'ceo' });

    return res.json({
      totalUsers,
      usersByPlan,
      analysesToday,
      totalAnalyses,
      premiumAnalysesToday,
      usersToday,
      recentUsers,
      totalAdmins,
      totalCEOs
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      search = '',
      plan = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const mongoFilters = {};
    if (search) {
      mongoFilters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (plan) {
      mongoFilters.plan = plan;
    }

    const users = await User.find(mongoFilters)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('name email plan role isAdmin createdAt');

    const total = await User.countDocuments(mongoFilters);

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const stats = await prisma.userStats.findUnique({
          where: { userId: user._id.toString() },
          select: { totalRequests: true, monthlyRequests: true }
        });

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan || 'free',
          role: user.role || 'user',
          isAdmin: user.isAdmin || false,
          totalRequests: stats?.totalRequests || 0,
          monthlyRequests: stats?.monthlyRequests || 0,
          createdAt: user.createdAt
        };
      })
    );

    return res.json({
      users: usersWithProfiles,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const [profile, stats, analyses, premiumAnalyses] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: id } }),
      prisma.userStats.findUnique({ where: { userId: id } }),
      prisma.analysis.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.premiumAnalysis.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt
      },
      profile,
      stats,
      recentAnalyses: analyses,
      recentPremiumAnalyses: premiumAnalyses
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    return res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
  }
};

exports.updateUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    const adminId = req.user._id.toString();

    const validPlans = ['free', 'starter', 'pro', 'business'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ 
        error: 'Plano inválido. Use: free, starter, pro ou business' 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.role === 'ceo') {
      const adminRole = await getUserRole(adminId);
      if (adminRole !== 'ceo') {
        return res.status(403).json({
          error: 'Você não pode alterar o plano de um CEO'
        });
      }
    }

    const oldPlan = user.plan;

    user.plan = plan;
    await user.save();

    await prisma.userProfile.upsert({
      where: { userId: id },
      update: { plan },
      create: { userId: id, plan }
    });

    await logAdminAction(adminId, 'change_plan', id, {
      email: user.email,
      oldPlan,
      newPlan: plan
    });

    console.log(`✅ Admin alterou plano de ${user.email}: ${oldPlan} → ${plan}`);

    return res.json({
      success: true,
      message: `Plano alterado para ${plan} com sucesso`,
      user: {
        id,
        email: user.email,
        plan
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
};

exports.toggleAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    const requesterId = req.user._id.toString();

    const requesterRole = await getUserRole(requesterId);
    
    if (requesterRole !== 'ceo') {
      return res.status(403).json({
        error: 'Apenas o CEO pode promover ou remover administradores'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (requesterId === id && !isAdmin) {
      return res.status(400).json({ 
        error: 'Você não pode remover sua própria permissão de CEO' 
      });
    }

    if (user.role === 'ceo' && requesterId !== id) {
      return res.status(403).json({
        error: 'Você não pode alterar as permissões de outro CEO'
      });
    }

    const oldRole = user.role;
    const oldIsAdmin = user.isAdmin;

    user.isAdmin = isAdmin;
    user.role = isAdmin ? 'admin' : 'user';
    await user.save();

    await prisma.userProfile.upsert({
      where: { userId: id },
      update: { 
        isAdmin,
        role: user.role
      },
      create: { 
        userId: id, 
        isAdmin,
        role: user.role
      }
    });

    await logAdminAction(requesterId, 'toggle_admin', id, {
      email: user.email,
      oldRole,
      newRole: user.role,
      oldIsAdmin,
      newIsAdmin: isAdmin
    });

    console.log(`✅ CEO ${isAdmin ? 'promoveu' : 'removeu'} admin: ${user.email} (${oldRole} → ${user.role})`);

    return res.json({
      success: true,
      message: isAdmin 
        ? 'Usuário promovido a administrador' 
        : 'Permissão de administrador removida',
      user: {
        id,
        email: user.email,
        role: user.role,
        isAdmin
      }
    });
  } catch (error) {
    console.error('Erro ao alterar admin:', error);
    return res.status(500).json({ error: 'Erro ao atualizar permissão' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user._id.toString();

    if (requesterId === id) {
      return res.status(400).json({ 
        error: 'Você não pode deletar sua própria conta' 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const requesterRole = await getUserRole(requesterId);

    if (requesterRole === 'admin') {
      if (user.role === 'admin' || user.role === 'ceo') {
        return res.status(403).json({
          error: 'Você não tem permissão para deletar este usuário'
        });
      }
    }

    if (user.role === 'ceo' && requesterRole !== 'ceo') {
      return res.status(403).json({
        error: 'Você não pode deletar um CEO'
      });
    }

    await Promise.all([
      prisma.userProfile.deleteMany({ where: { userId: id } }),
      prisma.userStats.deleteMany({ where: { userId: id } }),
      prisma.userPreferences.deleteMany({ where: { userId: id } }),
      prisma.analysis.deleteMany({ where: { userId: id } }),
      prisma.premiumAnalysis.deleteMany({ where: { userId: id } }),
      prisma.profitCalculation.deleteMany({ where: { userId: id } })
    ]);

    await User.findByIdAndDelete(id);

    await logAdminAction(requesterId, 'delete_user', id, {
      email: user.email,
      role: user.role
    });

    console.log(`✅ ${requesterRole.toUpperCase()} deletou usuário ${user.email}`);

    return res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};

exports.getDetailedStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analysesByDay = await prisma.analysis.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true
    });

    const analysesByCategory = await prisma.analysis.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    const premiumToolsUsage = await prisma.premiumAnalysis.groupBy({
      by: ['type'],
      _count: true
    });

    return res.json({
      analysesByDay,
      analysesByCategory,
      premiumToolsUsage
    });
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.adminLog.count();

    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const admin = await User.findById(log.adminId).select('name email');
        let target = null;
        
        if (log.targetId) {
          target = await User.findById(log.targetId).select('name email');
        }

        return {
          ...log,
          adminName: admin?.name || 'Desconhecido',
          adminEmail: admin?.email || 'Desconhecido',
          targetName: target?.name || null,
          targetEmail: target?.email || null
        };
      })
    );

    return res.json({
      logs: enrichedLogs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return res.status(500).json({ error: 'Erro ao buscar logs' });
  }
};

/**
 * 👑 GET /api/admin/ceo-metrics
 * DASHBOARD CEO - SEM MOCKS, TUDO REAL!
 */
exports.getCEOMetrics = async (req, res) => {
  try {
    console.log('📊 Carregando métricas CEO (REAL)...');
    
    const { period = '30' } = req.query; // 7, 30, 90, 365
    const days = parseInt(period);

    // Datas
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    periodStart.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const firstDayLastMonth = new Date();
    firstDayLastMonth.setMonth(firstDayLastMonth.getMonth() - 1);
    firstDayLastMonth.setDate(1);
    firstDayLastMonth.setHours(0, 0, 0, 0);

    // 1️⃣ USUÁRIOS
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ plan: 'pro' });
    const businessUsers = await User.countDocuments({ plan: 'business' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    // 2️⃣ RECEITA
    const mrr = (proUsers * 39) + (businessUsers * 97);
    const totalRevenue = mrr;
    const activeSubscriptions = proUsers + businessUsers;

    // MRR mês anterior
    const proUsersLastMonth = await User.countDocuments({ 
      plan: 'pro',
      createdAt: { $lt: firstDayOfMonth }
    });
    const businessUsersLastMonth = await User.countDocuments({ 
      plan: 'business',
      createdAt: { $lt: firstDayOfMonth }
    });
    const mrrLastMonth = (proUsersLastMonth * 39) + (businessUsersLastMonth * 97);
    const mrrGrowth = mrrLastMonth > 0 ? ((mrr - mrrLastMonth) / mrrLastMonth) * 100 : 0;

    // 3️⃣ CHURN REAL
    const downgrades = await prisma.adminLog.count({
      where: {
        action: 'change_plan',
        createdAt: { gte: firstDayOfMonth },
        details: {
          path: ['newPlan'],
          equals: 'free'
        }
      }
    });
    const churnRate = activeSubscriptions > 0 ? (downgrades / activeSubscriptions) * 100 : 0;

    // 4️⃣ CONVERSÃO
    const freeUsers = await User.countDocuments({ plan: 'free' });
    const paidUsers = proUsers + businessUsers;
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

    // 5️⃣ ANÁLISES
    const analysesThisMonth = await prisma.analysis.count({
      where: { createdAt: { gte: firstDayOfMonth } }
    });
    const totalAnalyses = await prisma.analysis.count();
    const avgAnalysesPerUser = totalUsers > 0 ? totalAnalyses / totalUsers : 0;

    // 6️⃣ FERRAMENTA MAIS USADA
    const toolsUsage = await prisma.premiumAnalysis.groupBy({
      by: ['type'],
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: 1
    });
    const mostUsedTool = toolsUsage[0]?.type || 'Análise Básica';

    // 7️⃣ HORÁRIO DE PICO REAL
    const analysesWithHours = await prisma.analysis.findMany({
      select: { createdAt: true },
      where: { createdAt: { gte: periodStart } }
    });
    
    const hourCounts = {};
    analysesWithHours.forEach(analysis => {
      const hour = new Date(analysis.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHour = 14;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    });

    const peakHours = `${peakHour}h - ${peakHour + 2}h`;

    // 8️⃣ RECEITA POR PLANO
    const revenueByPlan = [
      { plan: 'pro', revenue: proUsers * 39, count: proUsers },
      { plan: 'business', revenue: businessUsers * 97, count: businessUsers }
    ];

    // 9️⃣ CRESCIMENTO DE USUÁRIOS
    const userGrowthData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const usersUntilThatDay = await User.countDocuments({
        createdAt: { $lt: nextDay }
      });

      userGrowthData.push({
        date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        users: usersUntilThatDay
      });
    }

    // 🔟 ANÁLISES POR DIA
    const analysesTimelineData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.analysis.count({
        where: { createdAt: { gte: date, lt: nextDay } }
      });

      analysesTimelineData.push({
        date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        count
      });
    }

    // 1️⃣1️⃣ DISTRIBUIÇÃO POR CATEGORIA
    const categoryDistribution = await prisma.analysis.groupBy({
      by: ['category'],
      _count: true,
      where: { createdAt: { gte: periodStart } },
      orderBy: { _count: { category: 'desc' } },
      take: 5
    });

    const formattedCategories = categoryDistribution.map(item => ({
      category: item.category || 'Sem categoria',
      count: item._count
    }));

    // 1️⃣2️⃣ TOP 5 USUÁRIOS MAIS ATIVOS
    const topUsers = await prisma.userStats.findMany({
      orderBy: { totalRequests: 'desc' },
      take: 5,
      select: { userId: true, totalRequests: true, monthlyRequests: true }
    });

    const topUsersEnriched = await Promise.all(
      topUsers.map(async (userStat) => {
        const user = await User.findById(userStat.userId).select('name email plan');
        return {
          name: user?.name || 'Desconhecido',
          email: user?.email || '',
          plan: user?.plan || 'free',
          totalRequests: userStat.totalRequests,
          monthlyRequests: userStat.monthlyRequests
        };
      })
    );

    // 1️⃣3️⃣ RECEITA HISTÓRICA (últimos 12 meses)
    const revenueHistory = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const proCount = await User.countDocuments({
        plan: 'pro',
        createdAt: { $lte: lastDay }
      });
      const businessCount = await User.countDocuments({
        plan: 'business',
        createdAt: { $lte: lastDay }
      });

      const revenue = (proCount * 39) + (businessCount * 97);

      revenueHistory.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue
      });
    }

    // 1️⃣4️⃣ ATIVIDADE RECENTE
    const recentLogs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const recentActivity = await Promise.all(
      recentLogs.map(async (log) => {
        const user = await User.findById(log.adminId).select('name email');
        
        let action = 'realizou uma ação';
        let details = '';

        if (log.action === 'change_plan') {
          action = 'alterou plano de usuário';
          details = `${log.details?.email || ''}: ${log.details?.oldPlan} → ${log.details?.newPlan}`;
        } else if (log.action === 'toggle_admin') {
          action = log.details?.newIsAdmin ? 'promoveu admin' : 'removeu admin';
          details = `${log.details?.email || ''}`;
        } else if (log.action === 'delete_user') {
          action = 'deletou usuário';
          details = `${log.details?.email || ''}`;
        }

        return {
          id: log.id,
          user: user?.name || 'Sistema',
          action,
          details,
          timestamp: log.createdAt
        };
      })
    );

    const metrics = {
      mrr,
      mrrGrowth: parseFloat(mrrGrowth.toFixed(1)),
      totalRevenue,
      activeSubscriptions,
      churnRate: parseFloat(churnRate.toFixed(1)),
      newUsersThisMonth,
      analysesThisMonth,
      avgAnalysesPerUser: parseFloat(avgAnalysesPerUser.toFixed(1)),
      mostUsedTool,
      peakHours,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      revenueByPlan,
      userGrowth: userGrowthData,
      analysesTimeline: analysesTimelineData,
      categoryDistribution: formattedCategories,
      topUsers: topUsersEnriched,
      revenueHistory,
      recentActivity
    };

    console.log('✅ Métricas CEO carregadas (100% REAL)');
    return res.json(metrics);

  } catch (error) {
    console.error('❌ Erro ao carregar métricas CEO:', error);
    return res.status(500).json({ error: 'Erro ao carregar métricas CEO' });
  }
};