const { prisma } = require('../lib/prisma');
const OpenAI = require('openai');
const csv = require('csv-parser');
const { Readable } = require('stream');
const ExcelJS = require('exceljs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 📥 UPLOAD E PROCESSAR CSV
 * POST /batch/upload
 */
exports.uploadAndProcess = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const plan = req.user.plan;

    // Verificar plano Business
    if (plan !== 'business') {
      return res.status(403).json({ 
        message: 'Análise em Lote é exclusiva do plano Business',
        upgrade: true 
      });
    }

    // Verificar se arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Parsear CSV
    const products = [];
    const stream = Readable.from(req.file.buffer.toString('utf-8'));

    stream
      .pipe(csv())
      .on('data', (row) => {
        // Validar campos obrigatórios
        if (row.nome && row.preco && row.categoria) {
          products.push({
            nome: row.nome.trim(),
            preco: parseFloat(row.preco.replace(',', '.')),
            categoria: row.categoria.trim(),
            descricao: row.descricao?.trim() || null,
            custoProducao: row.custoProducao ? parseFloat(row.custoProducao.replace(',', '.')) : null,
            margemDesejada: row.margemDesejada ? parseFloat(row.margemDesejada.replace(',', '.')) : null
          });
        }
      })
      .on('end', async () => {
        if (products.length === 0) {
          return res.status(400).json({ 
            message: 'CSV vazio ou formato inválido. Verifique o template.' 
          });
        }

        // Limitar quantidade (Business: 100 produtos por vez)
        if (products.length > 100) {
          return res.status(400).json({ 
            message: 'Máximo de 100 produtos por vez. Você enviou ' + products.length 
          });
        }

        // Criar registro de batch no banco
        const batch = await prisma.batchAnalysis.create({
          data: {
            userId,
            fileName: req.file.originalname,
            fileUrl: 'uploaded', // Pode salvar em S3 depois
            totalProducts: products.length,
            processed: 0,
            status: 'processing',
            results: products // Salvar produtos para processar
          }
        });

        // Retornar ID do batch para o frontend acompanhar
        res.json({
          batchId: batch.id,
          totalProducts: products.length,
          message: 'Upload realizado! Processamento iniciado.'
        });

        // Processar em background (não bloqueia a resposta)
        processBatchInBackground(batch.id, userId, products);
      })
      .on('error', (error) => {
        console.error('❌ Erro ao processar CSV:', error);
        return res.status(500).json({ message: 'Erro ao processar CSV' });
      });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return res.status(500).json({ message: 'Erro no upload' });
  }
};

/**
 * 🔄 PROCESSAR BATCH EM BACKGROUND
 */
async function processBatchInBackground(batchId, userId, products) {
  try {
    const results = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // Gerar prompt para IA
        const prompt = `
Analise o seguinte produto e forneça uma recomendação de preço:

📦 PRODUTO: ${product.nome}
💰 PREÇO ATUAL: R$ ${product.preco.toFixed(2)}
🏷️ CATEGORIA: ${product.categoria}
${product.descricao ? `📝 DESCRIÇÃO: ${product.descricao}` : ''}
${product.custoProducao ? `🏭 CUSTO: R$ ${product.custoProducao.toFixed(2)}` : ''}
${product.margemDesejada ? `🎯 MARGEM DESEJADA: ${product.margemDesejada}%` : ''}

Forneça uma análise CURTA (máximo 3 parágrafos) com:
1. Avaliação do preço atual
2. Recomendação (manter, aumentar ou diminuir)
3. Preço sugerido (se aplicável)

Seja objetivo e direto.
        `;

        // Chamar OpenAI
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'Você é um especialista em precificação. Seja breve e objetivo nas análises em lote.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 400
        });

        const analysis = response.choices[0].message.content;

        // Extrair recomendação (simples)
        let recommendation = 'MANTER';
        if (analysis.toLowerCase().includes('aumentar')) recommendation = 'AUMENTAR';
        if (analysis.toLowerCase().includes('diminuir')) recommendation = 'DIMINUIR';
        if (analysis.toLowerCase().includes('reduzir')) recommendation = 'DIMINUIR';

        results.push({
          produto: product.nome,
          precoAtual: product.preco,
          categoria: product.categoria,
          recomendacao: recommendation,
          analise: analysis.replace(/\*\*/g, '').replace(/\*/g, ''),
          status: 'success'
        });

        // Atualizar progresso
        await prisma.batchAnalysis.update({
          where: { id: batchId },
          data: { 
            processed: i + 1,
            results: results 
          }
        });

        // Pequeno delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Erro ao processar ${product.nome}:`, error);
        
        results.push({
          produto: product.nome,
          precoAtual: product.preco,
          categoria: product.categoria,
          recomendacao: 'ERRO',
          analise: 'Erro ao processar este produto',
          status: 'error'
        });

        await prisma.batchAnalysis.update({
          where: { id: batchId },
          data: { 
            processed: i + 1,
            results: results 
          }
        });
      }
    }

    // Marcar como completo
    await prisma.batchAnalysis.update({
      where: { id: batchId },
      data: { 
        status: 'completed',
        results: results
      }
    });

    console.log(`✅ Batch ${batchId} completo! ${results.length} produtos processados.`);

  } catch (error) {
    console.error('❌ Erro no processamento em background:', error);
    
    await prisma.batchAnalysis.update({
      where: { id: batchId },
      data: { status: 'failed' }
    });
  }
}

