const nodemailer = require('nodemailer');

console.log('📧 Carregando emailConfig.js...');

/**
 * 📧 CONFIGURAÇÃO DE EMAIL - NODEMAILER
 */

// Criar transporter (SEM "er" no final!)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log('✅ Transporter criado com sucesso!');

/**
 * 📧 FUNÇÃO PRINCIPAL: Enviar Email
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `PriceMind <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
}

/**
 * 🎉 EMAIL DE BOAS-VINDAS
 */
async function sendWelcomeEmail(email, name) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: #EAB308; margin: 0; font-size: 32px; }
    .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e5e5; }
    .welcome-box { background: #f9fafb; border-left: 4px solid #EAB308; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .features { margin: 30px 0; }
    .feature { margin: 15px 0; padding-left: 25px; position: relative; }
    .feature:before { content: "✓"; position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 20px; }
    .btn { display: inline-block; background: #EAB308; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bem-vindo ao PriceMind!</h1>
    </div>
    
    <div class="content">
      <p>Olá, <strong>${name}</strong>!</p>
      
      <div class="welcome-box">
        <h2 style="margin-top: 0; color: #1a1a1a;">Sua conta foi criada com sucesso!</h2>
        <p style="margin: 10px 0;">Estamos muito felizes em ter você conosco. O PriceMind vai revolucionar a forma como você precifica seus produtos.</p>
      </div>
      
      <div class="features">
        <h3>🚀 O que você pode fazer agora:</h3>
        <div class="feature">Analisar preços com Inteligência Artificial</div>
        <div class="feature">Calcular margens de lucro automaticamente</div>
        <div class="feature">Comparar com concorrentes (Plano Business)</div>
        <div class="feature">Simular cenários de precificação (Plano Business)</div>
        <div class="feature">Monitorar preços de concorrentes 24/7 (Plano Business)</div>
      </div>
      
      <p style="margin-top: 30px;">
        💡 <strong>Dica:</strong> Comece fazendo sua primeira análise de preço para descobrir o poder da IA aplicada à precificação!
      </p>
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">
          Começar Agora
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Você está recebendo este email porque criou uma conta no PriceMind.</p>
      <p>Se você não criou esta conta, por favor ignore este email.</p>
      <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} PriceMind. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Bem-vindo ao PriceMind, ${name}!

Sua conta foi criada com sucesso. Estamos muito felizes em ter você conosco.

O que você pode fazer agora:
- Analisar preços com Inteligência Artificial
- Calcular margens de lucro automaticamente
- Comparar com concorrentes (Plano Business)
- Simular cenários de precificação (Plano Business)
- Monitorar preços de concorrentes 24/7 (Plano Business)

Comece agora: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

© ${new Date().getFullYear()} PriceMind. Todos os direitos reservados.
  `;

  return await sendEmail({
    to: email,
    subject: '🎉 Bem-vindo ao PriceMind!',
    html,
    text
  });
}

/**
 * 🔑 EMAIL DE RECUPERAÇÃO DE SENHA
 */
async function sendPasswordResetEmail(email, name, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

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
    .alert-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .btn { display: inline-block; background: #EAB308; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 12px; }
    .token-box { background: #f9fafb; border: 1px dashed #d1d5db; padding: 15px; margin: 20px 0; text-align: center; font-family: monospace; font-size: 14px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Recuperação de Senha</h1>
    </div>
    
    <div class="content">
      <p>Olá, <strong>${name}</strong>!</p>
      
      <div class="alert-box">
        <p style="margin: 0;"><strong>⚠️ Recebemos uma solicitação de recuperação de senha</strong></p>
      </div>
      
      <p>Você solicitou a redefinição da sua senha no PriceMind. Clique no botão abaixo para criar uma nova senha:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">
          Redefinir Senha
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Ou copie e cole este link no seu navegador:
      </p>
      <div class="token-box">
        ${resetUrl}
      </div>
      
      <p style="margin-top: 30px; color: #EF4444; font-weight: bold;">
        ⏱️ Este link expira em 1 hora!
      </p>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.
      </p>
    </div>
    
    <div class="footer">
      <p>Este é um email automático do PriceMind.</p>
      <p>Por favor, não responda este email.</p>
      <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} PriceMind. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Recuperação de Senha - PriceMind

Olá, ${name}!

Você solicitou a redefinição da sua senha no PriceMind.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

⏱️ Este link expira em 1 hora!

Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.

© ${new Date().getFullYear()} PriceMind. Todos os direitos reservados.
  `;

  return await sendEmail({
    to: email,
    subject: '🔑 Recuperação de Senha - PriceMind',
    html,
    text
  });
}

/**
 * ✅ VERIFICAR CONFIGURAÇÃO
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email configurado e pronto para enviar');
    return true;
  } catch (error) {
    console.error('❌ Erro na configuração de email:', error.message);
    return false;
  }
}

// Verificar ao iniciar
verifyEmailConfig();

module.exports = {
  transporter,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  verifyEmailConfig
};