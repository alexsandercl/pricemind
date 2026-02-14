const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requirePlan } = require("../middleware/checkPlan");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ============================================
// LISTAR INTEGRAÇÕES DO USUÁRIO
// ============================================
router.get("/", auth, async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(integrations);
  } catch (error) {
    console.error("Erro ao buscar integrações:", error);
    res.status(500).json({ error: "Erro ao buscar integrações" });
  }
});

// ============================================
// CONECTAR SHOPIFY
// ============================================
router.post("/shopify/connect", auth, requirePlan("business"), async (req, res) => {
  try {
    const { shopDomain, apiKey, apiPassword } = req.body;

    if (!shopDomain || !apiKey || !apiPassword) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // Verificar se já existe integração ativa
    const existing = await prisma.integration.findFirst({
      where: {
        userId: req.user.userId,
        platform: "shopify",
        status: "active",
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Já existe uma integração Shopify ativa" });
    }

    // Validar credenciais fazendo uma requisição de teste
    const testUrl = `https://${shopDomain}/admin/api/2024-01/products.json?limit=1`;
    const testResponse = await fetch(testUrl, {
      headers: {
        "X-Shopify-Access-Token": apiPassword,
      },
    });

    if (!testResponse.ok) {
      return res.status(400).json({ error: "Credenciais inválidas" });
    }

    // Criar integração
    const integration = await prisma.integration.create({
      data: {
        userId: req.user.userId,
        platform: "shopify",
        shopDomain,
        apiKey,
        apiPassword, // Em produção, criptografar!
        status: "active",
      },
    });

    // Registrar atividade
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        type: "integration_connected",
        description: `Conectou Shopify: ${shopDomain}`,
      },
    });

    res.json({
      message: "Shopify conectado com sucesso!",
      integration: {
        id: integration.id,
        platform: integration.platform,
        shopDomain: integration.shopDomain,
        status: integration.status,
      },
    });
  } catch (error) {
    console.error("Erro ao conectar Shopify:", error);
    res.status(500).json({ error: "Erro ao conectar Shopify" });
  }
});

// ============================================
// CONECTAR WOOCOMMERCE
// ============================================
router.post("/woocommerce/connect", auth, requirePlan("business"), async (req, res) => {
  try {
    const { storeDomain, consumerKey, consumerSecret } = req.body;

    if (!storeDomain || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // Verificar se já existe integração ativa
    const existing = await prisma.integration.findFirst({
      where: {
        userId: req.user.userId,
        platform: "woocommerce",
        status: "active",
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Já existe uma integração WooCommerce ativa" });
    }

    // Validar credenciais
    const testUrl = `${storeDomain}/wp-json/wc/v3/products?per_page=1`;
    const testResponse = await fetch(testUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
      },
    });

    if (!testResponse.ok) {
      return res.status(400).json({ error: "Credenciais inválidas" });
    }

    // Criar integração
    const integration = await prisma.integration.create({
      data: {
        userId: req.user.userId,
        platform: "woocommerce",
        shopDomain: storeDomain,
        apiKey: consumerKey,
        apiPassword: consumerSecret, // Em produção, criptografar!
        status: "active",
      },
    });

    // Registrar atividade
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        type: "integration_connected",
        description: `Conectou WooCommerce: ${storeDomain}`,
      },
    });

    res.json({
      message: "WooCommerce conectado com sucesso!",
      integration: {
        id: integration.id,
        platform: integration.platform,
        shopDomain: integration.shopDomain,
        status: integration.status,
      },
    });
  } catch (error) {
    console.error("Erro ao conectar WooCommerce:", error);
    res.status(500).json({ error: "Erro ao conectar WooCommerce" });
  }
});