/**
 * 📊 BUSCAR STATUS DO BATCH
 * GET /batch/:batchId/status
 */
exports.getBatchStatus = async (req, res) => {
  try {
    const { batchId } = req.params;
    const userId = req.user._id.toString();

    const batch = await prisma.batchAnalysis.findFirst({
      where: {
        id: batchId,
        userId
      }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch não encontrado' });
    }

    return res.json({
      id: batch.id,
      fileName: batch.fileName,
      totalProducts: batch.totalProducts,
      processed: batch.processed,
      status: batch.status,
      progress: Math.round((batch.processed / batch.totalProducts) * 100),
      results: batch.results || [],
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt
    });

  } catch (error) {
    console.error('❌ Erro ao buscar status:', error);
    return res.status(500).json({ message: 'Erro ao buscar status' });
  }
};

/**
 * 📥 EXPORTAR RESULTADOS EM EXCEL
 * GET /batch/:batchId/export
 */
exports.exportBatchResults = async (req, res) => {
  try {
    const { batchId } = req.params;
    const userId = req.user._id.toString();

    const batch = await prisma.batchAnalysis.findFirst({
      where: {
        id: batchId,
        userId
      }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch não encontrado' });
    }

    if (batch.status !== 'completed') {
      return res.status(400).json({ message: 'Batch ainda não foi completado' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Análise em Lote');

    // CABEÇALHOS
    sheet.columns = [
      { header: 'Produto', key: 'produto', width: 35 },
      { header: 'Preço Atual', key: 'preco', width: 15 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Recomendação', key: 'recomendacao', width: 15 },
      { header: 'Análise', key: 'analise', width: 80 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Estilizar cabeçalho
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a1a1a' }
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // ADICIONAR DADOS
    const results = batch.results || [];
    results.forEach(result => {
      const row = sheet.addRow({
        produto: result.produto,
        preco: `R$ ${result.precoAtual.toFixed(2)}`,
        categoria: result.categoria,
        recomendacao: result.recomendacao,
        analise: result.analise,
        status: result.status === 'success' ? 'OK' : 'ERRO'
      });

      // Colorir recomendação
      const recCell = row.getCell('recomendacao');
      if (result.recomendacao === 'AUMENTAR') {
        recCell.font = { color: { argb: 'FF10B981' }, bold: true };
      } else if (result.recomendacao === 'DIMINUIR') {
        recCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      } else if (result.recomendacao === 'MANTER') {
        recCell.font = { color: { argb: 'FF3B82F6' }, bold: true };
      }

      // Colorir status
      const statusCell = row.getCell('status');
      if (result.status === 'success') {
        statusCell.font = { color: { argb: 'FF10B981' } };
      } else {
        statusCell.font = { color: { argb: 'FFEF4444' } };
      }
    });

    // RESUMO (nova aba)
    const summarySheet = workbook.addWorksheet('Resumo');
    
    const aumentar = results.filter(r => r.recomendacao === 'AUMENTAR').length;
    const diminuir = results.filter(r => r.recomendacao === 'DIMINUIR').length;
    const manter = results.filter(r => r.recomendacao === 'MANTER').length;
    const erros = results.filter(r => r.status === 'error').length;

    summarySheet.addRow(['Total de Produtos', results.length]);
    summarySheet.addRow(['Aumentar Preço', aumentar]);
    summarySheet.addRow(['Diminuir Preço', diminuir]);
    summarySheet.addRow(['Manter Preço', manter]);
    summarySheet.addRow(['Erros', erros]);
    summarySheet.addRow(['Data do Processamento', new Date(batch.updatedAt).toLocaleString('pt-BR')]);

    summarySheet.getColumn(1).font = { bold: true };
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 20;

    // ENVIAR ARQUIVO
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=analise-lote-${batch.fileName.replace('.csv', '')}-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Erro ao exportar:', error);
    return res.status(500).json({ message: 'Erro ao exportar resultados' });
  }
};

/**
 * 📋 LISTAR BATCHES DO USUÁRIO
 * GET /batch/list
 */
exports.listBatches = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const batches = await prisma.batchAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        fileName: true,
        totalProducts: true,
        processed: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({ batches });

  } catch (error) {
    console.error('❌ Erro ao listar batches:', error);
    return res.status(500).json({ message: 'Erro ao listar batches' });
  }
};

/**
 * 🗑️ DELETAR BATCH
 * DELETE /batch/:batchId
 */
exports.deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const userId = req.user._id.toString();

    const batch = await prisma.batchAnalysis.findFirst({
      where: {
        id: batchId,
        userId
      }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch não encontrado' });
    }

    await prisma.batchAnalysis.delete({
      where: { id: batchId }
    });

    return res.json({ message: 'Batch deletado com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao deletar batch:', error);
    return res.status(500).json({ message: 'Erro ao deletar batch' });
  }
};