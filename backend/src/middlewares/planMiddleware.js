const { prisma } = require('../lib/prisma');
const { getIO } = require('../socket');

const PLAN_LIMITS = {
  free: {
    maxRequests: 10
  },
  starter: {
    maxRequests: 50
  },
  pro: {
    maxRequests: 100
  },
  business: {
    maxRequests: Infinity
  }
};

module.exports = async function planMiddleware(req, res, next) {
  try {
    const userId = req.user._id.toString();

    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(403).json({
        message: 'Perfil não encontrado'
      });
    }

    const plan = profile.plan || 'free';
    const limits = PLAN_LIMITS[plan];

    if (!limits) {
      console.error('❌ Plano desconhecido:', plan);
      return res.status(403).json({
        message: 'Plano inválido'
      });
    }

    // Business = ilimitado
    if (plan === 'business') {
      return next();
    }

    // Busca stats ATUAIS (antes de incrementar)
    const stats = await prisma.userStats.findUnique({
      where: { userId }
    });

    const currentUsed = stats?.monthlyRequests || 0;
    
    // 🔥 PREVISÃO: Após esta requisição, terá usado +1
    const willHaveUsed = currentUsed + 1;
    const willRemain = limits.maxRequests - willHaveUsed;

    console.log(`📊 Plano: ${plan} | Atual: ${currentUsed}/${limits.maxRequests} | Após: ${willHaveUsed}/${limits.maxRequests} | Restarão: ${willRemain}`);

    // ========================================
    // CASO 1: JÁ ATINGIU O LIMITE (não pode mais fazer)
    // ========================================
    if (currentUsed >= limits.maxRequests) {
      // Criar notificação (se não criou hoje)
      try {
        const limitNotification = await prisma.notification.findFirst({
          where: {
            userId,
            title: "❌ Limite Atingido",
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!limitNotification) {
          await prisma.notification.create({
            data: {
              userId,
              type: "error",
              title: "❌ Limite Atingido",
              message: `Você atingiu o limite de ${limits.maxRequests} análises do plano ${plan.toUpperCase()}. Faça upgrade!`,
              link: "/profile?tab=plano",
            },
          });

          const io = req.app?.get?.("io") || getIO();
          if (io) {
            io.to(`user_${userId}`).emit("new_notification", {
              type: "error",
              title: "❌ Limite Atingido",
              message: `Você atingiu o limite de ${limits.maxRequests} análises do plano ${plan.toUpperCase()}. Faça upgrade!`,
            });
          }

          console.log(`🔔 Limite atingido: usuário ${userId}`);
        }
      } catch (notifError) {
        console.error('⚠️ Erro ao criar notificação:', notifError);
      }

      // BLOQUEAR
      return res.status(403).json({
        message: 'Limite do plano atingido',
        limit: limits.maxRequests,
        used: currentUsed,
        upgrade: true
      });
    }

    // ========================================
    // CASO 2: ESTA SERÁ A ÚLTIMA (após esta, chegará no limite)
    // ========================================
    if (willHaveUsed === limits.maxRequests) {
      console.log(`⚠️ Esta é a última análise permitida! (${willHaveUsed}/${limits.maxRequests})`);
      
      try {
        const lastNotification = await prisma.notification.findFirst({
          where: {
            userId,
            title: "⚠️ Última Análise!",
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!lastNotification) {
          await prisma.notification.create({
            data: {
              userId,
              type: "warning",
              title: "⚠️ Última Análise!",
              message: `Esta é sua última análise do mês no plano ${plan.toUpperCase()}. Faça upgrade para continuar!`,
              link: "/profile?tab=plano",
            },
          });

          const io = req.app?.get?.("io") || getIO();
          if (io) {
            io.to(`user_${userId}`).emit("new_notification", {
              type: "warning",
              title: "⚠️ Última Análise!",
              message: `Esta é sua última análise do mês no plano ${plan.toUpperCase()}. Faça upgrade para continuar!`,
            });
          }

          console.log(`🔔 Última análise: usuário ${userId}`);
        }
      } catch (notifError) {
        console.error('⚠️ Erro ao criar notificação:', notifError);
      }

      // Deixar passar (é a última)
      return next();
    }

    // ========================================
    // CASO 3: ESTÁ PRÓXIMO (restarão 1 ou 2 após esta)
    // ========================================
    if (willRemain <= 2 && willRemain > 0) {
      console.log(`⚠️ Limite próximo! Restarão ${willRemain} após esta.`);
      
      try {
        const proximoNotification = await prisma.notification.findFirst({
          where: {
            userId,
            title: "⚠️ Limite Próximo",
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!proximoNotification) {
          await prisma.notification.create({
            data: {
              userId,
              type: "warning",
              title: "⚠️ Limite Próximo",
              message: `Após esta análise, restarão apenas ${willRemain} análise(s) no plano ${plan.toUpperCase()}!`,
              link: "/profile?tab=plano",
            },
          });

          const io = req.app?.get?.("io") || getIO();
          if (io) {
            io.to(`user_${userId}`).emit("new_notification", {
              type: "warning",
              title: "⚠️ Limite Próximo",
              message: `Após esta análise, restarão apenas ${willRemain} análise(s) no plano ${plan.toUpperCase()}!`,
            });
          }

          console.log(`🔔 Limite próximo: restarão ${willRemain} para usuário ${userId}`);
        }
      } catch (notifError) {
        console.error('⚠️ Erro ao criar notificação:', notifError);
      }
    }

    // ========================================
    // CASO 4: AINDA TEM CRÉDITOS SUFICIENTES
    // ========================================
    next();

  } catch (error) {
    console.error('❌ Plan middleware error:', error);
    return res.status(500).json({
      message: 'Erro ao validar plano'
    });
  }
};