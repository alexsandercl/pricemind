import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { Upload, Download, Loader, CheckCircle, AlertCircle, Trash2, Eye } from "lucide-react";

// 💰 Formatação padrão brasileiro
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Batch = {
  id: string;
  fileName: string;
  totalProducts: number;
  processed: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
};

type Result = {
  produto: string;
  precoAtual: number;
  categoria: string;
  recomendacao: string;
  analise: string;
  status: string;
};

export default function BatchAnalysis({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [, setLoadingBatches] = useState(true);
  const [error, setError] = useState("");
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBatches();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  async function loadBatches() {
    try {
      const response = await api.get('/batch/list');
      setBatches(response.data.batches);
    } catch (error) {
      console.error('Erro ao carregar batches:', error);
    } finally {
      setLoadingBatches(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Apenas arquivos CSV são permitidos');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  }

  async function handleUpload() {
    if (!file) {
      setError('Selecione um arquivo CSV');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/batch/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCurrentBatch({
        id: response.data.batchId,
        totalProducts: response.data.totalProducts,
        processed: 0,
        status: 'processing'
      });

      // Começar polling
      startPolling(response.data.batchId);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError('Análise em Lote é exclusiva do plano Business! Faça upgrade.');
      } else {
        setError(err.response?.data?.message || 'Erro ao fazer upload');
      }
    } finally {
      setUploading(false);
    }
  }

  function startPolling(batchId: string) {
    if (pollInterval.current) clearInterval(pollInterval.current);

    pollInterval.current = setInterval(async () => {
      try {
        const response = await api.get(`/batch/${batchId}/status`);
        setCurrentBatch(response.data);

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          if (pollInterval.current) clearInterval(pollInterval.current);
          loadBatches();
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 2000);
  }

  async function viewBatchResults(batchId: string) {
    try {
      const response = await api.get(`/batch/${batchId}/status`);
      setCurrentBatch(response.data);
    } catch (error) {
      console.error('Erro ao carregar resultados:', error);
    }
  }

  async function exportResults(batchId: string, fileName: string) {
    try {
      const response = await api.get(`/batch/${batchId}/export`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analise-lote-${fileName.replace('.csv', '')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar resultados');
    }
  }

  async function deleteBatch(batchId: string) {
    if (!confirm('Tem certeza que deseja deletar esta análise em lote?')) return;

    try {
      await api.delete(`/batch/${batchId}`);
      loadBatches();
      if (currentBatch?.id === batchId) {
        setCurrentBatch(null);
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  }

  function downloadTemplate() {
    const csvContent = `nome,preco,categoria,descricao,custoProducao,margemDesejada
Tênis Nike Air Max,299.90,Calçados,Tênis esportivo Nike Air Max tamanho 42,120.00,40
Fone Bluetooth JBL,89.90,Eletrônicos,Fone de ouvido sem fio com cancelamento de ruído,35.00,50
Smartwatch Samsung,449.00,Eletrônicos,Relógio inteligente com monitor cardíaco,,35`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-analise-lote.csv';
    link.click();
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
                <Upload className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Análise em Lote</h1>
                <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold">
                  🔥 BUSINESS EXCLUSIVO
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Analise dezenas ou centenas de produtos de uma vez
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full sm:w-auto text-sm text-zinc-400 hover:text-yellow-400 transition"
          >
            ← Voltar
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* ÁREA DE UPLOAD */}
          <div className="bg-zinc-900/80 border-2 border-dashed border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <div className="space-y-6">
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />

                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer inline-flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Upload className="text-yellow-400 w-7 h-7 sm:w-10 sm:h-10" />
                  </div>

                  {file ? (
                    <div className="px-4">
                      <p className="text-base sm:text-lg font-semibold text-yellow-400 mb-2 break-words">
                        {file.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="px-4">
                      <p className="text-base sm:text-lg font-semibold mb-2">
                        Clique para selecionar arquivo CSV
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        Ou arraste e solte aqui
                      </p>
                    </div>
                  )}
                </label>

                {error && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-red-400 px-4">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {file && !uploading && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleUpload}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg transition"
                    >
                      Iniciar Análise em Lote
                    </button>
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {uploading && (
                  <div className="mt-6 flex items-center justify-center gap-3 text-yellow-400">
                    <Loader className="animate-spin" size={20} />
                    <p className="text-sm sm:text-base">Processando arquivo...</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-700">
                <p className="text-sm text-zinc-400 text-center sm:text-left">
                  💡 Baixe o template para ver o formato correto
                </p>
                <button
                  onClick={downloadTemplate}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-sm"
                >
                  <Download size={16} />
                  Baixar Template CSV
                </button>
              </div>
            </div>
          </div>

          {/* PROCESSAMENTO ATUAL */}
          {currentBatch && currentBatch.status === 'processing' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Loader className="animate-spin text-blue-400" size={24} />
                Processando...
              </h2>
              <p className="text-zinc-300 mb-4">
                {currentBatch.processed} de {currentBatch.totalProducts} produtos analisados
              </p>
              <div className="w-full bg-zinc-800 rounded-full h-3 sm:h-4">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(currentBatch.processed / currentBatch.totalProducts) * 100}%` }}
                />
              </div>
              <p className="text-sm text-zinc-400 mt-2">
                Isso pode levar alguns minutos dependendo da quantidade de produtos...
              </p>
            </div>
          )}

          {/* RESULTADOS */}
          {currentBatch && currentBatch.status === 'completed' && currentBatch.results && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="text-green-400 flex-shrink-0" size={24} />
                  Análise Concluída!
                </h2>
                <button
                  onClick={() => exportResults(currentBatch.id, 'resultados')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl transition text-sm"
                >
                  <Download size={18} />
                  Exportar Excel
                </button>
              </div>

              <div className="bg-black/30 rounded-xl p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-green-400">
                      {currentBatch.results.filter((r: any) => r.recomendacao === 'AUMENTAR').length}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-400">Aumentar</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-red-400">
                      {currentBatch.results.filter((r: any) => r.recomendacao === 'DIMINUIR').length}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-400">Diminuir</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-400">
                      {currentBatch.results.filter((r: any) => r.recomendacao === 'MANTER').length}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-400">Manter</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-zinc-400">
                      {currentBatch.totalProducts}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-400">Total</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentBatch.results.map((result: Result, idx: number) => (
                  <div
                    key={idx}
                    className="bg-black/30 rounded-xl p-4 hover:bg-black/50 transition cursor-pointer"
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold break-words">{result.produto}</p>
                        <p className="text-sm text-zinc-400">
                          R$ {formatBRL(result.precoAtual)} • {result.categoria}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                          result.recomendacao === 'AUMENTAR' ? 'bg-green-500/20 text-green-400' :
                          result.recomendacao === 'DIMINUIR' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {result.recomendacao}
                        </span>
                        <Eye size={18} className="text-zinc-400 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTÓRICO */}
          {batches.length > 0 && (
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold mb-6">📋 Histórico de Análises</h2>
              <div className="space-y-3">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-black/30 rounded-xl p-4 hover:bg-black/50 transition"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold break-words">{batch.fileName}</p>
                        <p className="text-sm text-zinc-400">
                          {batch.totalProducts} produtos • {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {batch.status === 'completed' && (
                          <>
                            <button
                              onClick={() => viewBatchResults(batch.id)}
                              className="p-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                              title="Ver Resultados"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => exportResults(batch.id, batch.fileName)}
                              className="p-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-lg transition"
                              title="Exportar Excel"
                            >
                              <Download size={18} />
                            </button>
                          </>
                        )}
                        {batch.status === 'processing' && (
                          <span className="text-sm text-blue-400 flex items-center gap-2">
                            <Loader className="animate-spin" size={16} />
                            Processando...
                          </span>
                        )}
                        {batch.status === 'failed' && (
                          <span className="text-sm text-red-400 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Falhou
                          </span>
                        )}
                        <button
                          onClick={() => deleteBatch(batch.id)}
                          className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                          title="Deletar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE DETALHES */}
        {selectedResult && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-8"
            onClick={() => setSelectedResult(null)}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-4 break-words">{selectedResult.produto}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400">Preço Atual</p>
                  <p className="text-2xl font-bold text-green-400">R$ {formatBRL(selectedResult.precoAtual)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Categoria</p>
                  <p className="text-lg">{selectedResult.categoria}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Recomendação</p>
                  <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    selectedResult.recomendacao === 'AUMENTAR' ? 'bg-green-500/20 text-green-400' :
                    selectedResult.recomendacao === 'DIMINUIR' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedResult.recomendacao}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Análise</p>
                  <div className="bg-black/50 rounded-xl p-4 text-zinc-300 whitespace-pre-wrap break-words text-sm sm:text-base">
                    {selectedResult.analise}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}