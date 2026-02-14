const { prisma } = require('../lib/prisma');
const woocommerceService = require('../services/woocommerce.service');
const crypto = require('crypto');

/**
 * 🛒 WOOCOMMERCE CONTROLLER
 */

/**
 * POST /woocommerce/connect
 */
exports.connectStore = async (req, res) => {
  try {
    const { storeUrl, consumerKey, consumerSecret } = req.body;
    const userId = req.user._id.toString();
    const plan = req.user.plan;

    if (plan !== 'business') {
      return res.status(403).json({
        message: 'Integrações E-commerce são exclusivas do plano Business',
        upgrade: true
      });
    }

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return res.status(400).json({
        message: 'URL da loja, Consumer Key e Consumer Secret são obrigatórios'
      });
    }

    const cleanUrl = storeUrl.replace(/\/$/, '');

    console.log(`🔍 Validando loja WooCommerce: ${cleanUrl}`);
    const validation = await woocommerceService.validateCredentials(cleanUrl, consumerKey, consumerSecret);

    if (!validation.valid) {
      return res.status(400).json({
        message: 'Credenciais inválidas',
        error: validation.error
      });
    }

    const encryptedKey = encryptToken(consumerKey);
    const encryptedSecret = encryptToken(consumerSecret);

    const existing = await prisma.storeIntegration.findFirst({
      where: {
        userId,
        platform: 'woocommerce',
        storeUrl: cleanUrl
      }
    });

    let integration;
    if (existing) {
      integration = await prisma.storeIntegration.update({
        where: { id: existing.id },
        data: {
          apiKey: encryptedKey,
          apiSecret: encryptedSecret,
          isActive: true,
          lastSync: new Date()
        }
      });
    } else {
      integration = await prisma.storeIntegration.create({
        data: {
          userId,
          platform: 'woocommerce',
          storeName: cleanUrl.replace(/^https?:\/\//, ''),
          storeUrl: cleanUrl,
          apiKey: encryptedKey,
          apiSecret: encryptedSecret,
          isActive: true,
          lastSync: new Date()
        }
      });
    }

    console.log(`✅ Loja WooCommerce conectada: ${integration.storeName}`);

    return res.status(201).json({
      message: 'Loja WooCommerce conectada com sucesso!',
      integration: {
        id: integration.id,
        storeName: integration.storeName,
        storeUrl: integration.storeUrl,
        platform: 'woocommerce'
      },
      shop: validation.shop
    });

  } catch (error) {
    console.error('❌ Erro ao conectar WooCommerce:', error);
    return res.status(500).json({
      message: 'Erro ao conectar loja WooCommerce'
    });
  }
};

/**
 * GET /woocommerce/integrations
 */
