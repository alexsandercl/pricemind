const { prisma } = require('../config/prisma');
const { scrapePrice, testUrl } = require('../services/scraping.service');
const emailConfig = require('../config/emailConfig');

/**
 * 📧 HELPER: Criar email de alerta de preço
 */
async function sendPriceAlertEmail(userEmail, userName, productName, oldPrice, newPrice, priceChange) {
  const isIncrease = priceChange > 0;
  const changeIcon = isIncrease ? '📈' : '📉';
  const changeColor = isIncrease ? '#EF4444' : '#10B981';
  const changeText = isIncrease ? 'AUMENTOU' : 'DIMINUIU';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: #EAB308; margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
    .alert-box { background: ${changeColor}15; border-left: 4px solid ${changeColor}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .price-comparison { display: flex; justify-content: space-around; margin: 30px 0; }
    .price-box { text-align: center; padding: 15px; }
    .old-price { color: #999; text-decoration: line-through; font-size: 18px; }
    .new-price { color: ${changeColor}; font-size: 32px; font-weight: bold; }
    .change-badge { background: ${changeColor}; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #EAB308; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 PriceMind Alert</h1>
    </div>
    
    <div class="content">
      <p>Olá, <strong>${userName}</strong>!</p>
      
      <div class="alert-box">
        <h2 style="margin-top: 0; color: ${changeColor};">${changeIcon} Mudança de Preço Detectada!</h2>
        <p style="font-size: 18px; margin: 10px 0;"><strong>${productName}</strong></p>
      </div>
      
      <div class="price-comparison">
        <div class="price-box">
          <p style="margin: 0; color: #666; font-size: 14px;">Preço Anterior</p>
          <p class="old-price">R$ ${oldPrice.toFixed(2)}</p>
        </div>
        
        <div style="display: flex; align-items: center; font-size: 32px; color: ${changeColor};">
          →
        </div>
        
        <div class="price-box">
          <p style="margin: 0; color: #666; font-size: 14px;">Preço Atual</p>
          <p class="new-price">R$ ${newPrice.toFixed(2)}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <span class="change-badge">
          ${changeText} ${Math.abs(priceChange).toFixed(2)}%
        </span>
      </div>
      
      <p style="margin-top: 30px;">
        ${isIncrease 
          ? '⚠️ O preço <strong>aumentou</strong>. Você pode querer ajustar sua precificação para manter a competitividade.'
          : '✅ O preço <strong>diminuiu</strong>. Considere revisar sua estratégia de precificação.'
        }
      </p>
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">
          Ver no PriceMind
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este é um alerta automático do PriceMind Monitor de Preços.</p>
      <p>Para gerenciar seus alertas, acesse sua conta no PriceMind.</p>
      <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} PriceMind. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Alerta PriceMind: ${productName}

O preço ${changeText} de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)

Acesse ${process.env.FRONTEND_URL || 'http://localhost:5173'} para mais detalhes.
  `;

  return await emailConfig.sendEmail({
    to: userEmail,
    subject: `${changeIcon} Alerta: Preço ${changeText} - ${productName}`,
    html,
    text
  });
}

/**
 * 📋 CRIAR NOVO MONITORAMENTO
 * POST /monitor
 */
exports.createMonitor = async (req, res) => {
  try {
    const { productName, targetUrl, alertThreshold, frequency } = req.body;
    const userId = req.user._id.toString();
    const plan = req.user.plan;

    // Verificar plano Business
    if (plan !== 'business') {
      return res.status(403).json({ 
        message: 'Monitor de Preços é exclusivo do plano Business',
        upgrade: true 
      });
    }

    // Validar campos obrigatórios
    if (!productName || !targetUrl) {
      return res.status(400).json({ 
        message: 'Nome do produto e URL são obrigatórios' 
      });
    }

    // Validar URL
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).json({ 
        message: 'URL deve começar com http:// ou https://' 
      });
    }

    // Testar se URL é acessível
    const isAccessible = await testUrl(targetUrl);
    if (!isAccessible) {
      return res.status(400).json({ 
        message: 'URL não está acessível. Verifique se está correta.' 
      });
    }

    // Fazer scraping inicial para obter preço
    console.log('🔍 Fazendo scraping inicial...');
    const initialPrice = await scrapePrice(targetUrl);

    if (initialPrice === null) {
      return res.status(400).json({ 
        message: 'Não conseguimos detectar o preço nesta URL. Verifique se a página possui preço visível.' 
      });
    }

    // Criar monitoramento
    const monitor = await prisma.priceMonitor.create({
      data: {
        userId,
        productName,
        targetUrl,
        currentPrice: initialPrice,
        initialPrice: initialPrice,
        alertThreshold: alertThreshold || 5.0,
        frequency: frequency || 'daily',
        isActive: true,
        lastChecked: new Date()
      }
    });

    // Criar primeiro registro no histórico
    await prisma.priceHistory.create({
      data: {
        monitorId: monitor.id,
        price: initialPrice,
        priceChange: 0
      }
    });

    console.log(`✅ Monitor criado: ${monitor.id} - ${productName} - R$ ${initialPrice}`);

    return res.status(201).json({
      message: 'Monitoramento criado com sucesso!',
      monitor: {
        id: monitor.id,
        productName: monitor.productName,
        currentPrice: monitor.currentPrice,
        targetUrl: monitor.targetUrl,
        alertThreshold: monitor.alertThreshold,
        frequency: monitor.frequency
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar monitor:', error);
    return res.status(500).json({ 
      message: error.message || 'Erro ao criar monitoramento' 
    });
  }
};

/**
 * 📊 LISTAR MONITORAMENTOS DO USUÁRIO
 * GET /monitor
 */
exports.listMonitors = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const monitors = await prisma.priceMonitor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        history: {
          orderBy: { checkedAt: 'desc' },
          take: 10
        }
      }
    });

    // Calcular estatísticas
    const stats = monitors.map(monitor => {
      const priceChange = monitor.currentPrice - monitor.initialPrice;
      const priceChangePercent = ((priceChange / monitor.initialPrice) * 100).toFixed(2);
      
      return {
        id: monitor.id,
        productName: monitor.productName,
        targetUrl: monitor.targetUrl,
        currentPrice: monitor.currentPrice,
        initialPrice: monitor.initialPrice,
        priceChange,
        priceChangePercent: parseFloat(priceChangePercent),
        alertThreshold: monitor.alertThreshold,
        frequency: monitor.frequency,
        isActive: monitor.isActive,
        lastChecked: monitor.lastChecked,
        createdAt: monitor.createdAt,
        historyCount: monitor.history.length
      };
    });

    return res.json({ monitors: stats });

  } catch (error) {
    console.error('❌ Erro ao listar monitores:', error);
    return res.status(500).json({ message: 'Erro ao listar monitoramentos' });
  }
};

/**
 * 📈 OBTER HISTÓRICO DE UM MONITOR
 * GET /monitor/:monitorId/history
 */
exports.getMonitorHistory = async (req, res) => {
  try {
    const { monitorId } = req.params;
    const userId = req.user._id.toString();

    const monitor = await prisma.priceMonitor.findFirst({
      where: {
        id: monitorId,
        userId
      },
      include: {
        history: {
          orderBy: { checkedAt: 'desc' }
        }
      }
    });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitoramento não encontrado' });
    }

    return res.json({
      monitor: {
        id: monitor.id,
        productName: monitor.productName,
        currentPrice: monitor.currentPrice,
        initialPrice: monitor.initialPrice
      },
      history: monitor.history.map(h => ({
        id: h.id,
        price: h.price,
        priceChange: h.priceChange,
        checkedAt: h.checkedAt
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
};

/**
 * 🔄 ATUALIZAR PREÇO MANUALMENTE
 * POST /monitor/:monitorId/refresh
 */
exports.refreshMonitor = async (req, res) => {
  try {
    const { monitorId } = req.params;
    const userId = req.user._id.toString();

    const monitor = await prisma.priceMonitor.findFirst({
      where: {
        id: monitorId,
        userId
      }
    });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitoramento não encontrado' });
    }

    // Fazer scraping
    console.log(`🔍 Atualizando monitor ${monitorId}...`);
    const newPrice = await scrapePrice(monitor.targetUrl);

    if (newPrice === null) {
      return res.status(400).json({ 
        message: 'Não foi possível extrair o preço neste momento' 
      });
    }

    // Calcular mudança
    const priceChange = ((newPrice - monitor.currentPrice) / monitor.currentPrice) * 100;

    // Atualizar monitor
    await prisma.priceMonitor.update({
      where: { id: monitorId },
      data: {
        lastPrice: monitor.currentPrice,
        currentPrice: newPrice,
        lastChecked: new Date()
      }
    });

    // Adicionar ao histórico
    await prisma.priceHistory.create({
      data: {
        monitorId: monitor.id,
        price: newPrice,
        priceChange: parseFloat(priceChange.toFixed(2))
      }
    });

    console.log(`✅ Monitor atualizado: ${monitor.productName} - R$ ${newPrice} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`);

    // 📧 ENVIAR EMAIL SE MUDANÇA >= THRESHOLD
    if (Math.abs(priceChange) >= monitor.alertThreshold) {
      console.log(`🔔 Mudança detectada: ${priceChange.toFixed(2)}% (threshold: ${monitor.alertThreshold}%)`);
      
      try {
        // Buscar dados do usuário
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: userId },
          select: { name: true }
        });

        // Email vem do req.user (MongoDB/Auth)
        const userEmail = req.user.email;
        const userName = userProfile?.name || 'Usuário';

        if (userEmail) {
          await sendPriceAlertEmail(
            userEmail,
            userName,
            monitor.productName,
            monitor.currentPrice,
            newPrice,
            priceChange
          );
          console.log(`✅ Email enviado para ${userEmail}`);
        } else {
          console.log(`⚠️ Email não encontrado para userId: ${userId}`);
        }
      } catch (emailError) {
        console.error(`❌ Erro ao enviar email:`, emailError.message);
      }
    }

    return res.json({
      message: 'Preço atualizado com sucesso!',
      oldPrice: monitor.currentPrice,
      newPrice: newPrice,
      priceChange: parseFloat(priceChange.toFixed(2))
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar monitor:', error);
    return res.status(500).json({ 
      message: error.message || 'Erro ao atualizar preço' 
    });
  }
};

/**
 * ⏸️ PAUSAR/ATIVAR MONITORAMENTO
 * PUT /monitor/:monitorId/toggle
 */
exports.toggleMonitor = async (req, res) => {
  try {
    const { monitorId } = req.params;
    const userId = req.user._id.toString();

    const monitor = await prisma.priceMonitor.findFirst({
      where: {
        id: monitorId,
        userId
      }
    });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitoramento não encontrado' });
    }

    const updated = await prisma.priceMonitor.update({
      where: { id: monitorId },
      data: { isActive: !monitor.isActive }
    });

    return res.json({
      message: updated.isActive ? 'Monitoramento ativado' : 'Monitoramento pausado',
      isActive: updated.isActive
    });

  } catch (error) {
    console.error('❌ Erro ao alternar monitor:', error);
    return res.status(500).json({ message: 'Erro ao alternar monitoramento' });
  }
};

/**
 * ✏️ EDITAR PREÇO MANUALMENTE
 * PUT /monitor/:monitorId/edit-price
 */
exports.editPrice = async (req, res) => {
  try {
    const { monitorId } = req.params;
    const { newPrice } = req.body;
    const userId = req.user._id.toString();

    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
      return res.status(400).json({ 
        message: 'Preço inválido. Informe um valor numérico positivo.' 
      });
    }

    const monitor = await prisma.priceMonitor.findFirst({
      where: {
        id: monitorId,
        userId
      }
    });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitoramento não encontrado' });
    }

    const updated = await prisma.priceMonitor.update({
      where: { id: monitorId },
      data: {
        currentPrice: parseFloat(newPrice),
        initialPrice: parseFloat(newPrice),
        lastChecked: new Date()
      }
    });

    await prisma.priceHistory.create({
      data: {
        monitorId: monitor.id,
        price: parseFloat(newPrice),
        priceChange: 0
      }
    });

    console.log(`✏️ Preço editado manualmente: ${monitor.productName} → R$ ${newPrice}`);

    return res.json({
      message: 'Preço atualizado com sucesso!',
      monitor: {
        id: updated.id,
        currentPrice: updated.currentPrice,
        initialPrice: updated.initialPrice
      }
    });

  } catch (error) {
    console.error('❌ Erro ao editar preço:', error);
    return res.status(500).json({ message: 'Erro ao editar preço' });
  }
};

/**
 * 🗑️ DELETAR MONITORAMENTO
 * DELETE /monitor/:monitorId
 */
exports.deleteMonitor = async (req, res) => {
  try {
    const { monitorId } = req.params;
    const userId = req.user._id.toString();

    const monitor = await prisma.priceMonitor.findFirst({
      where: {
        id: monitorId,
        userId
      }
    });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitoramento não encontrado' });
    }

    await prisma.priceMonitor.delete({
      where: { id: monitorId }
    });

    return res.json({ message: 'Monitoramento deletado com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao deletar monitor:', error);
    return res.status(500).json({ message: 'Erro ao deletar monitoramento' });
  }
};

/**
 * 🤖 ATUALIZAR TODOS OS MONITORES ATIVOS (CRON JOB)
 */
exports.updateAllMonitors = async () => {
  try {
    console.log('🤖 Iniciando atualização de monitores...');

    const monitors = await prisma.priceMonitor.findMany({
      where: { isActive: true }
    });

    console.log(`📊 ${monitors.length} monitores ativos encontrados`);

    for (const monitor of monitors) {
      try {
        console.log(`🔍 Verificando: ${monitor.productName}`);

        const newPrice = await scrapePrice(monitor.targetUrl);

        if (newPrice !== null && newPrice !== monitor.currentPrice) {
          const priceChange = ((newPrice - monitor.currentPrice) / monitor.currentPrice) * 100;

          // Atualizar monitor
          await prisma.priceMonitor.update({
            where: { id: monitor.id },
            data: {
              lastPrice: monitor.currentPrice,
              currentPrice: newPrice,
              lastChecked: new Date()
            }
          });

          // Adicionar ao histórico
          await prisma.priceHistory.create({
            data: {
              monitorId: monitor.id,
              price: newPrice,
              priceChange: parseFloat(priceChange.toFixed(2))
            }
          });

          console.log(`✅ ${monitor.productName}: R$ ${monitor.currentPrice} → R$ ${newPrice} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`);

          // 📧 ENVIAR EMAIL SE MUDANÇA >= THRESHOLD
          if (Math.abs(priceChange) >= monitor.alertThreshold) {
            console.log(`🔔 Mudança detectada: ${priceChange.toFixed(2)}% (threshold: ${monitor.alertThreshold}%)`);

          // 🆕 CRIAR NOTIFICAÇÃO
          const icon = priceChange > 0 ? "📈" : "📉";
          const action = priceChange > 0 ? "subiu" : "caiu";
          const color = priceChange > 0 ? "warning" : "success";

          try {
            await prisma.notification.create({
              data: {
                userId: monitor.userId,
                type: color,
                title: `${icon} Preço ${action.toUpperCase()}!`,
                message: `"${monitor.productName}" ${action} ${Math.abs(priceChange).toFixed(1)}% (R$ ${newPrice.toFixed(2)})`,
                link: `/price-monitor`,
              },
            });

            console.log(`🔔 Notificação de preço enviada para ${monitor.userId}`);
          } catch (notifError) {
            console.error('⚠️ Erro ao criar notificação:', notifError);
          }

            
            try {
              // Buscar dados do usuário
              const userProfile = await prisma.userProfile.findUnique({
                where: { userId: monitor.userId },
                select: { name: true }
              });

              // ⚠️ LIMITAÇÃO: Cron job não tem acesso ao email do MongoDB
              // Você precisa armazenar o email no UserProfile ou criar relação
              console.log(`⚠️ Email no cron job requer email em UserProfile.email`);
              console.log(`💡 Solução: Adicione campo 'email' no model UserProfile`);
              
              // TODO: Quando adicionar email no UserProfile, descomentar:
              // if (userProfile?.email) {
              //   await sendPriceAlertEmail(
              //     userProfile.email,
              //     userProfile.name || 'Usuário',
              //     monitor.productName,
              //     monitor.currentPrice,
              //     newPrice,
              //     priceChange
              //   );
              //   console.log(`✅ Email enviado para ${userProfile.email}`);
              // }
            } catch (emailError) {
              console.error(`❌ Erro ao enviar email:`, emailError.message);
            }
          }
        } else if (newPrice !== null) {
          // Mesmo preço, apenas atualizar lastChecked
          await prisma.priceMonitor.update({
            where: { id: monitor.id },
            data: { lastChecked: new Date() }
          });

          console.log(`⏸️ ${monitor.productName}: Sem mudança de preço`);
        }

        // Delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Erro ao atualizar ${monitor.productName}:`, error.message);
      }
    }

    console.log('✅ Atualização de monitores concluída!');

  } catch (error) {
    console.error('❌ Erro no cron job de monitores:', error);
  }
};