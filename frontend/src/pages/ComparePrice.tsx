import { useState } from "react";
import { api } from "../services/api";
import { Target, Sparkles, Loader, Plus, Trash2, FileDown } from "lucide-react";

// 💰 Formatação padrão brasileiro
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 🔥 FUNÇÃO PARA LIMPAR MARKDOWN
function formatAIResponse(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`/g, '')
    .trim();
}

type Competitor = {
  name: string;
  price: string;
  features: string;
};

export default function ComparePrice({ onBack }: { onBack: () => void }) {
  const [myProduct, setMyProduct] = useState({
    name: "",
    price: "",
    features: ""
  });

  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: "", price: "", features: "" }
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

  function addCompetitor() {
    if (competitors.length >= 5) {
      setError("Máximo de 5 concorrentes");
      return;
    }
    setCompetitors([...competitors, { name: "", price: "", features: "" }]);
    setError("");
  }

  function removeCompetitor(index: number) {
    setCompetitors(competitors.filter((_, i) => i !== index));
  }

  function updateCompetitor(index: number, field: keyof Competitor, value: string) {
    const updated = [...competitors];
    updated[index][field] = value;
    setCompetitors(updated);
  }

  async function handleCompare() {
    if (!myProduct.name || !myProduct.price) {
      setError("Preencha nome e preço do seu produto");
      return;
    }

    const validCompetitors = competitors.filter(c => c.name && c.price);

    if (validCompetitors.length === 0) {
      setError("Adicione pelo menos 1 concorrente");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/premium/compare-price", {
        myProduct: {
          name: myProduct.name,
          price: parseFloat(myProduct.price),
          features: myProduct.features
        },
        competitors: validCompetitors.map(c => ({
          name: c.name,
          price: parseFloat(c.price),
          features: c.features
        }))
      });

      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError("Ferramenta exclusiva para plano Business! Faça upgrade.");
      } else {
        setError(err.response?.data?.message || "Erro ao comparar preços");
      }
    } finally {
      setLoading(false);
    }
  }

  // 📄 EXPORTAR COMPARAÇÃO EM PDF
  async function exportToPDF() {
    if (!result || !result.comparisonId) {
      alert('Nenhuma comparação para exportar');
      return;
    }

    try {
      setExportingPDF(true);
      const response = await api.post('/reports/comparison-pdf',
        { comparisonId: result.comparisonId },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comparacao-${myProduct.name.replace(/\s+/g, '-')}.pdf`);
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
                <Target className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Comparador de Preços</h1>
                <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold">
                  🔥 BUSINESS EXCLUSIVO
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Compare seu produto com até 5 concorrentes
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
          <div className="max-w-5xl mx-auto">
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 sm:space-y-8">
              {/* SEU PRODUTO */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="text-yellow-400">💎</span> Seu Produto
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2">Nome *</label>
                    <input
                      type="text"
                      value={myProduct.name}
                      onChange={(e) => setMyProduct({...myProduct, name: e.target.value})}
                      placeholder="Tênis Nike Air Max Branco"
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={myProduct.price}
                      onChange={(e) => setMyProduct({...myProduct, price: e.target.value})}
                      placeholder="299.90"
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-zinc-300 mb-2">Diferenciais</label>
                    <textarea
                      value={myProduct.features}
                      onChange={(e) => setMyProduct({...myProduct, features: e.target.value})}
                      placeholder="Ex: Entrega grátis, garantia 1 ano, tamanho 42..."
                      className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition resize-none text-sm sm:text-base"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* CONCORRENTES */}
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <span className="text-red-400">🎯</span> Concorrentes
                  </h2>
                  <button
                    onClick={addCompetitor}
                    disabled={competitors.length >= 5}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition text-sm"
                  >
                    <Plus size={16} />
                    Adicionar concorrente
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {competitors.map((competitor, idx) => (
                    <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-zinc-400">Concorrente {idx + 1}</h3>
                        {competitors.length > 1 && (
                          <button
                            onClick={() => removeCompetitor(idx)}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm text-zinc-400 mb-2">Nome *</label>
                          <input
                            type="text"
                            value={competitor.name}
                            onChange={(e) => updateCompetitor(idx, "name", e.target.value)}
                            placeholder="Loja Concorrente"
                            className="w-full px-4 py-2 sm:py-3 bg-black border border-zinc-700 rounded-lg focus:border-yellow-500 outline-none transition text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-zinc-400 mb-2">Preço (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={competitor.price}
                            onChange={(e) => updateCompetitor(idx, "price", e.target.value)}
                            placeholder="197.00"
                            className="w-full px-4 py-2 sm:py-3 bg-black border border-zinc-700 rounded-lg focus:border-yellow-500 outline-none transition text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm text-zinc-400 mb-2">Diferenciais</label>
                          <textarea
                            value={competitor.features}
                            onChange={(e) => updateCompetitor(idx, "features", e.target.value)}
                            placeholder="O que este concorrente oferece..."
                            className="w-full px-4 py-2 sm:py-3 bg-black border border-zinc-700 rounded-lg focus:border-yellow-500 outline-none transition resize-none text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleCompare}
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Comparando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Comparar Preços
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO */}
        {result && (
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* HEADER COM EXPORT */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">Análise Comparativa</h2>
              <button
                onClick={exportToPDF}
                disabled={exportingPDF}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl transition disabled:opacity-50 text-sm"
              >
                <FileDown size={18} />
                {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </button>
            </div>

            {/* GRID COMPARATIVO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* SEU PRODUTO */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="text-xs text-yellow-400 font-semibold">SEU PRODUTO</p>
                    <h3 className="font-bold break-words">{result.myProduct.name}</h3>
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-3">
                  R$ {formatBRL(result.myProduct.price)}
                </p>
                {result.myProduct.features && (
                  <p className="text-xs sm:text-sm text-zinc-300 break-words">{result.myProduct.features}</p>
                )}
              </div>

              {/* CONCORRENTES */}
              {result.competitors.map((comp: any, idx: number) => (
                <div key={idx} className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-xs text-zinc-400 font-semibold">CONCORRENTE {idx + 1}</p>
                      <h3 className="font-bold text-sm sm:text-base break-words">{comp.name}</h3>
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-400 mb-3">
                    R$ {formatBRL(comp.price)}
                  </p>
                  {comp.features && (
                    <p className="text-xs sm:text-sm text-zinc-400 break-words">{comp.features}</p>
                  )}
                </div>
              ))}
            </div>

            {/* INSIGHTS */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
                <h2 className="text-lg sm:text-xl font-bold">Análise Competitiva</h2>
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
                Nova Comparação
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