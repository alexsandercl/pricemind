const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const ceoMiddleware = require('../middlewares/ceoMiddleware');
const {
  getDashboard,
  getUsers,
  getUserDetails,
  updateUserPlan,
  toggleAdmin,
  deleteUser,
  getDetailedStats,
  getAdminLogs,
  getCEOMetrics  // 👑 NOVO
} = require('../controllers/admin.controller');

const router = express.Router();

// Todas as rotas exigem autenticação + admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard (Admin e CEO)
router.get('/dashboard', getDashboard);

// Estatísticas (Admin e CEO)
router.get('/stats', getDetailedStats);

// Gestão de usuários (Admin e CEO)
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/plan', updateUserPlan);
router.delete('/users/:id', deleteUser);

// 🔥 ROTAS APENAS PARA CEO
router.put('/users/:id/admin', toggleAdmin);  // Promover/remover admin
router.get('/logs', ceoMiddleware, getAdminLogs);  // Ver logs

// 👑 DASHBOARD CEO - MÉTRICAS COMPLETAS
router.get('/ceo-metrics', ceoMiddleware, getCEOMetrics);

module.exports = router;