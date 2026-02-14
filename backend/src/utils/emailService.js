const { sendEmail } = require('../config/emailConfig');
const { welcomeEmailTemplate } = require('../templates/welcomeEmail');
const { resetPasswordEmailTemplate } = require('../templates/resetPasswordEmail');

/**
 * 📧 SERVIÇO DE EMAILS
 * Funções específicas para cada tipo de email
 */

/**
 * Enviar email de boas-vindas
 */
async function sendWelcomeEmail(userEmail, userName) {
  try {
    const html = welcomeEmailTemplate(userName);

    const result = await sendEmail({
      to: userEmail,
      subject: '🎉 Bem-vindo ao PriceMind!',
      html,
      text: `Olá ${userName}! Bem-vindo ao PriceMind. Sua conta foi criada com sucesso.`,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
}

/**
 * Enviar email de recuperação de senha
 */
async function sendPasswordResetEmail(userEmail, userName, resetToken) {
  try {
    const html = resetPasswordEmailTemplate(userName, resetToken, '1 hora');

    const result = await sendEmail({
      to: userEmail,
      subject: '🔑 Recuperação de Senha - PriceMind',
      html,
      text: `Olá ${userName}! Recebemos uma solicitação para redefinir sua senha. Use o token: ${resetToken}`,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    throw error;
  }
}

/**
 * Enviar email de confirmação de upgrade de plano
 */
async function sendPlanUpgradeEmail(userEmail, userName, plan) {
  const planNames = {
    pro: 'Pro 💎',
    business: 'Business 🚀',
  };

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 20px; padding: 40px;">
    <h1 style="color: #facc15;">🎉 Upgrade realizado!</h1>
    <p>Olá <strong>${userName}</strong>,</p>
    <p>Seu plano foi atualizado com sucesso para <strong style="color: #facc15;">${planNames[plan]}</strong>!</p>
    <p>Agora você tem acesso a todos os recursos premium do PriceMind.</p>
    <p style="margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 15px 30px; background: #facc15; color: #000; text-decoration: none; border-radius: 10px; font-weight: bold;">
        Explorar recursos
      </a>
    </p>
  </div>
</body>
</html>
  `;

  try {
    const result = await sendEmail({
      to: userEmail,
      subject: `🎉 Upgrade para Plano ${planNames[plan]} confirmado!`,
      html,
      text: `Olá ${userName}! Seu plano foi atualizado para ${planNames[plan]}.`,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar email de upgrade:', error);
    throw error;
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPlanUpgradeEmail,
};