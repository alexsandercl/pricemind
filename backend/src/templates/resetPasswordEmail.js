/**
 * 🔑 EMAIL DE RECUPERAÇÃO DE SENHA
 */
function resetPasswordEmailTemplate(userName, resetToken, expiresIn = '1 hora') {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Senha - PriceMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 24px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, transparent 100%);">
              <div style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; font-weight: bold; color: #000;">P</span>
              </div>
              <h1 style="margin: 20px 0 0; color: #facc15; font-size: 32px; font-weight: 700;">PriceMind</h1>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px; text-align: center;">
                🔑 Recuperação de Senha
              </h2>
              
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá, <strong style="color: #ffffff;">${userName}</strong>!
              </p>

              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Recebemos uma solicitação para redefinir a senha da sua conta no PriceMind. Se você não fez essa solicitação, pode ignorar este email com segurança.
              </p>

              <!-- Alert Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px;">
                    <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.5;">
                      <strong>⚠️ Importante:</strong> Este link expira em <strong>${expiresIn}</strong>. Por segurança, não compartilhe este email com ninguém.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%); color: #000000; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
                <tr>
                  <td style="padding: 15px; background-color: rgba(0, 0, 0, 0.4); border: 1px solid #3f3f46; border-radius: 8px;">
                    <p style="margin: 0; color: #a1a1aa; font-size: 13px; word-break: break-all; font-family: monospace;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: rgba(0, 0, 0, 0.5); border-top: 1px solid #3f3f46;">
              <p style="margin: 0; color: #71717a; font-size: 13px; text-align: center; line-height: 1.5;">
                Se você não solicitou a redefinição de senha, entre em contato conosco imediatamente.
              </p>
              <p style="margin: 15px 0 0; color: #52525b; font-size: 12px; text-align: center;">
                © 2024 PriceMind. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = { resetPasswordEmailTemplate };