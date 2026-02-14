import { useState } from "react";
import { api } from "../services/api";
import { TrendingUp, Loader, Sparkles, FileDown } from "lucide-react";

function formatAIResponse(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#{1,6}\s+/gm, '').trim();
}


// 💰 Formatação padrão brasileiro
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export default function PriceSimulator({ onBack }: { onBack: () => void }) {
  const [productName, setProductName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [productionCost, setProductionCost] = useState("");
  const [desiredMargin, setDesiredMargin] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

  async function handleSimulate() {
    if (!productName || !basePrice) {
      setError("Preencha nome e preço base");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/premium/simulate-scenarios", {
        productName,
        basePrice: parseFloat(basePrice),
        productionCost: productionCost ? parseFloat(productionCost) : null,
        desiredMargin: desiredMargin ? parseFloat(desiredMargin) : null
      });

      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError("Ferramenta exclusiva para plano Business!");
      } else {
        setError(err.response?.data?.message || "Erro ao simular");
      }
    } finally {
      setLoading(false);
    }
  }

  // 📄 EXPORTAR SIMULAÇÃO EM PDF
  async function exportToPDF() {
    if (!result || !result.simulationId) {
      alert('Nenhuma simulação para exportar');
      return;
    }

    try {
      setExportingPDF(true);
      const response = await api.post('/reports/simulation-pdf',
        { simulationId: result.simulationId },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `simulacao-${productName.replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF');
    } finally {
      setExportingPDF(false);
    }
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 pb-12 sm:pb-20 text-white">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Simulador de Cenários</h1>
                <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold">
                  🔥 BUSINESS EXCLUSIVO
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Simule 3 cenários automáticos e descubra o melhor preço
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full sm:w-auto text-sm text-zinc-400 hover:text-yellow-400 transition"
          >
            ← Voltar
          </button>
        </div>

        {/* FORMULÁRIO */}
        {!result && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm text-zinc-300 mb-2">
                    Nome do produto *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Tênis Nike Air Max"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">
                    Preço base (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="299.90"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">
                    Custo de produção (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productionCost}
                    onChange={(e) => setProductionCost(e.target.value)}
                    placeholder="120.00"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">
                    Margem desejada (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={desiredMargin}
                    onChange={(e) => setDesiredMargin(e.target.value)}
                    placeholder="35"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Simular Cenários
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO */}
        {result && (
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* CABEÇALHO COM BOTÃO EXPORT */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Cenários Simulados</h2>
              
              {/* 🔥 BOTÃO EXPORTAR PDF */}
              <button
                onClick={exportToPDF}
                disabled={exportingPDF}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl transition disabled:opacity-50 text-sm"
              >
                <FileDown size={18} />
                {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </button>
            </div>

            {/* CENÁRIOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* CONSERVADOR */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-blue-400 mb-4">Conservador</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Preço</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-300 break-words">
                      R$ {result.scenarios.conservative.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Vendas/mês</p>
                    <p className="text-lg sm:text-xl font-semibold">{result.scenarios.conservative.estimatedSales}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Receita</p>
                    <p className="text-lg sm:text-xl font-semibold text-green-400 break-words">
                      R$ {result.scenarios.conservative.revenue.toFixed(2)}
                    </p>
                  </div>
                  {result.scenarios.conservative.profit && (
                    <div>
                      <p className="text-xs sm:text-sm text-zinc-400">Lucro</p>
                      <p className="text-lg sm:text-xl font-semibold text-yellow-400 break-words">
                        R$ {result.scenarios.conservative.profit.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* REALISTA */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 ring-2 ring-green-500/50">
                <h3 className="text-base sm:text-lg font-bold text-green-400 mb-4">Realista ⭐</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Preço</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-300 break-words">
                      R$ {result.scenarios.realistic.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Vendas/mês</p>
                    <p className="text-lg sm:text-xl font-semibold">{result.scenarios.realistic.estimatedSales}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Receita</p>
                    <p className="text-lg sm:text-xl font-semibold text-green-400 break-words">
                      R$ {result.scenarios.realistic.revenue.toFixed(2)}
                    </p>
                  </div>
                  {result.scenarios.realistic.profit && (
                    <div>
                      <p className="text-xs sm:text-sm text-zinc-400">Lucro</p>
                      <p className="text-lg sm:text-xl font-semibold text-yellow-400 break-words">
                        R$ {result.scenarios.realistic.profit.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* OTIMISTA */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-yellow-400 mb-4">Otimista</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Preço</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-300 break-words">
                      R$ {result.scenarios.optimistic.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Vendas/mês</p>
                    <p className="text-lg sm:text-xl font-semibold">{result.scenarios.optimistic.estimatedSales}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-zinc-400">Receita</p>
                    <p className="text-lg sm:text-xl font-semibold text-green-400 break-words">
                      R$ {result.scenarios.optimistic.revenue.toFixed(2)}
                    </p>
                  </div>
                  {result.scenarios.optimistic.profit && (
                    <div>
                      <p className="text-xs sm:text-sm text-zinc-400">Lucro</p>
                      <p className="text-lg sm:text-xl font-semibold text-yellow-400 break-words">
                        R$ {result.scenarios.optimistic.profit.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ANÁLISE */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-lg sm:text-xl font-bold">Análise de Viabilidade</h2>
              </div>

              <p className="text-sm sm:text-base text-zinc-300 whitespace-pre-wrap leading-relaxed break-words">
                {formatAIResponse(result.analysis)}
              </p>
            </div>

            {/* AÇÕES */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-sm sm:text-base"
              >
                Nova Simulação
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition text-sm sm:text-base"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}