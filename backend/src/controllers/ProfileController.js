const { prisma } = require("../lib/prisma");
const fs = require("fs");
const path = require("path");

/**
 * GET /profile
 * 🔥 CORRIGIDO: Pega isAdmin e role do MongoDB (req.user)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    console.log('🔍 GET /profile - userId:', userId);
    console.log('🔍 MongoDB user:', {
      isAdmin: req.user.isAdmin,
      role: req.user.role,
      plan: req.user.plan
    });

    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    console.log('🔍 Profile do PostgreSQL:', profile);

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId,
          name: req.user.name || "Usuário",
          plan: req.user.plan || "free",
          avatarUrl: null,
          isAdmin: req.user.isAdmin || false,
          role: req.user.role || "user",
        },
      });
    }

    let avatarUrl = null;
    if (profile.avatarUrl) {
      avatarUrl = `http://localhost:5000${profile.avatarUrl}?v=${Date.now()}`;
      console.log('🔍 Avatar URL:', avatarUrl);
    } else {
      console.log('⚠️ Nenhum avatar no banco');
    }

    // 🔥 PEGAR isAdmin e role DO MONGODB (req.user), NÃO DO POSTGRESQL!
    const response = {
      id: profile.id,
      userId: profile.userId,
      name: req.user.name,
      email: req.user.email,
      plan: req.user.plan,                      // MongoDB
      avatarUrl: avatarUrl,
      isAdmin: req.user.isAdmin || false,       // 🔥 MONGODB
      role: req.user.role || "user",            // 🔥 MONGODB
    };

    console.log('🔍 Response final:', response);

    return res.json(response);
  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({
      error: "Erro ao buscar profile",
    });
  }
};

/**
 * PUT /profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { name, plan } = req.body;

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { name, plan },
      create: { 
        userId, 
        name, 
        plan,
        isAdmin: req.user.isAdmin || false,
        role: req.user.role || "user"
      },
    });

    let avatarUrl = null;
    if (profile.avatarUrl) {
      avatarUrl = `http://localhost:5000${profile.avatarUrl}?v=${Date.now()}`;
    }

    const response = {
      id: profile.id,
      userId: profile.userId,
      name: req.user.name,
      email: req.user.email,
      plan: req.user.plan,
      avatarUrl: avatarUrl,
      isAdmin: req.user.isAdmin || false,
      role: req.user.role || "user",
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao atualizar profile",
    });
  }
};

/**
 * PUT /profile/avatar
 */
exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    if (!req.file) {
      return res.status(400).json({
        message: "Nenhum arquivo enviado",
      });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    console.log('📸 Salvando avatar:', avatarPath);

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { avatarUrl: avatarPath },
      create: {
        userId,
        name: req.user.name || "Usuário",
        plan: req.user.plan || "free",
        avatarUrl: avatarPath,
        isAdmin: req.user.isAdmin || false,
        role: req.user.role || "user",
      },
    });

    console.log('✅ Avatar salvo:', profile);

    const response = {
      id: profile.id,
      userId: profile.userId,
      name: req.user.name,
      email: req.user.email,
      plan: req.user.plan,
      avatarUrl: `http://localhost:5000${avatarPath}?v=${Date.now()}`,
      isAdmin: req.user.isAdmin || false,
      role: req.user.role || "user",
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao atualizar avatar",
    });
  }
};

/**
 * DELETE /profile/avatar
 */
exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.avatarUrl) {
      return res.status(404).json({
        message: "Nenhum avatar encontrado",
      });
    }

    const filePath = path.join(__dirname, "..", "..", profile.avatarUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Arquivo deletado:", filePath);
    }

    await prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl: null },
    });

    return res.json({
      message: "Avatar removido com sucesso",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao remover avatar",
    });
  }
};

/**
 * GET /preferences
 * Busca preferências do usuário
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    console.log('🔍 GET /preferences - userId:', userId);

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Criar preferências padrão
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          theme: "dark",
          language: "pt-BR",
          emailNotifications: true,
          pushNotifications: true,
        },
      });
      console.log('✅ Preferências criadas:', preferences);
    }

    return res.json({
      theme: preferences.theme,
      language: preferences.language,
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar preferências:', error);
    return res.status(500).json({
      error: "Erro ao buscar preferências",
    });
  }
};

/**
 * PUT /preferences
 * Atualiza preferências do usuário
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { theme, language, emailNotifications, pushNotifications } = req.body;

    console.log('🔄 PUT /preferences - userId:', userId);
    console.log('📝 Dados recebidos:', req.body);

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        theme: theme || "dark",
        language: language || "pt-BR",
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      },
      create: {
        userId,
        theme: theme || "dark",
        language: language || "pt-BR",
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      },
    });

    console.log('✅ Preferências salvas:', preferences);

    return res.json({
      theme: preferences.theme,
      language: preferences.language,
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      message: "Preferências salvas com sucesso",
    });
  } catch (error) {
    console.error('❌ Erro ao salvar preferências:', error);
    return res.status(500).json({
      error: "Erro ao salvar preferências",
    });
  }
};

/**
 * PUT /profile/password
 * Altera senha do usuário
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 PUT /profile/password - userId:', userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Senha atual e nova senha são obrigatórias",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "A nova senha deve ter no mínimo 6 caracteres",
      });
    }

    // Buscar usuário no MongoDB
    const User = require("../models/User");
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Verificar senha atual
    const bcrypt = require("bcrypt");
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Senha atual incorreta",
      });
    }

    // Hashear nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Senha alterada com sucesso');

    return res.json({
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    return res.status(500).json({
      error: "Erro ao alterar senha",
    });
  }
};