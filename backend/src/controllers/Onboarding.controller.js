const { prisma } = require('../lib/prisma');

/**
 * POST /api/onboarding
 * Versão MINIMALISTA - Apenas salva preferências básicas
 */
exports.saveOnboarding = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { idioma, tema } = req.body;

    console.log('💾 Salvando onboarding para usuário:', userId);
    console.log('📦 Dados recebidos:', { idioma, tema });

    // Salvar apenas idioma e tema (campos que já existem)
    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        language: idioma || 'pt',
        theme: tema || 'dark',
      },
      create: {
        userId,
        language: idioma || 'pt',
        theme: tema || 'dark',
      },
    });

    console.log('✅ Preferências salvas com sucesso!');

    return res.json({ 
      success: true,
      message: 'Configurações salvas com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro ao salvar configurações',
      details: error.message
    });
  }
};