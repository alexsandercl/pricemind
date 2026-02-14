const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getStats,
  getUsage,
  getDashboardStats,
  getAnalysisHistory,
  getAnalysisById,      // 🔥 NOVO
  deleteAnalysis        // 🔥 NOVO
} = require("../controllers/stats.controller");

const router = express.Router();

router.get("/", authMiddleware, getStats);
router.get("/usage", authMiddleware, getUsage);
router.get("/dashboard", authMiddleware, getDashboardStats);
router.get("/history", authMiddleware, getAnalysisHistory);

// 🔥 NOVAS ROTAS
router.get("/analysis/:id", authMiddleware, getAnalysisById);
router.delete("/analysis/:id", authMiddleware, deleteAnalysis);

module.exports = router;