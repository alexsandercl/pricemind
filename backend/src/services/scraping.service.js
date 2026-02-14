const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 🌐 TESTAR SE URL É ACESSÍVEL
 */
async function testUrl(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * 🕷️ EXTRAIR PREÇO DE TEXTO
 */
function extractPriceFromText(text) {
  if (!text) return null;

  text = text.replace(/\s+/g, ' ').trim();

  const patterns = [
    /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
    /(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    /(\d+,\d{2})/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      let priceStr = matches[1] || matches[0];
      priceStr = priceStr.replace(/R\$\s*/gi, '');
      
      if (priceStr.includes(',')) {
        priceStr = priceStr.replace(/\./g, '').replace(',', '.');
      }
      
      const price = parseFloat(priceStr);
      
      if (!isNaN(price) && price > 0.01 && price < 1000000) {
        return price;
      }
    }
  }

  return null;
}

/**
 * 🔍 SCRAPING DE PREÇO MELHORADO
 * Prioriza preço à vista sobre parcelas
 */
async function scrapePrice(url) {
  try {
    console.log(`🔍 Scraping: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const foundPrices = [];

    // ESTRATÉGIA 1: Meta tags de produto
    const ogPrice = $('meta[property="product:price:amount"]').attr('content');
    if (ogPrice) {
      const price = parseFloat(ogPrice);
      if (!isNaN(price) && price > 0) {
        foundPrices.push({ source: 'meta-og', price, priority: 10 });
      }
    }

    // ESTRATÉGIA 2: Buscar "à vista" ou "vista" com preço próximo
    const bodyText = $('body').html() || '';
    
    // Procurar padrões de preço à vista
    const vistaPatterns = [
      /(?:à vista|vista|avista).*?R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/gi,
      /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})).*?(?:à vista|vista|avista)/gi,
    ];

    for (const pattern of vistaPatterns) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(bodyText)) !== null) {
        const price = extractPriceFromText(match[1]);
        if (price && price > 10) { // Preço à vista geralmente > R$ 10
          foundPrices.push({ source: 'vista-text', price, priority: 9 });
        }
      }
    }

    // ESTRATÉGIA 3: Seletores CSS comuns
    const priceSelectors = [
      '.price',
      '.product-price',
      '.sale-price',
      '.current-price',
      '[data-price]',
      '.price-tag',
      '.valor',
      '.preco',
      '#price',
      '#preco',
      '.final-price',
      '.total-price'
    ];

    for (const selector of priceSelectors) {
      $(selector).each((i, element) => {
        const text = $(element).text().trim();
        const dataPrice = $(element).attr('data-price');

        if (dataPrice) {
          const price = parseFloat(dataPrice);
          if (!isNaN(price) && price > 0) {
            foundPrices.push({ source: selector, price, priority: 7 });
          }
        }

        if (text) {
          const price = extractPriceFromText(text);
          if (price !== null) {
            // Se contém "vista", prioridade maior
            const hasVista = text.toLowerCase().includes('vista');
            foundPrices.push({ 
              source: selector, 
              price, 
              priority: hasVista ? 8 : 6 
            });
          }
        }
      });
    }

    // ESTRATÉGIA 4: Buscar todos os preços no body (baixa prioridade)
    const allPricesPattern = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2}))/gi;
    let match;
    while ((match = allPricesPattern.exec(bodyText)) !== null) {
      const price = extractPriceFromText(match[1]);
      if (price && price > 1 && price < 100000) {
        foundPrices.push({ source: 'body-text', price, priority: 3 });
      }
    }

    if (foundPrices.length === 0) {
      console.log('❌ Nenhum preço encontrado');
      return null;
    }

    // Remover duplicatas exatas
    const uniquePrices = foundPrices.reduce((acc, curr) => {
      const existing = acc.find(p => Math.abs(p.price - curr.price) < 0.01);
      if (!existing) {
        acc.push(curr);
      } else if (curr.priority > existing.priority) {
        // Substituir por maior prioridade
        const idx = acc.indexOf(existing);
        acc[idx] = curr;
      }
      return acc;
    }, []);

    // Ordenar por prioridade (maior primeiro)
    uniquePrices.sort((a, b) => b.priority - a.priority);

    console.log(`💰 Preços encontrados (ordenados por prioridade):`);
    uniquePrices.slice(0, 5).forEach(p => {
      console.log(`   ${p.source}: R$ ${p.price.toFixed(2)} (prioridade: ${p.priority})`);
    });

    // Retornar o preço com maior prioridade
    const selectedPrice = uniquePrices[0].price;
    
    console.log(`✅ Preço selecionado: R$ ${selectedPrice.toFixed(2)} (fonte: ${uniquePrices[0].source})`);
    
    return selectedPrice;

  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.error('❌ URL não encontrada:', error.message);
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Timeout ao acessar URL');
    } else {
      console.error('❌ Erro no scraping:', error.message);
    }
    return null;
  }
}

module.exports = {
  scrapePrice,
  testUrl,
  extractPriceFromText
};