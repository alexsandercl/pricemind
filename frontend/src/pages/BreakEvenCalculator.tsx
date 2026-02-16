import { JSX, useState } from "react";
import { api } from "../services/api";
import { TrendingUp, Loader, Sparkles, DollarSign, Target, TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface BreakEvenResult {
  productName: string;
  sellingPrice: number;
  variableCost: number;
  fixedCosts: number;
  targetProfit: number;
  contributionMargin: number;
  contributionMarginPercent: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  unitsForTargetProfit: number;
  revenueForTargetProfit: number;
  safetyMarginUnits: number;
  safetyMarginRevenue: number;
  dailySalesNeeded: number;
  projections: {
    period: string;
    sales: number;
    revenue: number;
    profit: number;
    status: string;
  }[];
  recommendations: {
    type: string;
    title: string;
    description: string;
  }[];
  aiAnalysis: string;
}

export default function BreakEvenCalculator({ onBack }: { onBack: () => void }) {
  // Form states
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [variableCost, setVariableCost] = useState("");
  const [fixedCosts, setFixedCosts] = useState("");
  const [targetProfit, setTargetProfit] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BreakEvenResult | null>(null);
  const [error, setError] = useState("");

  // Preview calculation
  const calculatePreview = () => {
    if (!sellingPrice || !variableCost || !fixedCosts) return null;

    const price = parseFloat(sellingPrice);
    const varCost = parseFloat(variableCost);
    const fixed = parseFloat(fixedCosts);

    const margin = price - varCost;
    const breakEven = Math.ceil(fixed / margin);
    const revenue = breakEven * price;

    return { margin, breakEven, revenue };
  };

  const preview = calculatePreview();

  // Formatação da análise IA
  const formatAIAnalysis = (text: string): JSX.Element[] => {
    if (!text) return [];
    
    let cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1');
    
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const numberedMatch = paragraph.match(/^(\d+)\.\s*(.+?):\s*(.+)$/s);
      
      if (numberedMatch) {
        const [, number, title, content] = numberedMatch;
        
        const colors: { [key: string]: { bg: string; border: string; text: string } } = {
          '1': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
          '2': { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
          '3': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' }
        };
        
        const color = colors[number] || { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' };
        
        return (
          <div 
            key={index} 
            className={`${color.bg} border-l-4 ${color.border} pl-4 sm:pl-6 pr-4 py-4 rounded-r-xl mb-4`}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <span className={`${color.bg} border-2 ${color.border} rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base font-bold ${color.text}`}>
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
      
      return (
        <p key={index} className="text-gray-300 leading-relaxed mb-4 text-sm sm:text-base">
          {paragraph}
        </p>
      );
    });
  };

  async function handleCalculate() {
    if (!productName || !sellingPrice || !variableCost || !fixedCosts) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/break-even/calculate", {
        productName,
        sellingPrice: parseFloat(sellingPrice),
        variableCost: parseFloat(variableCost),
        fixedCosts: parseFloat(fixedCosts),
        targetProfit: targetProfit ? parseFloat(targetProfit) : 0
      });

      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError("⚠️ Ferramenta exclusiva para planos Pro e Business!");
      } else {
        setError(err.response?.data?.message || "Erro ao calcular break-even");
      }
    } finally {
      setLoading(false);
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-400" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-400" size={20} />;
      case 'info': return <Info className="text-blue-400" size={20} />;
      default: return <Info className="text-zinc-400" size={20} />;
    }
  };

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-16 pt-6 sm:pt-8 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 text-white">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 lg:mb-12">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Target className="text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Calculadora de Break-even</h1>
                <span className="inline-block text-[10px] sm:text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold mt-1">
                  ⭐ PRO
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-zinc-400">
              Descubra quantas vendas precisa fazer para empatar custos
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
              {/* INPUTS */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm text-zinc-300 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Curso de Python"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-green-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    <DollarSign size={14} />
                    Preço de Venda (unitário) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="127.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-green-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    <TrendingDown size={14} />
                    Custo Variável (por unidade) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={variableCost}
                    onChange={(e) => setVariableCost(e.target.value)}
                    placeholder="45.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-green-500 outline-none transition text-sm sm:text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                    Ex: matéria-prima, embalagem, frete, plataforma
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 mb-2">
                    <Target size={14} />
                    Custos Fixos Mensais *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fixedCosts}
                    onChange={(e) => setFixedCosts(e.target.value)}
                    placeholder="3000.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-green-500 outline-none transition text-sm sm:text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                    Ex: aluguel, salários, software, marketing fixo
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-zinc-300 mb-2">
                    Meta de Lucro Mensal (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(e.target.value)}
                    placeholder="5000.00"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black border border-zinc-700 rounded-lg sm:rounded-xl focus:border-green-500 outline-none transition text-sm sm:text-base"
                  />
                  <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                    Quanto quer lucrar além de cobrir custos?
                  </p>
                </div>
              </div>

              {/* PREVIEW */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
                  <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6">Preview Rápido</h3>

                  {preview ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="p-3 bg-black/30 rounded-xl">
                        <p className="text-xs text-zinc-400 mb-1">Margem por Unidade</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-400">
                          R$ {preview.margin.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-3 bg-black/30 rounded-xl">
                        <p className="text-xs text-zinc-400 mb-1">Break-even (unidades)</p>
                        <p className="text-xl sm:text-2xl font-bold">
                          {preview.breakEven} vendas
                        </p>
                      </div>

                      <div className="p-3 bg-black/30 rounded-xl">
                        <p className="text-xs text-zinc-400 mb-1">Break-even (receita)</p>
                        <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                          R$ {preview.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <p className="text-[10px] sm:text-xs text-zinc-500 text-center pt-3 border-t border-zinc-700">
                        Clique em "Calcular com IA" para análise completa
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Target className="mx-auto text-zinc-600 mb-3" size={36} />
                      <p className="text-xs sm:text-sm text-zinc-500">
                        Preencha os campos para ver o preview
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4">
                    <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleCalculate}
                  disabled={loading || !preview}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg sm:rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Calculando...
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
        )}

        {/* RESULTADO */}
        {result && (
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
              🎯 Análise de Break-even Completa
            </h2>

            {/* MÉTRICAS PRINCIPAIS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">Break-even</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">{result.breakEvenUnits}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500">vendas/mês</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">Por Dia</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{result.dailySalesNeeded}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500">vendas/dia</p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">Margem</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">
                  {result.contributionMarginPercent.toFixed(1)}%
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-zinc-400 mb-1">Receita</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-yellow-400 break-words">
                  R$ {result.breakEvenRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* PROJEÇÕES */}
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">📊 Projeções por Período</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {result.projections.map((proj, idx) => (
                  <div key={idx} className="bg-black/30 border border-zinc-700 rounded-xl p-4">
                    <p className="text-xs text-zinc-400 mb-3">{proj.period}</p>
                    <p className="text-sm mb-1">Vendas: <span className="font-bold">{proj.sales}</span></p>
                    <p className="text-sm mb-1">
                      Receita: <span className="font-bold text-blue-400">R$ {proj.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <p className="text-sm mb-2">
                      Lucro: <span className={`font-bold ${proj.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {proj.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      proj.status === 'Lucrando' ? 'bg-green-500/20 text-green-400' :
                      proj.status === 'Break-even' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RECOMENDAÇÕES */}
            {result.recommendations.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">💡 Insights Automáticos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {result.recommendations.map((rec, idx) => (
                    <div key={idx} className={`border rounded-xl p-4 ${
                      rec.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                      rec.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getRecommendationIcon(rec.type)}
                        <div>
                          <h4 className="font-bold text-sm mb-1">{rec.title}</h4>
                          <p className="text-xs text-zinc-300">{rec.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANÁLISE IA */}
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
                <Sparkles className="text-purple-400" size={20} />
                <h2 className="text-lg sm:text-xl font-bold">Análise Detalhada da IA</h2>
              </div>
              <div className="space-y-2">
                {formatAIAnalysis(result.aiAnalysis)}
              </div>
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-sm sm:text-base"
              >
                🔄 Nova Análise
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition text-sm sm:text-base"
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