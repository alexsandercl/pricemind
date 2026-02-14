import { JSX, useState } from "react";
import { api } from "../services/api";
import { TrendingUp, Loader, Sparkles, DollarSign, Target, MousePointer, BarChart3, Zap, TrendingDown, AlertCircle } from "lucide-react";

interface ROIResult {
  investment: number;
  cpc: number;
  clicks: number;
  conversionRate: number;
  sales: number;
  revenue: number;
  profit: number;
  roi: number;
  optimizations: {
    title: string;
    description: string;
    impact: string;
    newROI: string;
  }[];
  aiAnalysis: string;
  recommendation: string;
}

export default function TrafficROICalculator({ onBack }: { onBack: () => void }) {
  // Form states
  const [investment, setInvestment] = useState("");
  const [cpc, setCpc] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [installments, setInstallments] = useState<"1x" | "3x" | "12x">("1x");
  const [productionCost, setProductionCost] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ROIResult | null>(null);
  const [error, setError] = useState("");

  // ✨ FUNÇÃO PARA FORMATAR ANÁLISE DA IA (remove ** e formata)
  const formatAIAnalysis = (text: string): JSX.Element[] => {
    if (!text) return [];
    
    // Remove todos os ** e __ de bold
    let cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1');
    
    // Divide em parágrafos
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Verifica se é um parágrafo numerado (ex: "1. DIAGNÓSTICO:")
      const numberedMatch = paragraph.match(/^(\d+)\.\s*(.+?):\s*(.+)$/s);
      
      if (numberedMatch) {
        const [, number, title, content] = numberedMatch;
        
        // Define cores diferentes para cada seção
        const colors: { [key: string]: { bg: string; border: string; text: string } } = {
          '1': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
          '2': { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
          '3': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' }
        };
        
        const color = colors[number] || { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' };
        
        return (
          <div 
            key={index} 
            className={`${color.bg} border-l-4 ${color.border} pl-4 sm:pl-6 pr-4 py-4 rounded-r-xl mb-4`}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <span className={`${color.bg} border-2 ${color.border} rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base font-bold ${color.text} flex-shrink-0`}>
                {number}
              </span>
              <h4 className={`${color.text} font-bold text-sm sm:text-base uppercase tracking-wide`}>
                {title}
              </h4>
            </div>
            
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base pl-0 sm:pl-11">
              {content.trim()}
            </p>
          </div>
        );
      }
      
      // Parágrafo normal
      return (
        <p key={index} className="text-gray-300 leading-relaxed mb-4 text-sm sm:text-base">
          {paragraph}
        </p>
      );
    });
  };

  // Cálculo local (preview)
  const calculatePreview = () => {
    if (!investment || !cpc || !conversionRate || !productPrice) return null;

    const inv = parseFloat(investment);
    const cpcVal = parseFloat(cpc);
    const conv = parseFloat(conversionRate) / 100;
    const price = parseFloat(productPrice);
    const cost = productionCost ? parseFloat(productionCost) : 0;

    const clicks = inv / cpcVal;
    const sales = clicks * conv;
    const revenue = sales * price;
    const profit = revenue - inv - (sales * cost);
    const roi = ((profit / inv) * 100);

    return { clicks, sales, revenue, profit, roi };
  };

  const preview = calculatePreview();

  async function handleCalculate() {
    if (!investment || !cpc || !conversionRate || !productPrice) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/traffic-roi/calculate", {
        investment: parseFloat(investment),
        cpc: parseFloat(cpc),
        conversionRate: parseFloat(conversionRate),
        productPrice: parseFloat(productPrice),
        installments,
        productionCost: productionCost ? parseFloat(productionCost) : null
      });

      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError("⚠️ Ferramenta exclusiva para plano Business! Faça upgrade para acessar.");
      } else {
        setError(err.response?.data?.message || "Erro ao calcular ROI. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-16 pt-6 sm:pt-8 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 text-white">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 lg:mb-12">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Calculadora de ROI de Tráfego</h1>
                <span className="inline-block text-[10px] sm:text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold mt-1">
                  🔥 BUSINESS EXCLUSIVO
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-zinc-400">
              Descubra quanto você vai lucrar investindo em tráfego pago
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full sm:w-auto text-sm text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* FORMULÁRIO */}
        {!result && (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* COLUNA ESQUERDA - INPUTS */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    <DollarSign size={14} className="sm:w-4 sm:h-4" />
                    Quanto você vai investir? *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={investment}
                    onChange={(e) => setInvestment(e.target.value)}
                    placeholder="3000.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Total que vai investir em tráfego pago</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    <MousePointer size={14} className="sm:w-4 sm:h-4" />
                    CPC médio (custo por clique) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cpc}
                    onChange={(e) => setCpc(e.target.value)}
                    placeholder="2.50"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Meta Ads: R$ 2-4 | Google Ads: R$ 1-3</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    <Target size={14} className="sm:w-4 sm:h-4" />
                    Taxa de conversão da página *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    placeholder="3.0"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Média do mercado: 2-5%</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    <DollarSign size={14} className="sm:w-4 sm:h-4" />
                    Preço do seu produto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="127.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-zinc-300 mb-2 sm:mb-3">
                    Parcelamento oferecido
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setInstallments("1x")}
                      className={`py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 transition text-sm sm:text-base font-semibold ${
                        installments === "1x"
                          ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                          : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                      }`}
                    >
                      1x
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallments("3x")}
                      className={`py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 transition text-sm sm:text-base font-semibold ${
                        installments === "3x"
                          ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                          : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                      }`}
                    >
                      3x
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallments("12x")}
                      className={`py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 transition text-sm sm:text-base font-semibold ${
                        installments === "12x"
                          ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                          : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                      }`}
                    >
                      12x
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    Custo de produção (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productionCost}
                    onChange={(e) => setProductionCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Custo por unidade vendida</p>
                </div>
              </div>

              {/* COLUNA DIREITA - PREVIEW */}
              <div className="space-y-4 sm:space-y-6">
                {/* PREVIEW RÁPIDO */}
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <Zap className="text-yellow-400" size={18} />
                    <h3 className="text-base sm:text-lg font-bold">Preview Rápido</h3>
                  </div>

                  {preview ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center p-2.5 sm:p-3 bg-black/30 rounded-lg sm:rounded-xl">
                        <span className="text-xs sm:text-sm text-zinc-400">Cliques estimados</span>
                        <span className="text-base sm:text-lg font-bold">{Math.floor(preview.clicks).toLocaleString('pt-BR')}</span>
                      </div>

                      <div className="flex justify-between items-center p-2.5 sm:p-3 bg-black/30 rounded-lg sm:rounded-xl">
                        <span className="text-xs sm:text-sm text-zinc-400">Vendas esperadas</span>
                        <span className="text-base sm:text-lg font-bold text-blue-400">{Math.floor(preview.sales)}</span>
                      </div>

                      <div className="flex justify-between items-center p-2.5 sm:p-3 bg-black/30 rounded-lg sm:rounded-xl">
                        <span className="text-xs sm:text-sm text-zinc-400">Receita bruta</span>
                        <span className="text-base sm:text-lg font-bold text-green-400">
                          R$ {preview.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2.5 sm:p-3 bg-black/30 rounded-lg sm:rounded-xl">
                        <span className="text-xs sm:text-sm text-zinc-400">Lucro líquido</span>
                        <span className={`text-base sm:text-lg font-bold ${preview.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {preview.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl border border-yellow-500/50">
                        <span className="text-xs sm:text-sm font-bold">ROI</span>
                        <span className={`text-xl sm:text-2xl font-bold ${preview.roi > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {preview.roi.toFixed(0)}%
                        </span>
                      </div>

                      <div className="pt-3 sm:pt-4 border-t border-zinc-700">
                        <p className="text-[10px] sm:text-xs text-zinc-500 text-center">
                          Clique em "Calcular com IA" para análise detalhada e otimizações
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <BarChart3 className="mx-auto text-zinc-600 mb-3" size={36} />
                      <p className="text-xs sm:text-sm text-zinc-500">
                        Preencha os campos para ver o preview
                      </p>
                    </div>
                  )}
                </div>

                {/* BOTÃO CALCULAR */}
                <div className="space-y-3">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCalculate}
                    disabled={loading || !preview}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Calcular com IA
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTADO */}
        {result && (
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
              📊 Análise Completa do seu Investimento
            </h2>

            {/* MÉTRICAS PRINCIPAIS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">Cliques</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{result.clicks.toLocaleString('pt-BR')}</p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">Vendas</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">{result.sales}</p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">Receita</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400 break-words">
                  R$ {result.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className={`${result.roi > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-xl sm:rounded-2xl p-4 sm:p-5`}>
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">ROI</p>
                <p className={`text-2xl sm:text-3xl font-bold ${result.roi > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.roi.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* LUCRO DESTAQUE */}
            <div className={`${result.profit > 0 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50' : 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50'} border-2 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center`}>
              <p className="text-zinc-400 mb-2 text-sm sm:text-base">Lucro Líquido Estimado</p>
              <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 ${result.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.profit > 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10" />
                    R$ {result.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingDown className="w-8 h-8 sm:w-10 sm:h-10" />
                    -R$ {Math.abs(result.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto">
                {result.profit > 0 
                  ? `Investindo R$ ${result.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, você pode lucrar R$ ${result.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : `Com este cenário, você teria prejuízo de R$ ${Math.abs(result.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Veja as otimizações abaixo!`
                }
              </p>
            </div>

            {/* OTIMIZAÇÕES */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-yellow-400" size={20} />
                3 Formas de Otimizar seu ROI
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {result.optimizations.map((opt, index) => (
                  <div key={index} className="bg-zinc-900 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-yellow-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h4 className="font-bold text-yellow-400 text-sm sm:text-base flex-1">{opt.title}</h4>
                      <span className="text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full whitespace-nowrap">
                        ROI: {opt.newROI}%
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 mb-3">{opt.description}</p>
                    <p className="text-xs sm:text-sm font-semibold text-green-400">{opt.impact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ANÁLISE DA IA - FORMATADA */}
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
                <Sparkles className="text-purple-400" size={20} />
                <h2 className="text-lg sm:text-xl font-bold">Análise Detalhada da IA</h2>
              </div>

              <div className="space-y-2">
                {formatAIAnalysis(result.aiAnalysis)}
              </div>

              <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <p className="text-xs sm:text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                  <span>💡</span> RECOMENDAÇÃO:
                </p>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">{result.recommendation}</p>
              </div>
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base font-medium"
              >
                🔄 Nova Simulação
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 transition-all text-sm sm:text-base"
              >
                ← Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}