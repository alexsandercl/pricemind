const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const shopifyController = require('../controllers/shopifyController');

/**
 * 🛍️ SHOPIFY ROUTES
 */

// Conectar loja
router.post('/connect', authenticate, shopifyController.connectStore);

// Listar integrações
router.get('/integrations', authenticate, shopifyController.listIntegrations);

// Sincronizar produtos
router.post('/:integrationId/sync', authenticate, shopifyController.syncProducts);

// Listar produtos sincronizados
router.get('/:integrationId/products', authenticate, shopifyController.listProducts);

// Atualizar preço de produto
router.put('/products/:productId/update-price', authenticate, shopifyController.updateProductPrice);

// Desconectar loja
router.delete('/:integrationId', authenticate, shopifyController.disconnectStore);

module.exports = router;