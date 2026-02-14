const { prisma } = require('../lib/prisma');

/**
 * GET /preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // Se não existir, criar com valores padrão
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          theme: 'dark',
          language: 'pt-BR'
        }
      });
    }

    return res.json(preferences);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar preferências' });
  }
};

/**
 * PUT /preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { theme, language } = req.body;

    // Validação
    const validThemes = ['dark', 'light', 'system'];
    const validLanguages = ['pt-BR', 'en-US'];

    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ error: 'Tema inválido' });
    }

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Idioma inválido' });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...(theme && { theme }),
        ...(language && { language })
      },
      create: {
        userId,
        theme: theme || 'dark',
        language: language || 'pt-BR'
      }
    });

    return res.json(preferences);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar preferências' });
  }
};