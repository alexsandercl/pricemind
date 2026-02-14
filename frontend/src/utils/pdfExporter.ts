import jsPDF from 'jspdf';

export type AnalysisData = {
  productName: string;
  price: number;
  category: string;
  description?: string;
  aiResponse: string;
  createdAt: string;
};

/**
 * 🔧 CONVERTER PARA ASCII SEGURO
 */
function toSafeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
}

/**
 * 🎨 DESENHAR LOGO
 */
function drawLogo(pdf: jsPDF, x: number, y: number, size: number) {
  pdf.setFillColor(250, 204, 21);
  pdf.roundedRect(x, y, size, size, 3, 3, 'F');
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(size * 0.65);
  pdf.setFont('helvetica', 'bold');
  pdf.text('P', x + size * 0.32, y + size * 0.7);
}

/**
 * 📄 EXPORTAR PDF
 */
export function exportAnalysisToPDF(analysis: AnalysisData): void {
  const pdf = new jsPDF();
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;

  // ========== HEADER AMARELO ==========
  pdf.setFillColor(250, 204, 21);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  drawLogo(pdf, margin, 12, 26);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PriceMind', margin + 35, 27);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Analise Inteligente de Precos', margin + 35, 35);
  
  yPosition = 60;

  // ========== DATA ==========
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  const date = new Date(analysis.createdAt);
  const dateText = toSafeText(
    `Gerado em: ${date.toLocaleDateString('pt-BR')} as ${date.toLocaleTimeString('pt-BR')}`
  );
  pdf.text(dateText, pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 15;

  // ========== BOX DO PRODUTO ==========
  // Calcular altura do box dinamicamente
  let tempY = yPosition + 12;
  
  // Label
  tempY += 8;
  
  // Nome do produto
  const productLines = pdf.splitTextToSize(analysis.productName, maxWidth - 16);
  tempY += productLines.length * 7 + 6;
  
  // Categoria + Preço
  tempY += 10;
  
  // Descrição
  let descLines: string[] = [];
  if (analysis.description) {
    const safeDesc = toSafeText(analysis.description);
    descLines = pdf.splitTextToSize(safeDesc, maxWidth - 16);
    tempY += descLines.length * 4.5 + 5;
  }
  
  const boxHeight = tempY - yPosition + 5;
  
  // Desenhar box
  pdf.setFillColor(248, 248, 248);
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, yPosition, maxWidth, boxHeight, 4, 4, 'FD');
  
  yPosition += 12;
  
  // Label
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRODUTO ANALISADO', margin + 8, yPosition);
  
  yPosition += 8;
  
  // Nome
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(productLines, margin + 8, yPosition);
  yPosition += productLines.length * 7 + 6;
  
  // Categoria
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.text(`Categoria: ${analysis.category}`, margin + 8, yPosition);
  
  // Preço
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 197, 94);
  pdf.text(
    `R$ ${analysis.price.toFixed(2).replace('.', ',')}`,
    pageWidth - margin - 8,
    yPosition,
    { align: 'right' }
  );
  
  yPosition += 10;

  // Descrição
  if (analysis.description && descLines.length > 0) {
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.text(descLines, margin + 8, yPosition);
    yPosition += descLines.length * 4.5;
  }
  
  yPosition += 18;

  // ========== HEADER ANÁLISE ==========
  pdf.setFillColor(250, 204, 21);
  pdf.roundedRect(margin, yPosition, maxWidth, 12, 3, 3, 'F');
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ANÁLISE GERADA PELO PRINCEMIND', margin + 8, yPosition + 8);
  
  yPosition += 20;

  // ========== PROCESSAR ANÁLISE ==========
  let cleanText = analysis.aiResponse
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*([^*]+?)\*/g, '$1')
    .replace(/_([^_]+?)_/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[\-\*\+]\s+/gm, '  - ')
    .trim();

  cleanText = toSafeText(cleanText);

  // ========== RENDERIZAR TEXTO ==========
  pdf.setTextColor(40, 40, 40); // PRETO (não azul!)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const paragraphs = cleanText.split('\n');
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      yPosition += 3;
      continue;
    }

    // Detectar título
    const isNumberedTitle = /^\d+\./.test(trimmed);
    const isShort = trimmed.length < 80;
    const startsUpper = /^[A-Z]/.test(trimmed);
    const isTitle = isNumberedTitle || (isShort && startsUpper);
    
    if (isTitle) {
      // Espaço antes do título
      if (yPosition > margin + 20) yPosition += 4;
      
      // Nova página se necessário
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
        addWatermark(pdf, pageWidth, pageHeight);
        pdf.setTextColor(40, 40, 40); // Resetar cor
        pdf.setFontSize(10);
      }
      
      // Título
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      const titleLines = pdf.splitTextToSize(trimmed, maxWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 6 + 5;
      
      // Voltar ao normal
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 40);
    } else {
      // Parágrafo normal
      const lines = pdf.splitTextToSize(trimmed, maxWidth);
      
      for (const line of lines) {
        // Nova página se necessário
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
          addWatermark(pdf, pageWidth, pageHeight);
          pdf.setTextColor(40, 40, 40); // Resetar cor
          pdf.setFontSize(10);
        }
        
        pdf.text(line, margin, yPosition);
        yPosition += 5.5;
      }
      
      yPosition += 3;
    }
  }

  // ========== FOOTER ==========
  addFooter(pdf, pageWidth, pageHeight);

  // ========== SALVAR ==========
  const sanitizedName = analysis.productName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40);
  
  pdf.save(`PriceMind_${sanitizedName}_${Date.now()}.pdf`);
}

/**
 * 💧 MARCA D'ÁGUA
 */
function addWatermark(pdf: jsPDF, pageWidth: number, pageHeight: number) {
  pdf.setTextColor(235, 235, 235);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PriceMind', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

/**
 * 🏷️ FOOTER
 */
function addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number) {
  const margin = 20;
  
  pdf.setDrawColor(250, 204, 21);
  pdf.setLineWidth(1.5);
  pdf.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
  
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text(
    'Gerado por PriceMind - Analise Inteligente de Precos',
    pageWidth / 2,
    pageHeight - 18,
    { align: 'center' }
  );
  
  pdf.setFontSize(8);
  pdf.setTextColor(140, 140, 140);
  pdf.text('www.pricemind.com', pageWidth / 2, pageHeight - 12, { align: 'center' });
}