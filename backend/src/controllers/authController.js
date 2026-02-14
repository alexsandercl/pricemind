const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validatePasswordStrength } = require('../utils/passwordValidator');
const { PrismaClient } = require('@prisma/client');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../config/emailConfig');

const prisma = new PrismaClient();

/**
 * POST /auth/register
 */
exports.register = async (req, res) => {
  try {
    console.log('🔥 Requisição recebida:', req.body);

    const { 
      name, 
      email, 
      password, 
      confirmPassword,
      phone,
      country,
      termsAccepted,
      privacyAccepted,
      marketingAccepted
    } = req.body;

    console.log('✅ Dados extraídos:', { 
      name, 
      email, 
      password: password ? '***' : undefined, 
      confirmPassword: confirmPassword ? '***' : undefined,
      termsAccepted,
      privacyAccepted
    });

    if (!name || !email || !password || !confirmPassword) {
      console.log('❌ Campos obrigatórios faltando');
      return res.status(400).json({
        message: 'Preencha todos os campos obrigatórios'
      });
    }

    if (password !== confirmPassword) {
      console.log('❌ Senhas não coincidem');
      return res.status(400).json({
        message: 'As senhas não coincidem'
      });
    }

    console.log('🔍 Iniciando validação de senha...');
    const passwordValidation = validatePasswordStrength(password);
    console.log('🔍 Resultado validação:', passwordValidation);

    if (!passwordValidation.isValid) {
      console.log('❌ Senha inválida:', passwordValidation.errors);
      return res.status(400).json({
        message: 'Senha fraca',
        errors: passwordValidation.errors
      });
    }

    if (!termsAccepted || !privacyAccepted) {
      console.log('❌ Termos não aceitos');
      return res.status(400).json({
        message: 'Você deve aceitar os Termos de Uso e a Política de Privacidade'
      });
    }

    console.log('🔍 Verificando se email já existe...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Email já cadastrado');
      return res.status(400).json({
        message: 'Email já cadastrado'
      });
    }

    console.log('🔍 Gerando hash da senha...');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    console.log('💾 Criando usuário no MongoDB...');
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      country: country || 'BR',
      termsAccepted,
      privacyAccepted,
      marketingAccepted: marketingAccepted || false
    });

    await user.save();
    console.log('✅ Usuário salvo no MongoDB!');

    // 🔥 CRIAR PROFILE NO POSTGRESQL
    try {
      console.log('💾 Criando profile no PostgreSQL...');
      
      await prisma.userProfile.create({
        data: {
          userId: user._id.toString(),
          name: user.name,
          plan: 'free'
        }
      });

      await prisma.userStats.create({
        data: {
          userId: user._id.toString(),
          totalRequests: 0,
          monthlyRequests: 0,
          lastAccessAt: new Date(),
          lastResetAt: new Date()
        }
      });

      await prisma.userPreferences.create({
        data: {
          userId: user._id.toString(),
          theme: 'dark',
          language: 'pt-BR'
        }
      });

      console.log('✅ Profile, Stats e Preferences criados no PostgreSQL!');
    } catch (pgError) {
      console.error('⚠️ Erro ao criar profile no PostgreSQL:', pgError);
      // Não bloqueia o cadastro
    }

    // 🔥 ENVIAR EMAIL DE BOAS-VINDAS
    try {
      console.log('📧 Enviando email de boas-vindas...');
      await sendWelcomeEmail(user.email, user.name);
      console.log('✅ Email de boas-vindas enviado!');
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email (não crítico):', emailError.message);
      // Não bloqueia o cadastro se o email falhar
    }

    // 🔥 CORRIGIDO: Gerar token com "id" (não "userId")
    const token = jwt.sign(
      { id: user._id },  // ✅ CORRETO
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token gerado, retornando resposta');

    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('❌❌❌ ERRO NO REGISTRO:', error);
    return res.status(500).json({
      message: 'Erro ao criar conta',
      error: error.message
    });
  }
};

/**
 * POST /auth/login
 * 🔥 CORRIGIDO: Token com "id"
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha são obrigatórios'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Email ou senha inválidos'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Email ou senha inválidos'
      });
    }

    // 🔥 CORRIGIDO: Token com "id" (não "userId")
    const token = jwt.sign(
      { id: user._id },  // ✅ CORRETO
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      message: 'Erro ao fazer login'
    });
  }
};

/**
 * 🔥 POST /auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email é obrigatório'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({
        message: 'Se o email existir, você receberá instruções para recuperação'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      console.log('✅ Email de recuperação enviado');
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      return res.status(500).json({
        message: 'Erro ao enviar email de recuperação'
      });
    }

    return res.json({
      message: 'Email de recuperação enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro em forgot-password:', error);
    return res.status(500).json({
      message: 'Erro ao processar solicitação'
    });
  }
};

/**
 * 🔥 POST /auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Token e nova senha são obrigatórios'
      });
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'Senha fraca',
        errors: passwordValidation.errors
      });
    }

    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token inválido ou expirado'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({
      message: 'Senha redefinida com sucesso'
    });

  } catch (error) {
    console.error('Erro em reset-password:', error);
    return res.status(500).json({
      message: 'Erro ao redefinir senha'
    });
  }
};