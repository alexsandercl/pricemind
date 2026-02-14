const axios = require('axios');

/**
 * 🛒 WOOCOMMERCE SERVICE
 * Integração completa com WooCommerce REST API
 */

class WooCommerceService {
  /**
   * Criar cliente WooCommerce
   */
  createClient(storeUrl, consumerKey, consumerSecret) {
    const baseURL = `${storeUrl}/wp-json/wc/v3`;
    
    return axios.create({
      baseURL,
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      timeout: 30000
    });
  }

  /**
   * Validar credenciais da loja
   */
  async validateCredentials(storeUrl, consumerKey, consumerSecret) {
    try {
      const client = this.createClient(storeUrl, consumerKey, consumerSecret);
      const response = await client.get('/system_status');
      
      return {
        valid: true,
        shop: {
          url: storeUrl,
          version: response.data.environment?.version,
          currency: response.data.settings?.currency,
          timezone: response.data.settings?.timezone
        }
      };
    } catch (error) {
      console.error('❌ Erro ao validar WooCommerce:', error.response?.data || error.message);
      return {
        valid: false,
        error: error.response?.data?.message || 'Credenciais inválidas'
      };
    }
  }

  /**
   * Listar produtos da loja
   */
  async listProducts(storeUrl, consumerKey, consumerSecret, { perPage = 50, page = 1 } = {}) {
    try {
      const client = this.createClient(storeUrl, consumerKey, consumerSecret);
      const response = await client.get('/products', {
        params: {
          per_page: perPage,
          page,
          status: 'publish'
        }
      });

      return {
        success: true,
        products: response.data.map(product => ({
          id: product.id.toString(),
          name: product.name,
          slug: product.slug,
          type: product.type,
          price: parseFloat(product.price),
          regularPrice: parseFloat(product.regular_price),
          salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
          sku: product.sku,
          stockQuantity: product.stock_quantity,
          stockStatus: product.stock_status,
          imageUrl: product.images?.[0]?.src,
          permalink: product.permalink,
          status: product.status,
          variations: product.type === 'variable' ? product.variations : [],
          createdAt: product.date_created,
          updatedAt: product.date_modified
        })),
        total: parseInt(response.headers['x-wp-total']),
        totalPages: parseInt(response.headers['x-wp-totalpages'])
      };
    } catch (error) {
      console.error('❌ Erro ao listar produtos WooCommerce:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao listar produtos'
      };
    }
  }

  /**
   * Atualizar preço de um produto
   */
  async updatePrice(storeUrl, consumerKey, consumerSecret, productId, newPrice) {
    try {
      const client = this.createClient(storeUrl, consumerKey, consumerSecret);
      
      const response = await client.put(`/products/${productId}`, {
        regular_price: newPrice.toFixed(2)
      });

      console.log(`✅ Preço atualizado no WooCommerce: Product ${productId} → R$ ${newPrice}`);

      return {
        success: true,
        product: {
          id: response.data.id.toString(),
          price: parseFloat(response.data.price),
          regularPrice: parseFloat(response.data.regular_price),
          updatedAt: response.data.date_modified
        }
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar preço WooCommerce:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao atualizar preço'
      };
    }
  }
}

module.exports = new WooCommerceService();