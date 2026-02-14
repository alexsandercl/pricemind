// 💰 HELPER PARA FORMATAÇÃO DE VALORES EM REAL BRASILEIRO

/**
 * Formata número para padrão brasileiro (vírgula decimal, ponto milhar)
 * @param value - Valor numérico
 * @param decimals - Casas decimais (padrão: 2)
 * @returns String formatada (ex: "1.234,56")
 */
export function formatBRL(value: number, decimals: number = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formata para moeda completa com R$
 * @param value - Valor numérico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Formata porcentagem
 * @param value - Valor numérico
 * @param decimals - Casas decimais (padrão: 1)
 * @returns String formatada (ex: "12,5%")
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${formatBRL(value, decimals)}%`;
}

// EXEMPLOS DE USO:
// formatBRL(15760)        → "15.760,00"
// formatBRL(15760.5)      → "15.760,50"
// formatBRL(15760.567, 2) → "15.760,57"
// formatCurrency(15760)   → "R$ 15.760,00"
// formatPercent(84.7)     → "84,7%"