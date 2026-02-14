const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const planMiddleware = require('../middlewares/planMiddleware');
const { calculateROI } = require('../controllers/trafficRoiController');

const router = express.Router();

/**
 * POST /api/traffic-roi/calculate
 * Calcular ROI de tráfego pago com análise de IA
 * Requer: autenticação + plano Business
 */
router.post(
  '/calculate',
  authMiddleware,
  planMiddleware,
  calculateROI
);

module.exports = router;