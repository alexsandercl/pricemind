const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const monitorController = require('../controllers/Monitor.controller');

// 📋 Criar monitoramento
router.post('/', authMiddleware, monitorController.createMonitor);

// 📊 Listar monitoramentos
router.get('/', authMiddleware, monitorController.listMonitors);

// 📈 Histórico de um monitor
router.get('/:monitorId/history', authMiddleware, monitorController.getMonitorHistory);

// 🔄 Atualizar preço manualmente
router.post('/:monitorId/refresh', authMiddleware, monitorController.refreshMonitor);

// ⏸️ Pausar/Ativar monitor
router.put('/:monitorId/toggle', authMiddleware, monitorController.toggleMonitor);

// ✏️ Editar preço manualmente
router.put('/:monitorId/edit-price', authMiddleware, monitorController.editPrice);

// 🗑️ Deletar monitor
router.delete('/:monitorId', authMiddleware, monitorController.deleteMonitor);

module.exports = router;