const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  analyzePDF,
  analyzeLink,
  analyzeImage,
  calculateProfit,
  comparePrice,
  simulateScenarios,
  chatAssistant,
  getChatHistory,
  upload
} = require('../controllers/premium.controller');

const router = express.Router();

// ====================================
// FERRAMENTAS PRO
// ====================================

// 📄 Análise por PDF
router.post('/analyze-pdf', authMiddleware, upload.single('pdf'), analyzePDF);

// 🔗 Análise por Link
router.post('/analyze-link', authMiddleware, analyzeLink);

// 📸 Análise por Imagem
router.post('/analyze-image', authMiddleware, upload.single('image'), analyzeImage);

// 💰 Calculadora de Lucro
router.post('/calculate-profit', authMiddleware, calculateProfit);

// ====================================
// 🆕 FERRAMENTAS BUSINESS
// ====================================

// 🎯 Comparador de Preços
router.post('/compare-price', authMiddleware, comparePrice);

// 📊 Simulador de Cenários
router.post('/simulate-scenarios', authMiddleware, simulateScenarios);

// 🤖 Assistente IA Chat
router.post('/chat-assistant', authMiddleware, chatAssistant);
router.get('/chat-history', authMiddleware, getChatHistory);

module.exports = router;