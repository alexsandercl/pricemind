import { JSX, useState } from "react";
import { api } from "../services/api";
import { Percent, Loader, Sparkles, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatBRL } from "../utils/formatUtils";

interface DiscountResult {
  productName: string;
  currentPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercent: number;
  currentMargin: number;
  newMargin: number;
  profitLoss: number;
  profitLossPercent: number;
  minimumSalesIncrease: number;
  additionalSalesNeeded: number;
  scenarioNoIncrease: any;
  scenarioWithIncrease: any;
  riskLevel: string;
  riskMessage: string;
  recommendations: any[];
  aiAnalysis: string;
}

export default function DiscountSimulator({ onBack }: { onBack: () => void }) {
  const [productName, setProductName] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentMargin, setCurrentMargin] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [expectedSalesIncrease, setExpectedSalesIncrease] = useState("");
  const [currentMonthlySales, setCurrentMonthlySales] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscountResult | null>(null);
  const [error, setError] = useState("");

  const formatAIAnalysis = (text: string): JSX.Element[] => {
    if (!text) return [];
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1');
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim());

// 💰 Formatação padrão brasileiro
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
    
    return paragraphs.map((paragraph, index) => {
      const match = paragraph.match(/^(\d+)\.\s*(.+?):\s*(.+)$/s);
      if (match) {
        const [, num, title, content] = match;
        const colors = { '1': 'green', '2': 'amber', '3': 'blue' };
        const c = colors[num as keyof typeof colors] || 'purple';
        return (
          <div key={index} className={`bg-${c}-500/20 border-l-4 border-${c}-500/50 pl-4 py-3 rounded-r-xl mb-3`}>
            <h4 className={`text-${c}-400 font-bold text-sm mb-2`}>{num}. {title}</h4>
            <p className="text-gray-300 text-sm">{content.trim()}</p>
          </div>
        );
      }
      return <p key={index} className="text-gray-300 text-sm mb-3">{paragraph}</p>;
    });
  };

  async function handleSimulate() {
    if (!productName || !currentPrice || !currentMargin || !discountPercent) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/discount-simulator/simulate", {
        productName,
        currentPrice: parseFloat(currentPrice),
        currentMargin: parseFloat(currentMargin),
        discountPercent: parseFloat(discountPercent),
        expectedSalesIncrease: expectedSalesIncrease ? parseFloat(expectedSalesIncrease) : 0,
        currentMonthlySales: currentMonthlySales ? parseFloat(currentMonthlySales) : 100
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao simular desconto");
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-green-400 bg-green-500/10 border-green-500/30';
    }
  };

  return (
    <>
      <div className="gold-bg" />
      <div className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-16 pt-6 sm:pt-8 pb-12 sm:pb-16 text-white">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Percent className="text-orange-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Simulador de Descontos</h1>
                <span className="inline-block text-[10px] sm:text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full font-bold mt-1">
                  ⭐ PRO
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              Descubra se seu desconto vale a pena ou se vai dar prejuízo
            </p>
          </div>
          <button onClick={onBack} className="text-sm text-zinc-400 hover:text-yellow-400">← Voltar</button>
        </div>

        {!result && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* FORM */}
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 sm:p-6 space-y-4">
              <input
                type="text"
                placeholder="Nome do produto *"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg focus:border-orange-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Preço atual (R$) *"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg focus:border-orange-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Margem de lucro atual (%) *"
                value={currentMargin}
                onChange={(e) => setCurrentMargin(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg focus:border-orange-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Desconto planejado (%) *"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg focus:border-orange-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Aumento esperado de vendas (%)"
                value={expectedSalesIncrease}
                onChange={(e) => setExpectedSalesIncrease(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg focus:border-orange-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Vendas mensais atuais (unidades)"
                value={currentMonthlySales}
                onChange={(e) => setCurrentMonthlySales(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg focus:border-orange-500 outline-none text-sm"
              />
            </div>

            {/* ACTION */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4 sm:p-6">
                <h3 className="font-bold mb-3">💡 Dica</h3>
                <p className="text-sm text-zinc-300">
                  Seja conservador nas estimativas de aumento de vendas. Um desconto de 20% raramente dobra as vendas!
                </p>
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader className="animate-spin" size={18} />Simulando...</> : <><Sparkles size={18} />Simular com IA</>}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center">💸 Resultado da Simulação</h2>

            {/* CARDS PRINCIPAIS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <p className="text-xs text-zinc-400 mb-1">Preço com desconto</p>
                <p className="text-xl font-bold text-orange-400">R$ {formatBRL(result.discountedPrice)}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-xs text-zinc-400 mb-1">Nova margem</p>
                <p className="text-xl font-bold text-red-400">{result.newMargin.toFixed(1)}%</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-xs text-zinc-400 mb-1">Vendas extras necessárias</p>
                <p className="text-xl font-bold text-amber-400">+{result.additionalSalesNeeded}</p>
              </div>
              <div className={`border rounded-xl p-4 ${getRiskColor(result.riskLevel)}`}>
                <p className="text-xs mb-1">Risco</p>
                <p className="text-xl font-bold uppercase">{result.riskLevel}</p>
              </div>
            </div>

            {/* COMPARAÇÃO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 sm:p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingDown className="text-red-400" />
                  Sem Aumento de Vendas
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">Lucro: <span className="text-red-400 font-bold">
                    R$ {formatBRL(result.scenarioNoIncrease.profitDiff)}
                  </span></p>
                  <p className="text-xs text-zinc-500">Prejuízo comparado ao cenário atual</p>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 sm:p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-400" />
                  Com Aumento Esperado
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">Lucro: <span className={`font-bold ${result.scenarioWithIncrease.profitDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {formatBRL(result.scenarioWithIncrease.profitDiff)}
                  </span></p>
                  <p className="text-xs text-zinc-500">
                    {result.scenarioWithIncrease.profitDiff > 0 ? 'Lucro adicional' : 'Ainda no prejuízo'}
                  </p>
                </div>
              </div>
            </div>

            {/* ALERTA */}
            <div className={`border-2 rounded-xl p-4 sm:p-6 ${getRiskColor(result.riskLevel)}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-2">Análise de Risco</h4>
                  <p className="text-sm">{result.riskMessage}</p>
                </div>
              </div>
            </div>

            {/* RECOMENDAÇÕES */}
            {result.recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold">💡 Recomendações</h3>
                <div className="grid gap-3">
                  {result.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className={`border rounded-xl p-4 ${
                      rec.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                      rec.type === 'danger' ? 'bg-red-500/10 border-red-500/30' :
                      'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <h4 className="font-bold text-sm mb-1">{rec.title}</h4>
                      <p className="text-xs text-zinc-300">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANÁLISE IA */}
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-400" />
                <h3 className="font-bold">Análise da IA</h3>
              </div>
              <div>{formatAIAnalysis(result.aiAnalysis)}</div>
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setResult(null)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition">
                🔄 Nova Simulação
              </button>
              <button onClick={onBack} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition">
                ← Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}