const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const woocommerceController = require('../controllers/woocommerceController');

/**
 * 🛒 WOOCOMMERCE ROUTES
 */

// Conectar loja
router.post('/connect', authenticate, woocommerceController.connectStore);

// Listar integrações
router.get('/integrations', authenticate, woocommerceController.listIntegrations);

// Sincronizar produtos
router.post('/:integrationId/sync', authenticate, woocommerceController.syncProducts);

// Listar produtos sincronizados
router.get('/:integrationId/products', authenticate, woocommerceController.listProducts);

// Atualizar preço de produto
router.put('/products/:productId/update-price', authenticate, woocommerceController.updateProductPrice);

// Desconectar loja
router.delete('/:integrationId', authenticate, woocommerceController.disconnectStore);

module.exports = router;