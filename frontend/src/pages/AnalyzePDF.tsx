import { useState } from "react";
import { api } from "../services/api";
import { FileText, Upload, Loader, CheckCircle, XCircle } from "lucide-react";

// 🔥 FUNÇÃO PARA LIMPAR MARKDOWN
function formatAIResponse(text: string): string {
  return text
    .replace(/\*\*/g, '')        // Remove **
    .replace(/\*/g, '')          // Remove *
    .replace(/^#{1,6}\s+/gm, '') // Remove ## ### etc
    .replace(/`/g, '')           // Remove `
    .trim();
}

export default function AnalyzePDF({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setError("Por favor, selecione um arquivo PDF");
    }
  }

  async function handleAnalyze() {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await api.post("/premium/analyze-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(response.data);
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError("Recurso exclusivo para plano Premium. Faça upgrade!");
      } else {
        setError(err.response?.data?.message || "Erro ao analisar PDF");
      }
    } finally {
      setLoading(false);
    }
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
                <FileText className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Análise por PDF</h1>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Envie seu e-book, catálogo ou PDF de produto para análise inteligente de preço.
            </p>
          </div>

          {/* UPLOAD AREA */}
          {!result && (
            <div className="bg-zinc-900/80 border-2 border-dashed border-zinc-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
              <div className="text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                />

                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer inline-flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Upload className="text-yellow-400 w-7 h-7 sm:w-8 sm:h-8" />
                  </div>

                  {file ? (
                    <div className="px-4">
                      <p className="text-base sm:text-lg font-semibold text-yellow-400 mb-2 break-words">
                        {file.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="px-4">
                      <p className="text-base sm:text-lg font-semibold mb-2">
                        Clique para selecionar PDF
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        Ou arraste e solte aqui (máx. 10MB)
                      </p>
                    </div>
                  )}
                </label>

                {error && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-red-400 px-4">
                    <XCircle size={18} className="flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {file && !loading && (
                  <button
                    onClick={handleAnalyze}
                    className="mt-8 px-6 py-3 sm:px-8 sm:py-4 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition w-full sm:w-auto"
                  >
                    Analisar PDF
                  </button>
                )}

                {loading && (
                  <div className="mt-8 flex flex-col items-center gap-3 text-yellow-400 px-4">
                    <Loader className="animate-spin" size={20} />
                    <p className="text-sm sm:text-base">Analisando PDF...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESULTADO */}
          {result && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              {/* SUCCESS */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <p className="font-semibold text-sm sm:text-base">PDF analisado com sucesso!</p>
                </div>
              </div>

              {/* METADATA */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="font-semibold mb-4 text-base sm:text-lg">Informações do Arquivo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-400 mb-1">Nome do arquivo</p>
                    <p className="font-medium break-all">{result.metadata.fileName}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 mb-1">Páginas</p>
                    <p className="font-medium">{result.metadata.pages}</p>
                  </div>
                </div>
              </div>

              {/* ANÁLISE DA IA */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <h3 className="font-semibold mb-4 text-yellow-400 text-base sm:text-lg">
                  Análise Inteligente
                </h3>
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-sm sm:text-base break-words">
                    {formatAIResponse(result.analysis)}
                  </p>
                </div>
              </div>

              {/* TEXTO EXTRAÍDO */}
              {result.extractedText && (
                <details className="bg-zinc-900/50 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <summary className="cursor-pointer font-semibold text-zinc-400 hover:text-white transition text-sm sm:text-base">
                    Ver texto extraído do PDF
                  </summary>
                  <div className="mt-4 p-4 bg-black/50 rounded-lg">
                    <p className="text-xs text-zinc-400 font-mono whitespace-pre-wrap break-words">
                      {result.extractedText}
                    </p>
                  </div>
                </details>
              )}

              {/* AÇÕES */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-sm sm:text-base"
                >
                  Analisar outro PDF
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