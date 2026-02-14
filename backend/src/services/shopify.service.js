const axios = require('axios');
const crypto = require('crypto');

/**
 * 🛍️ SHOPIFY SERVICE
 * Integração completa com Shopify API
 */

class ShopifyService {
  /**
   * Criar cliente Shopify
   */
  createClient(storeName, accessToken) {
    const baseURL = `https://${storeName}.myshopify.com/admin/api/2024-01`;
    
    return axios.create({
      baseURL,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Validar credenciais da loja
   */
  async validateCredentials(storeName, accessToken) {
    try {
      const client = this.createClient(storeName, accessToken);
      const response = await client.get('/shop.json');
      
      return {
        valid: true,
        shop: {
          id: response.data.shop.id,
          name: response.data.shop.name,
          email: response.data.shop.email,
          domain: response.data.shop.domain,
          currency: response.data.shop.currency,
          timezone: response.data.shop.timezone
        }
      };
    } catch (error) {
      console.error('❌ Erro ao validar Shopify:', error.response?.data || error.message);
      return {
        valid: false,
        error: error.response?.data?.errors || 'Credenciais inválidas'
      };
    }
  }

  /**
   * Listar produtos da loja
   */
  async listProducts(storeName, accessToken, { limit = 50, page = 1 } = {}) {
    try {
      const client = this.createClient(storeName, accessToken);
      const response = await client.get('/products.json', {
        params: {
          limit,
          page
        }
      });

      return {
        success: true,
        products: response.data.products.map(product => ({
          id: product.id.toString(),
          title: product.title,
          handle: product.handle,
          variants: product.variants.map(variant => ({
            id: variant.id.toString(),
            title: variant.title,
            price: parseFloat(variant.price),
            sku: variant.sku,
            inventoryQuantity: variant.inventory_quantity,
            imageUrl: product.images?.[0]?.src
          })),
          images: product.images?.map(img => img.src),
          status: product.status,
          createdAt: product.created_at,
          updatedAt: product.updated_at
        }))
      };
    } catch (error) {
      console.error('❌ Erro ao listar produtos Shopify:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Erro ao listar produtos'
      };
    }
  }

  /**
   * Atualizar preço de um produto (variant)
   */
  async updatePrice(storeName, accessToken, variantId, newPrice) {
    try {
      const client = this.createClient(storeName, accessToken);
      
      const response = await client.put(`/variants/${variantId}.json`, {
        variant: {
          id: variantId,
          price: newPrice.toFixed(2)
        }
      });

      console.log(`✅ Preço atualizado no Shopify: Variant ${variantId} → R$ ${newPrice}`);

      return {
        success: true,
        variant: {
          id: response.data.variant.id.toString(),
          price: parseFloat(response.data.variant.price),
          updatedAt: response.data.variant.updated_at
        }
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar preço Shopify:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Erro ao atualizar preço'
      };
    }
  }
}

module.exports = new ShopifyService();