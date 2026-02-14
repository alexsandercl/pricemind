const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  uploadAndProcess,
  getBatchStatus,
  exportBatchResults,
  listBatches,
  deleteBatch
} = require('../controllers/batch.controller');

const router = express.Router();

// Configurar multer para upload de CSV
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'));
    }
  }
});

// 📥 Upload e processar CSV
router.post('/upload', authMiddleware, upload.single('file'), uploadAndProcess);

// 📊 Status do batch
router.get('/:batchId/status', authMiddleware, getBatchStatus);

// 📥 Exportar resultados em Excel
router.get('/:batchId/export', authMiddleware, exportBatchResults);

// 📋 Listar batches do usuário
router.get('/list', authMiddleware, listBatches);

// 🗑️ Deletar batch
router.delete('/:batchId', authMiddleware, deleteBatch);

module.exports = router;