exports.listIntegrations = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const integrations = await prisma.storeIntegration.findMany({
      where: {
        userId,
        platform: 'woocommerce'
      },
      include: {
        products: {
          take: 5,
          orderBy: { lastSynced: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      integrations: integrations.map(int => ({
        id: int.id,
        storeName: int.storeName,
        storeUrl: int.storeUrl,
        isActive: int.isActive,
        lastSync: int.lastSync,
        productCount: int.products.length,
        createdAt: int.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao listar integrações:', error);
    return res.status(500).json({ message: 'Erro ao listar integrações' });
  }
};

/**
 * POST /woocommerce/:integrationId/sync
 */
exports.syncProducts = async (req, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user._id.toString();

    const integration = await prisma.storeIntegration.findFirst({
      where: { id: integrationId, userId }
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const consumerKey = decryptToken(integration.apiKey);
    const consumerSecret = decryptToken(integration.apiSecret);

    console.log(`🔄 Sincronizando produtos de ${integration.storeName}...`);
    const result = await woocommerceService.listProducts(
      integration.storeUrl,
      consumerKey,
      consumerSecret,
      { perPage: 50 }
    );

    if (!result.success) {
      return res.status(400).json({
        message: 'Erro ao sincronizar produtos',
        error: result.error
      });
    }

    let syncedCount = 0;
    for (const product of result.products) {
      const existing = await prisma.syncedProduct.findFirst({
        where: {
          integrationId: integration.id,
          externalId: product.id
        }
      });

      if (existing) {
        await prisma.syncedProduct.update({
          where: { id: existing.id },
          data: {
            productName: product.name,
            currentPrice: product.price,
            lastSynced: new Date(),
            imageUrl: product.imageUrl,
            productUrl: product.permalink
          }
        });
      } else {
        await prisma.syncedProduct.create({
          data: {
            integrationId: integration.id,
            externalId: product.id,
            productName: product.name,
            sku: product.sku,
            currentPrice: product.price,
            lastSynced: new Date(),
            imageUrl: product.imageUrl,
            productUrl: product.permalink
          }
        });
      }
      syncedCount++;
    }

    await prisma.storeIntegration.update({
      where: { id: integration.id },
      data: { lastSync: new Date() }
    });

    console.log(`✅ ${syncedCount} produtos sincronizados`);

    return res.json({
      message: 'Produtos sincronizados com sucesso!',
      totalSynced: syncedCount
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar produtos:', error);
    return res.status(500).json({ message: 'Erro ao sincronizar produtos' });
  }
};

/**
 * GET /woocommerce/:integrationId/products
 */
exports.listProducts = async (req, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user._id.toString();

    const integration = await prisma.storeIntegration.findFirst({
      where: { id: integrationId, userId }
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    const products = await prisma.syncedProduct.findMany({
      where: { integrationId: integration.id },
      orderBy: { lastSynced: 'desc' }
    });

    return res.json({
      products: products.map(p => ({
        id: p.id,
        externalId: p.externalId,
        name: p.productName,
        sku: p.sku,
        currentPrice: p.currentPrice,
        suggestedPrice: p.suggestedPrice,
        autoUpdate: p.autoUpdate,
        lastSynced: p.lastSynced,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao listar produtos:', error);
    return res.status(500).json({ message: 'Erro ao listar produtos' });
  }
};

/**
 * PUT /woocommerce/products/:productId/update-price
 */
exports.updateProductPrice = async (req, res) => {
  try {
    const { productId } = req.params;
    const { newPrice } = req.body;
    const userId = req.user._id.toString();

    const product = await prisma.syncedProduct.findFirst({
      where: { id: productId },
      include: { integration: true }
    });

    if (!product || product.integration.userId !== userId) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const consumerKey = decryptToken(product.integration.apiKey);
    const consumerSecret = decryptToken(product.integration.apiSecret);

    const result = await woocommerceService.updatePrice(
      product.integration.storeUrl,
      consumerKey,
      consumerSecret,
      product.externalId,
      newPrice
    );

    if (!result.success) {
      return res.status(400).json({
        message: 'Erro ao atualizar preço',
        error: result.error
      });
    }

    const updated = await prisma.syncedProduct.update({
      where: { id: productId },
      data: {
        currentPrice: newPrice,
        lastSynced: new Date()
      }
    });

    await prisma.syncLog.create({
      data: {
        productId: product.id,
        action: 'update',
        oldPrice: product.currentPrice,
        newPrice: newPrice,
        status: 'success'
      }
    });

    console.log(`✅ Preço atualizado: ${product.productName} → R$ ${newPrice}`);

    return res.json({
      message: 'Preço atualizado com sucesso!',
      product: {
        id: updated.id,
        name: updated.productName,
        oldPrice: product.currentPrice,
        newPrice: updated.currentPrice
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar preço:', error);
    return res.status(500).json({ message: 'Erro ao atualizar preço' });
  }
};

/**
 * DELETE /woocommerce/:integrationId
 */
exports.disconnectStore = async (req, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user._id.toString();

    const integration = await prisma.storeIntegration.findFirst({
      where: { id: integrationId, userId }
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    await prisma.storeIntegration.delete({
      where: { id: integrationId }
    });

    console.log(`✅ Loja WooCommerce desconectada: ${integration.storeName}`);

    return res.json({ message: 'Loja desconectada com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao desconectar loja:', error);
    return res.status(500).json({ message: 'Erro ao desconectar loja' });
  }
};

// HELPERS
function encryptToken(token) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!!', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!!', 'utf8').slice(0, 32);
  
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}