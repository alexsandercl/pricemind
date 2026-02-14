const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas existentes
router.post('/register', authController.register);
router.post('/login', authController.login);

// 🔥 NOVAS ROTAS DE RECUPERAÇÃO DE SENHA
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;