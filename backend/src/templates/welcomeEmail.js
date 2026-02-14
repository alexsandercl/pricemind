/**
 * 🎉 EMAIL DE BOAS-VINDAS
 */
function welcomeEmailTemplate(userName) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao PriceMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 24px; overflow: hidden;">
          
          <!-- Header com logo -->
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
                🎉 Bem-vindo, ${userName}!
              </h2>
              
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Estamos muito felizes em ter você conosco! Sua conta no <strong style="color: #facc15;">PriceMind</strong> foi criada com sucesso.
              </p>

              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Agora você pode usar nossa IA para:
              </p>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px; background-color: rgba(0, 0, 0, 0.4); border: 1px solid #3f3f46; border-radius: 12px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #ffffff; font-size: 15px;">
                      <span style="color: #facc15; margin-right: 10px;">📊</span>
                      <strong>Analisar preços</strong> de forma inteligente
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: rgba(0, 0, 0, 0.4); border: 1px solid #3f3f46; border-radius: 12px;">
                    <p style="margin: 0; color: #ffffff; font-size: 15px;">
                      <span style="color: #facc15; margin-right: 10px;">💰</span>
                      <strong>Otimizar lucros</strong> e competitividade
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: rgba(0, 0, 0, 0.4); border: 1px solid #3f3f46; border-radius: 12px;">
                    <p style="margin: 0; color: #ffffff; font-size: 15px;">
                      <span style="color: #facc15; margin-right: 10px;">🎯</span>
                      <strong>Tomar decisões</strong> baseadas em dados
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%); color: #000000; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);">
                      Começar agora 🚀
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Plano Free Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; padding: 20px; background: rgba(250, 204, 21, 0.05); border: 1px solid rgba(250, 204, 21, 0.2); border-radius: 12px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #facc15; font-size: 14px; font-weight: 600;">
                      💎 Seu Plano Free inclui:
                    </p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.5;">
                      ✓ 10 análises por mês<br>
                      ✓ Dashboard completo<br>
                      ✓ Análise manual de produtos
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
                Precisa de ajuda? Responda este email ou visite nossa <a href="#" style="color: #facc15; text-decoration: none;">central de ajuda</a>.
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

module.exports = { welcomeEmailTemplate };