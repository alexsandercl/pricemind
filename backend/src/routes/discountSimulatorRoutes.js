const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { simulateDiscount } = require('../controllers/discountSimulatorController');

const router = express.Router();

/**
 * POST /api/discount-simulator/simulate
 * Simular impacto de descontos com análise de IA
 * Requer: autenticação + plano Pro ou Business
 */
router.post(
  '/simulate',
  authMiddleware,
  simulateDiscount
);

module.exports = router;