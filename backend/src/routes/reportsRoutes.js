const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  generateAnalysisPDF,
  generateHistoryExcel,
  generateComparisonPDF,
  generateSimulationPDF,
  generateExecutiveDashboard
} = require('../controllers/reports.controller');

const router = express.Router();

// 📄 PDF de análise individual
router.post('/analysis-pdf', authMiddleware, generateAnalysisPDF);

// 📊 Excel com histórico completo
router.get('/history-excel', authMiddleware, generateHistoryExcel);

// 📄 PDF de comparação de preços
router.post('/comparison-pdf', authMiddleware, generateComparisonPDF);

// 📄 PDF de simulação de cenários
router.post('/simulation-pdf', authMiddleware, generateSimulationPDF);

// 📊 Dashboard executivo (resumo mensal)
router.get('/executive-dashboard', authMiddleware, generateExecutiveDashboard);

module.exports = router;