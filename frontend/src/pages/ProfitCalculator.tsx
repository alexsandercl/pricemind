import { useState } from "react";
import { api } from "../services/api";
import { Calculator, DollarSign, TrendingUp, Loader } from "lucide-react";

// 🔥 FUNÇÃO PARA LIMPAR MARKDOWN
function formatAIResponse(text: string): string {
  return text
    .replace(/\*\*/g, '')        // Remove **
    .replace(/\*/g, '')          // Remove *
    .replace(/^#{1,6}\s+/gm, '') // Remove ## ### etc
    .replace(/`/g, '')           // Remove `
    .trim();
}

export default function ProfitCalculator({ onBack }: { onBack: () => void }) {
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [productionCost, setProductionCost] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [taxes, setTaxes] = useState("");
  const [otherCosts, setOtherCosts] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleCalculate() {
    if (!productName || !sellingPrice || !productionCost) {
      setError("Preencha pelo menos nome, preço de venda e custo de produção");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/premium/profit-calculator", {
        productName,
        sellingPrice: parseFloat(sellingPrice),
        productionCost: parseFloat(productionCost),
        platformFee: parseFloat(platformFee) || 0,
        taxes: parseFloat(taxes) || 0,
        otherCosts: parseFloat(otherCosts) || 0,
      });

      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError("Recurso exclusivo para plano Premium. Faça upgrade!");
      } else {
        setError(err.response?.data?.message || "Erro ao calcular lucro");
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setProductName("");
    setSellingPrice("");
    setProductionCost("");
    setPlatformFee("");
    setTaxes("");
    setOtherCosts("");
    setResult(null);
    setError("");
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 pb-12 sm:pb-20 text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <button
            onClick={onBack}
            className="text-sm text-zinc-400 hover:text-yellow-400 transition"
          >
            ← Voltar
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Calculator className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Calculadora de Lucro</h1>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Calcule margem de lucro, lucro líquido e obtenha sugestões inteligentes de otimização.
            </p>
          </div>

          {/* FORMULÁRIO */}
          {!result && (
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <div className="space-y-4 sm:space-y-6">
                {/* NOME DO PRODUTO */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Curso de Marketing Digital"
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none transition text-sm sm:text-base"
                  />
                </div>

                {/* PREÇO E CUSTOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Preço de Venda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="297.00"
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none transition text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Custo de Produção (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productionCost}
                      onChange={(e) => setProductionCost(e.target.value)}
                      placeholder="50.00"
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none transition text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* CUSTOS ADICIONAIS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Taxa Plataforma (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      placeholder="29.70"
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none transition text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Impostos (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxes}
                      onChange={(e) => setTaxes(e.target.value)}
                      placeholder="15.00"
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none transition text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Outros Custos (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherCosts}
                      onChange={(e) => setOtherCosts(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none transition text-sm sm:text-base"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="w-full py-3 sm:py-4 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="animate-spin" size={20} />
                      Calculando...
                    </span>
                  ) : (
                    "Calcular Lucro"
                  )}
                </button>
              </div>

              {/* DICAS */}
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-zinc-800/50 rounded-xl sm:rounded-2xl">
                <p className="text-sm font-medium mb-3">💡 Dicas de preenchimento:</p>
                <ul className="text-xs sm:text-sm text-zinc-400 space-y-2">
                  <li>• <strong>Custo de Produção:</strong> Materiais, mão de obra, hospedagem</li>
                  <li>• <strong>Taxa Plataforma:</strong> Hotmart (9.9%), Eduzz (9.9%), Kiwify (4.99%)</li>
                  <li>• <strong>Impostos:</strong> MEI (~6%), Simples Nacional (variável)</li>
                  <li>• <strong>Outros Custos:</strong> Tráfego pago, afiliados, etc</li>
                </ul>
              </div>
            </div>
          )}

          {/* RESULTADO */}
          {result && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              {/* CARDS DE RESULTADO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <ResultCard
                  icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
                  label="Lucro Líquido"
                  value={`R$ ${result.netProfit.toFixed(2)}`}
                  color="green"
                />
                <ResultCard
                  icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
                  label="Margem de Lucro"
                  value={`${result.profitMargin.toFixed(1)}%`}
                  color="yellow"
                />
                <ResultCard
                  icon={<Calculator className="w-5 h-5 sm:w-6 sm:h-6" />}
                  label="Custo Total"
                  value={`R$ ${result.totalCost.toFixed(2)}`}
                  color="red"
                />
              </div>

              {/* DETALHAMENTO */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="font-semibold mb-4 text-base sm:text-lg">Detalhamento</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Preço de Venda</span>
                    <span className="font-medium text-green-400">
                      R$ {result.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Custo de Produção</span>
                    <span className="font-medium text-red-400">
                      - R$ {result.productionCost.toFixed(2)}
                    </span>
                  </div>
                  {result.platformFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Taxa Plataforma</span>
                      <span className="font-medium text-red-400">
                        - R$ {result.platformFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {result.taxes > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Impostos</span>
                      <span className="font-medium text-red-400">
                        - R$ {result.taxes.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {result.otherCosts > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Outros Custos</span>
                      <span className="font-medium text-red-400">
                        - R$ {result.otherCosts.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-zinc-700 pt-3 flex justify-between items-center text-base sm:text-lg">
                    <span className="font-semibold">Lucro Final</span>
                    <span className="font-bold text-yellow-400">
                      R$ {result.netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SUGESTÃO DA IA */}
              {result.aiSuggestion && (
                <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                  <h3 className="font-semibold mb-4 text-yellow-400 text-base sm:text-lg">
                    Sugestões de Otimização
                  </h3>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-sm sm:text-base break-words">
                      {formatAIResponse(result.aiSuggestion)}
                    </p>
                  </div>
                </div>
              )}

              {/* AÇÕES */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-sm sm:text-base"
                >
                  Novo Cálculo
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
      </div>
    </>
  );
}

function ResultCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "from-green-500/20 to-green-600/20 border-green-500/50 text-green-400",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/50 text-yellow-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/50 text-red-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl sm:rounded-2xl p-4 sm:p-6`}
    >
      <div className="mb-3">{icon}</div>
      <p className="text-xs sm:text-sm text-zinc-300 mb-2">{label}</p>
      <p className="text-xl sm:text-2xl font-bold break-words">{value}</p>
    </div>
  );
}