// ============================================
// IMPORTAR PRODUTOS (SHOPIFY)
// ============================================
router.post("/shopify/:id/import", auth, requirePlan("business"), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar integração
    const integration = await prisma.integration.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
        platform: "shopify",
        status: "active",
      },
    });

    if (!integration) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }

    // Buscar produtos da Shopify
    const url = `https://${integration.shopDomain}/admin/api/2024-01/products.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": integration.apiPassword,
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: "Erro ao buscar produtos da Shopify" });
    }

    const data = await response.json();
    const products = data.products || [];

    // Salvar produtos no banco
    let imported = 0;
    for (const product of products) {
      await prisma.product.upsert({
        where: {
          externalId_platform: {
            externalId: product.id.toString(),
            platform: "shopify",
          },
        },
        update: {
          name: product.title,
          price: product.variants[0]?.price || "0",
          image: product.images[0]?.src || null,
        },
        create: {
          userId: req.user.userId,
          integrationId: integration.id,
          externalId: product.id.toString(),
          platform: "shopify",
          name: product.title,
          price: product.variants[0]?.price || "0",
          image: product.images[0]?.src || null,
        },
      });
      imported++;
    }

    res.json({
      message: `${imported} produtos importados com sucesso!`,
      total: products.length,
    });
  } catch (error) {
    console.error("Erro ao importar produtos:", error);
    res.status(500).json({ error: "Erro ao importar produtos" });
  }
});

// ============================================
// IMPORTAR PRODUTOS (WOOCOMMERCE)
// ============================================
router.post("/woocommerce/:id/import", auth, requirePlan("business"), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar integração
    const integration = await prisma.integration.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
        platform: "woocommerce",
        status: "active",
      },
    });

    if (!integration) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }

    // Buscar produtos do WooCommerce
    const url = `${integration.shopDomain}/wp-json/wc/v3/products?per_page=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${integration.apiKey}:${integration.apiPassword}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: "Erro ao buscar produtos do WooCommerce" });
    }

    const products = await response.json();

    // Salvar produtos no banco
    let imported = 0;
    for (const product of products) {
      await prisma.product.upsert({
        where: {
          externalId_platform: {
            externalId: product.id.toString(),
            platform: "woocommerce",
          },
        },
        update: {
          name: product.name,
          price: product.price || "0",
          image: product.images[0]?.src || null,
        },
        create: {
          userId: req.user.userId,
          integrationId: integration.id,
          externalId: product.id.toString(),
          platform: "woocommerce",
          name: product.name,
          price: product.price || "0",
          image: product.images[0]?.src || null,
        },
      });
      imported++;
    }

    res.json({
      message: `${imported} produtos importados com sucesso!`,
      total: products.length,
    });
  } catch (error) {
    console.error("Erro ao importar produtos:", error);
    res.status(500).json({ error: "Erro ao importar produtos" });
  }
});

// ============================================
// DESCONECTAR INTEGRAÇÃO
// ============================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
      },
    });

    if (!integration) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }

    // Deletar produtos relacionados
    await prisma.product.deleteMany({
      where: { integrationId: integration.id },
    });

    // Deletar integração
    await prisma.integration.delete({
      where: { id: integration.id },
    });

    // Registrar atividade
    await prisma.activity.create({
      data: {
        userId: req.user.userId,
        type: "integration_disconnected",
        description: `Desconectou ${integration.platform}: ${integration.shopDomain}`,
      },
    });

    res.json({ message: "Integração removida com sucesso!" });
  } catch (error) {
    console.error("Erro ao remover integração:", error);
    res.status(500).json({ error: "Erro ao remover integração" });
  }
});

// ============================================
// SINCRONIZAR PRODUTOS
// ============================================
router.post("/:id/sync", auth, requirePlan("business"), async (req, res) => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: {
        id: parseInt(id),
        userId: req.user.userId,
        status: "active",
      },
    });

    if (!integration) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }

    // Chamar rota de importação baseada na plataforma
    if (integration.platform === "shopify") {
      // Redirecionar para rota de importação Shopify
      return res.redirect(307, `/api/integrations/shopify/${id}/import`);
    } else if (integration.platform === "woocommerce") {
      // Redirecionar para rota de importação WooCommerce
      return res.redirect(307, `/api/integrations/woocommerce/${id}/import`);
    }

    res.status(400).json({ error: "Plataforma não suportada" });
  } catch (error) {
    console.error("Erro ao sincronizar:", error);
    res.status(500).json({ error: "Erro ao sincronizar produtos" });
  }
});

module.exports = router;