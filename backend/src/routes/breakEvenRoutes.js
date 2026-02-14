const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { calculateBreakEven } = require('../controllers/breakEvenController');

const router = express.Router();

/**
 * POST /api/break-even/calculate
 * Calcular ponto de equilíbrio com análise de IA
 * Requer: autenticação + plano Pro ou Business
 */
router.post(
  '/calculate',
  authMiddleware,
  calculateBreakEven
);

module.exports = router;