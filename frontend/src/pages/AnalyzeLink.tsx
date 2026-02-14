import { useState } from "react";
import { api } from "../services/api";
import { Link2, Loader, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import ProgressBar from "../components/ui/Progressbar";

// 🔥 FUNÇÃO PARA LIMPAR MARKDOWN
function formatAIResponse(text: string): string {
  return text
    .replace(/\*\*/g, '')        // Remove **
    .replace(/\*/g, '')          // Remove *
    .replace(/^#{1,6}\s+/gm, '') // Remove ## ### etc
    .replace(/`/g, '')           // Remove `
    .trim();
}

function AnalyzeLink({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!url) {
      setError("Por favor, insira uma URL");
      return;
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      setError("URL inválida. Exemplo: https://exemplo.com");
      return;
    }

    setLoading(true);
    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post("/premium/analyze-link", { url });
      setResult(response.data);
    } catch (err: any) {
      setIsAnalyzing(false);
      if (err.response?.data?.upgrade) {
        setError("Recurso exclusivo para plano Premium. Faça upgrade!");
      } else {
        setError(err.response?.data?.message || "Erro ao analisar link");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="gold-bg" />

      <ProgressBar 
        isActive={isAnalyzing}
        onComplete={() => {
          console.log('✅ ProgressBar completado!');
          setIsAnalyzing(false);
        }}
      />

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
                <Link2 className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Análise por Link</h1>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Cole o link da sua página de vendas para análise completa de copy, preço e oferta.
            </p>
          </div>

          {/* INPUT AREA */}
          {!result && (
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <label className="block mb-4">
                <span className="text-sm font-medium text-zinc-300 mb-2 block">
                  URL da página de vendas
                </span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="https://exemplo.com/produto"
                    className="flex-1 px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 focus:outline-none transition text-sm sm:text-base"
                    disabled={loading}
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !url}
                    className="w-full sm:w-auto px-6 py-3 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader className="animate-spin" size={20} />
                    ) : (
                      "Analisar"
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-400">
                  <XCircle size={18} className="flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* EXEMPLOS */}
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-zinc-800/50 rounded-xl sm:rounded-2xl">
                <p className="text-sm font-medium mb-3">💡 Exemplos de páginas:</p>
                <ul className="text-xs sm:text-sm text-zinc-400 space-y-2">
                  <li>• Página de produto no Mercado Livre</li>
                  <li>• Produto na Amazon</li>
                  <li>• Página de produto em e-commerce</li>
                  <li>• Anúncio de marketplace</li>
                </ul>
              </div>
            </div>
          )}

          {/* RESULTADO */}
          {result && !isAnalyzing && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              {/* SUCCESS */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <p className="font-semibold text-sm sm:text-base">Página analisada com sucesso!</p>
                </div>
              </div>

              {/* DADOS EXTRAÍDOS */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-semibold text-base sm:text-lg">Informações Extraídas</h3>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-yellow-400 hover:text-yellow-300 transition flex items-center gap-2"
                  >
                    Ver página <ExternalLink size={14} />
                  </a>
                </div>

                <div className="space-y-3">
                  {result.extractedData?.title && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Título</p>
                      <p className="text-sm font-medium break-words">{result.extractedData.title}</p>
                    </div>
                  )}

                  {result.extractedData?.price && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Preço Encontrado</p>
                      <p className="text-base sm:text-lg font-bold text-green-400">{result.extractedData.price}</p>
                    </div>
                  )}

                  {result.extractedData?.description && (
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Descrição</p>
                      <p className="text-sm text-zinc-300 break-words">{result.extractedData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ANÁLISE DA IA */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <h3 className="font-semibold mb-4 text-yellow-400 text-base sm:text-lg">
                  Análise Inteligente da Página
                </h3>
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-sm sm:text-base break-words">
                    {formatAIResponse(result.analysis)}
                  </p>
                </div>
              </div>

              {/* AÇÕES */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setUrl("");
                  }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-sm sm:text-base"
                >
                  Analisar outro link
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

export default AnalyzeLink;