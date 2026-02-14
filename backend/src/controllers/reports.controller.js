const ExcelJS = require('exceljs');
const { prisma } = require('../lib/prisma');
const puppeteer = require('puppeteer');

/**
 * 🎨 TEMPLATE HTML PROFISSIONAL
 */
function generateHTML(title, content) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      background: #ffffff;
    }
    
    .header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 40px 60px;
      color: white;
      margin-bottom: 40px;
    }
    
    .header h1 {
      font-size: 42px;
      font-weight: 700;
      color: #EAB308;
      margin-bottom: 10px;
    }
    
    .header h2 {
      font-size: 20px;
      font-weight: 400;
      color: #ffffff;
      margin-bottom: 5px;
    }
    
    .header .date {
      font-size: 14px;
      color: #999999;
    }
    
    .container {
      padding: 0 60px 60px;
      max-width: 800px;
    }
    
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #EAB308;
    }
    
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 25px;
      border-radius: 12px;
      border-left: 4px solid #EAB308;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .metric-label {
      font-size: 12px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .metric-value.green {
      color: #10B981;
    }
    
    .metric-value.blue {
      color: #3B82F6;
    }
    
    .metric-value.purple {
      color: #9333EA;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .info-label {
      font-weight: 600;
      color: #666666;
    }
    
    .info-value {
      color: #1a1a1a;
    }
    
    .info-value.price {
      font-size: 24px;
      font-weight: 700;
      color: #10B981;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-radius: 8px;
      overflow: hidden;
    }
    
    thead {
      background: #1a1a1a;
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    
    td {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    tbody tr:hover {
      background: #f8f9fa;
    }
    
    .analysis-text {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 12px;
      border-left: 4px solid #3B82F6;
      color: #333333;
      font-size: 14px;
      line-height: 1.8;
      text-align: justify;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
      text-align: center;
      color: #999999;
      font-size: 12px;
    }
    
    .list-item {
      background: white;
      padding: 15px 20px;
      margin-bottom: 10px;
      border-radius: 8px;
      border-left: 4px solid #EAB308;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .list-item-name {
      font-weight: 600;
      color: #1a1a1a;
      flex: 1;
    }
    
    .list-item-price {
      font-weight: 700;
      color: #10B981;
      margin: 0 20px;
    }
    
    .list-item-date {
      color: #666666;
      font-size: 13px;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `;
}

/**
 * 📄 GERAR PDF DE ANÁLISE INDIVIDUAL
 */
exports.generateAnalysisPDF = async (req, res) => {
  let browser;
  try {
    const { analysisId } = req.body;
    const userId = req.user._id.toString();

    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId }
    });

    if (!analysis) {
      return res.status(404).json({ message: 'Análise não encontrada' });
    }

    const content = `
      <div class="header">
        <h1>PriceMind</h1>
        <h2>Relatório de Análise de Preço</h2>
        <div class="date">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
      
      <div class="container">
        <div class="section">
          <h3 class="section-title">📦 Produto Analisado</h3>
          <div class="info-grid">
            <div class="info-label">Nome:</div>
            <div class="info-value">${analysis.productName}</div>
            
            <div class="info-label">Preço:</div>
            <div class="info-value price">R$ ${analysis.price.toFixed(2)}</div>
            
            <div class="info-label">Categoria:</div>
            <div class="info-value">${analysis.category || 'Não especificada'}</div>
            
            <div class="info-label">Data:</div>
            <div class="info-value">${new Date(analysis.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          
          ${analysis.description ? `
            <div style="margin-top: 20px;">
              <div class="info-label" style="margin-bottom: 10px;">Descrição:</div>
              <div class="info-value">${analysis.description}</div>
            </div>
          ` : ''}
        </div>
        
        <div class="section">
          <h3 class="section-title">🎯 Análise Estratégica</h3>
          <div class="analysis-text">
            ${analysis.aiResponse.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div class="footer">
          © ${new Date().getFullYear()} PriceMind - Relatório Confidencial
        </div>
      </div>
    `;

    const html = generateHTML('Análise de Preço', content);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=analise-${analysis.productName.replace(/\s+/g, '-')}.pdf`);
    res.send(pdf);

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Erro ao gerar PDF:', error);
    return res.status(500).json({ message: 'Erro ao gerar PDF' });
  }
};

/**
 * 📊 GERAR EXCEL COM HISTÓRICO COMPLETO
 */
exports.generateHistoryExcel = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const analyses = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (analyses.length === 0) {
      return res.status(404).json({ message: 'Nenhuma análise encontrada' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Histórico de Análises');

    sheet.columns = [
      { header: 'Data', key: 'date', width: 20 },
      { header: 'Produto', key: 'product', width: 30 },
      { header: 'Preço (R$)', key: 'price', width: 15 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Descrição', key: 'description', width: 40 },
      { header: 'Análise', key: 'analysis', width: 60 }
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAB308' }
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    analyses.forEach(analysis => {
      sheet.addRow({
        date: new Date(analysis.createdAt).toLocaleString('pt-BR'),
        product: analysis.productName,
        price: analysis.price,
        category: analysis.category || 'Não especificada',
        description: analysis.description || '-',
        analysis: analysis.aiResponse.substring(0, 500) + '...'
      });
    });

    const statsSheet = workbook.addWorksheet('Estatísticas');
    
    const totalAnalyses = analyses.length;
    const avgPrice = analyses.reduce((sum, a) => sum + a.price, 0) / totalAnalyses;
    const categories = [...new Set(analyses.map(a => a.category).filter(Boolean))];

    statsSheet.addRow(['Total de Análises', totalAnalyses]);
    statsSheet.addRow(['Preço Médio', `R$ ${avgPrice.toFixed(2)}`]);
    statsSheet.addRow(['Categorias', categories.length]);
    statsSheet.addRow(['Período', `${new Date(analyses[analyses.length - 1].createdAt).toLocaleDateString('pt-BR')} até ${new Date(analyses[0].createdAt).toLocaleDateString('pt-BR')}`]);

    statsSheet.getColumn(1).font = { bold: true };
    statsSheet.getColumn(1).width = 25;
    statsSheet.getColumn(2).width = 30;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=historico-pricemind-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Erro ao gerar Excel:', error);
    return res.status(500).json({ message: 'Erro ao gerar Excel' });
  }
};

/**
 * 📄 GERAR PDF DE COMPARAÇÃO
 */
exports.generateComparisonPDF = async (req, res) => {
  let browser;
  try {
    const { comparisonId } = req.body;
    const userId = req.user._id.toString();

    const comparison = await prisma.priceComparison.findFirst({
      where: { id: comparisonId, userId }
    });

    if (!comparison) {
      return res.status(404).json({ message: 'Comparação não encontrada' });
    }

    const competitorsRows = comparison.competitors.map((comp, idx) => {
      const diff = comp.price - comparison.myProduct.price;
      const diffPercent = (diff / comparison.myProduct.price) * 100;
      const diffColor = diff > 0 ? '#EF4444' : '#10B981';
      
      return `
        <tr>
          <td>${idx + 1}. ${comp.name}</td>
          <td style="font-weight: 600;">R$ ${comp.price.toFixed(2)}</td>
          <td style="color: ${diffColor}; font-weight: 600;">
            ${diff > 0 ? '+' : ''}R$ ${diff.toFixed(2)} (${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}%)
          </td>
        </tr>
      `;
    }).join('');

    const content = `
      <div class="header">
        <h1>PriceMind</h1>
        <h2>Comparação de Preços</h2>
        <div class="date">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
      
      <div class="container">
        <div class="section">
          <h3 class="section-title">🎯 Seu Produto</h3>
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-label">Nome</div>
              <div class="metric-value" style="font-size: 18px;">${comparison.myProduct.name}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Preço</div>
              <div class="metric-value green">R$ ${comparison.myProduct.price.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Posição</div>
              <div class="metric-value blue">Referência</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">🏢 Concorrentes</h3>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Diferença</th>
              </tr>
            </thead>
            <tbody>
              ${competitorsRows}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h3 class="section-title">📊 Análise Estratégica</h3>
          <div class="analysis-text">
            ${comparison.aiAnalysis.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div class="footer">
          © ${new Date().getFullYear()} PriceMind - Relatório Confidencial
        </div>
      </div>
    `;

    const html = generateHTML('Comparação de Preços', content);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comparacao-${Date.now()}.pdf`);
    res.send(pdf);

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Erro ao gerar PDF:', error);
    return res.status(500).json({ message: 'Erro ao gerar PDF' });
  }
};

/**
 * 📄 GERAR PDF DE SIMULAÇÃO
 */
exports.generateSimulationPDF = async (req, res) => {
  let browser;
  try {
    const { simulationId } = req.body;
    const userId = req.user._id.toString();

    const simulation = await prisma.priceSimulation.findFirst({
      where: { id: simulationId, userId }
    });

    if (!simulation) {
      return res.status(404).json({ message: 'Simulação não encontrada' });
    }

    const scenarios = simulation.scenarios;

    const content = `
      <div class="header">
        <h1>PriceMind</h1>
        <h2>Simulação de Cenários</h2>
        <div class="date">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
      
      <div class="container">
        <div class="section">
          <h3 class="section-title">📦 Produto Simulado</h3>
          <div class="info-grid">
            <div class="info-label">Nome:</div>
            <div class="info-value">${simulation.productName}</div>
            
            <div class="info-label">Preço Base:</div>
            <div class="info-value price">R$ ${simulation.basePrice.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">📊 Cenários Simulados</h3>
          <div class="metrics">
            <div class="metric-card" style="border-left-color: #3B82F6;">
              <div class="metric-label">Conservador</div>
              <div class="metric-value blue">R$ ${scenarios.conservative.price.toFixed(2)}</div>
              <div style="margin-top: 15px; font-size: 13px; color: #666;">
                <div>${scenarios.conservative.estimatedSales} vendas/mês</div>
                <div style="color: #10B981; font-weight: 600;">R$ ${scenarios.conservative.revenue.toFixed(2)}</div>
                ${scenarios.conservative.profit ? `<div style="color: #EAB308; font-weight: 600;">Lucro: R$ ${scenarios.conservative.profit.toFixed(2)}</div>` : ''}
              </div>
            </div>
            
            <div class="metric-card" style="border-left-color: #10B981;">
              <div class="metric-label">Realista ⭐</div>
              <div class="metric-value green">R$ ${scenarios.realistic.price.toFixed(2)}</div>
              <div style="margin-top: 15px; font-size: 13px; color: #666;">
                <div>${scenarios.realistic.estimatedSales} vendas/mês</div>
                <div style="color: #10B981; font-weight: 600;">R$ ${scenarios.realistic.revenue.toFixed(2)}</div>
                ${scenarios.realistic.profit ? `<div style="color: #EAB308; font-weight: 600;">Lucro: R$ ${scenarios.realistic.profit.toFixed(2)}</div>` : ''}
              </div>
            </div>
            
            <div class="metric-card" style="border-left-color: #EAB308;">
              <div class="metric-label">Otimista</div>
              <div class="metric-value" style="color: #EAB308;">R$ ${scenarios.optimistic.price.toFixed(2)}</div>
              <div style="margin-top: 15px; font-size: 13px; color: #666;">
                <div>${scenarios.optimistic.estimatedSales} vendas/mês</div>
                <div style="color: #10B981; font-weight: 600;">R$ ${scenarios.optimistic.revenue.toFixed(2)}</div>
                ${scenarios.optimistic.profit ? `<div style="color: #EAB308; font-weight: 600;">Lucro: R$ ${scenarios.optimistic.profit.toFixed(2)}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">🎯 Análise de Viabilidade</h3>
          <div class="analysis-text">
            ${simulation.aiAnalysis.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div class="footer">
          © ${new Date().getFullYear()} PriceMind - Relatório Confidencial
        </div>
      </div>
    `;

    const html = generateHTML('Simulação de Cenários', content);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=simulacao-${simulation.productName.replace(/\s+/g, '-')}.pdf`);
    res.send(pdf);

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Erro ao gerar PDF:', error);
    return res.status(500).json({ message: 'Erro ao gerar PDF' });
  }
};

/**
 * 📊 DASHBOARD EXECUTIVO
 */
exports.generateExecutiveDashboard = async (req, res) => {
  let browser;
  try {
    const userId = req.user._id.toString();

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const [analyses, stats, profile] = await Promise.all([
      prisma.analysis.findMany({
        where: {
          userId,
          createdAt: { gte: firstDay }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userStats.findUnique({
        where: { userId }
      }),
      prisma.userProfile.findUnique({
        where: { userId }
      })
    ]);

    const avgPrice = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.price, 0) / analyses.length 
      : 0;

    const categories = [...new Set(analyses.map(a => a.category).filter(Boolean))];

    const lastAnalyses = analyses.slice(0, 5).map((analysis, idx) => `
      <div class="list-item">
        <div class="list-item-name">${idx + 1}. ${analysis.productName}</div>
        <div class="list-item-price">R$ ${analysis.price.toFixed(2)}</div>
        <div class="list-item-date">${new Date(analysis.createdAt).toLocaleDateString('pt-BR')}</div>
      </div>
    `).join('');

    const content = `
      <div class="header" style="padding: 50px 60px;">
        <h1 style="font-size: 48px;">PriceMind</h1>
        <h2 style="font-size: 24px;">Dashboard Executivo</h2>
        <div class="date" style="font-size: 16px;">${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
      </div>
      
      <div class="container">
        <div class="section">
          <h3 class="section-title">📊 Resumo do Mês</h3>
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-label">Total de Análises</div>
              <div class="metric-value blue">${analyses.length}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Preço Médio</div>
              <div class="metric-value green">R$ ${avgPrice.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Categorias</div>
              <div class="metric-value" style="color: #EAB308;">${categories.length}</div>
            </div>
          </div>
          
          <div class="metrics" style="grid-template-columns: repeat(2, 1fr);">
            <div class="metric-card">
              <div class="metric-label">Plano Atual</div>
              <div class="metric-value purple">${profile?.plan === 'business' ? 'Business' : profile?.plan === 'pro' ? 'Pro' : 'Free'}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Uso Mensal</div>
              <div class="metric-value" style="color: #EF4444;">${stats?.monthlyRequests || 0} análises</div>
            </div>
          </div>
        </div>
        
        ${analyses.length > 0 ? `
          <div class="section">
            <h3 class="section-title">📋 Últimas Análises</h3>
            ${lastAnalyses}
          </div>
        ` : ''}
        
        <div class="footer">
          © ${new Date().getFullYear()} PriceMind - Relatório Confidencial
        </div>
      </div>
    `;

    const html = generateHTML('Dashboard Executivo', content);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=dashboard-executivo-${now.getMonth() + 1}-${now.getFullYear()}.pdf`);
    res.send(pdf);

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Erro ao gerar dashboard:', error);
    return res.status(500).json({ message: 'Erro ao gerar dashboard executivo' });
  }
};