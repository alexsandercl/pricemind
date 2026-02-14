const cron = require('node-cron');
const kiwifyService = require('./services/kiwify.service');
const emailService = require('./services/email.service');
const User = require('./models/User');
const Subscription = require('./models/Subscription');

/**
 * ⏰ CRON JOBS DO PRICEMIND
 * Versão compatível com export existente
 */

/**
 * 🔴 CRÍTICO: Verifica assinaturas expiradas
 * Roda a cada 1 hora
 */
function checkExpiredSubscriptions() {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('\n🔍 [CRON] Verificando assinaturas expiradas...');
      await kiwifyService.checkExpiredSubscriptions();
      console.log('✅ [CRON] Verificação de assinaturas concluída\n');
    } catch (error) {
      console.error('❌ [CRON] Erro ao verificar assinaturas:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
}

/**
 * 📊 Atualiza monitores de preço
 * Roda todos os dias às 9h
 */
function updatePriceMonitors() {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('\n📊 [CRON] Atualizando monitores de preço...');
      
      // Importa dinamicamente para evitar dependência circular
      const { updateAllMonitors } = require('./controllers/monitor.controller');
      await updateAllMonitors();
      
      console.log('✅ [CRON] Monitores atualizados\n');
    } catch (error) {
      console.error('❌ [CRON] Erro ao atualizar monitores:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
}

/**
 * 📧 Envia lembretes de expiração
 * Roda todos os dias às 10h
 */
function sendExpiryReminders() {
  cron.schedule('0 10 * * *', async () => {
    try {
      console.log('\n📧 [CRON] Enviando lembretes de expiração...');

      const now = new Date();
      
      // Busca usuários que expiram em 7 dias
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const usersExpiringSoon = await User.find({
        plan: { $in: ['pro', 'business'] },
        planExpiry: {
          $gte: now,
          $lte: sevenDaysFromNow
        }
      });

      console.log(`📧 Enviando ${usersExpiringSoon.length} lembretes...`);

      for (const user of usersExpiringSoon) {
        const daysRemaining = Math.ceil(
          (user.planExpiry - now) / (1000 * 60 * 60 * 24)
        );

        await emailService.sendExpiryReminder(user, daysRemaining);
        
        // Delay de 500ms entre emails para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('✅ [CRON] Lembretes enviados\n');
    } catch (error) {
      console.error('❌ [CRON] Erro ao enviar lembretes:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
}

/**
 * 🧹 Limpa dados antigos
 * Roda todo domingo às 3h da manhã
 */
function cleanupOldData() {
  cron.schedule('0 3 * * 0', async () => {
    try {
      console.log('\n🧹 [CRON] Limpando dados antigos...');

      // 1. Remove subscriptions expiradas há mais de 1 ano
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const deletedSubs = await Subscription.deleteMany({
        status: 'expired',
        endDate: { $lt: oneYearAgo }
      });

      console.log(`🗑️ ${deletedSubs.deletedCount} subscriptions antigas removidas`);

      // 2. Limpa cache de webhooks (global.webhookCache)
      if (global.webhookCache) {
        const beforeSize = Object.keys(global.webhookCache).length;
        global.webhookCache = {};
        console.log(`🗑️ ${beforeSize} entradas de cache removidas`);
      }

      // 3. Reseta contadores mensais se necessário
      const usersToReset = await User.find({
        lastResetDate: { 
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        }
      });

      for (const user of usersToReset) {
        user.monthlyAnalysisCount = 0;
        user.lastResetDate = new Date();
        await user.save();
      }

      console.log(`🔄 ${usersToReset.length} contadores mensais resetados`);
      console.log('✅ [CRON] Limpeza concluída\n');
    } catch (error) {
      console.error('❌ [CRON] Erro ao limpar dados:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
}

/**
 * Imprime agenda de cron jobs
 */
function printSchedule() {
  console.log('\n📅 AGENDA DE CRON JOBS:');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ ⏰ A cada 1 hora:       Verifica assinaturas    │');
  console.log('│ 🌅 Diariamente às 9h:   Atualiza monitores      │');
  console.log('│ 📧 Diariamente às 10h:  Envia lembretes         │');
  console.log('│ 🧹 Domingos às 3h:      Limpeza de dados        │');
  console.log('└─────────────────────────────────────────────────┘\n');
}

/**
 * Função principal - MANTÉM COMPATIBILIDADE COM CÓDIGO EXISTENTE
 */
function initCronJobs() {
  console.log('⏰ Iniciando cron jobs...');

  // Inicia todos os cron jobs
  checkExpiredSubscriptions();
  updatePriceMonitors();
  sendExpiryReminders();
  cleanupOldData();

  console.log('✅ Todos os cron jobs configurados!');
  printSchedule();
}

/**
 * Executa uma verificação manual (útil para testes)
 */
async function runManualCheck() {
  console.log('🔧 Executando verificação manual...');
  await kiwifyService.checkExpiredSubscriptions();
  console.log('✅ Verificação manual concluída');
}

// ===== EXPORT COMPATÍVEL =====
// Mantém a forma antiga de exportar
module.exports = { 
  initCronJobs,           // ← Função que seu app.js chama
  runManualCheck          // ← Bonus: para testes manuais
};