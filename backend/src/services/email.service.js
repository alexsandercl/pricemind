// backend/src/services/email.service.js
const { sendEmail } = require('../config/emailConfig');

const FROM_NAME = 'PriceMind - Precificação Inteligente';

class EmailService {
  /**
   * Email de boas-vindas ao ativar plano KIWIFY
   */
  async sendWelcomeEmail(user) {
    const planNames = { free: 'Free', pro: 'Pro', business: 'Business' };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <div style="background: #eab308; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🚀 Seja bem-vindo ao PriceMind!</h1>
          </div>
          
          <div style="padding: 30px;">
            <p>Olá <strong>${user.name}</strong>,</p>
            
            <p>Parabéns! Seu plano <strong>${planNames[user.plan]}</strong> está ativo e pronto para uso!</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>✨ O que você pode fazer agora:</h3>
              ${user.plan === 'pro' ? `
                <p>✅ 100 análises de preços por mês</p>
                <p>✅ Comparador de concorrentes</p>
                <p>✅ Calculadora avançada de lucro</p>
              ` : user.plan === 'business' ? `
                <p>✅ Análises ILIMITADAS</p>
                <p>✅ Todas as 14 ferramentas</p>
                <p>✅ Dashboard executivo completo</p>
              ` : `
                <p>✅ 10 análises básicas por mês</p>
              `}
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                 style="display: inline-block; background: #eab308; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Acessar Dashboard
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: `🎉 Bem-vindo ao PriceMind ${planNames[user.plan]}!`,
        html: htmlContent
      });
      console.log(`✅ Email de boas-vindas enviado para ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentConfirmation(user, amount, orderId) {
    const planNames = { free: 'Free', pro: 'Pro', business: 'Business' };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #22c55e;">✅ Pagamento Confirmado!</h2>
        <p>Olá <strong>${user.name}</strong>,</p>
        <p>Seu pagamento de R$ ${(amount / 100).toFixed(2)} foi processado com sucesso!</p>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: '✅ Pagamento Confirmado - PriceMind',
        html: htmlContent
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false };
    }
  }

  async sendRefundEmail(user) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>💸 Reembolso Processado</h2>
        <p>Olá <strong>${user.name}</strong>,</p>
        <p>Seu reembolso foi processado com sucesso.</p>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: '💸 Reembolso Processado - PriceMind',
        html: htmlContent
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false };
    }
  }

  async sendChargebackAlert(user, orderId) {
    const ADMIN_EMAIL = process.env.EMAIL_USER || 'alexsander9195@gmail.com';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #ef4444;">⚠️ CHARGEBACK DETECTADO</h2>
        <p>Usuário: ${user.name} (${user.email})</p>
        <p>Order ID: ${orderId}</p>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: '⚠️ ALERTA: Chargeback Detectado',
        html: htmlContent
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar alerta:', error);
      return { success: false };
    }
  }

  async sendExpiryReminder(user, daysRemaining) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>⏰ Seu plano expira em ${daysRemaining} dias</h2>
        <p>Olá <strong>${user.name}</strong>,</p>
        <p>Renove sua assinatura para continuar aproveitando!</p>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: `⏰ Seu plano expira em ${daysRemaining} dias`,
        html: htmlContent
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar lembrete:', error);
      return { success: false };
    }
  }
}

module.exports = new EmailService();