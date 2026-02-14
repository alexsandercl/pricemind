const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const planMiddleware = require('../middlewares/planMiddleware');
const { analyzePrice } = require('../controllers/aiController');

const router = express.Router();

router.post(
  '/analyze',
  authMiddleware,
  planMiddleware,
  analyzePrice
);

module.exports = router;
