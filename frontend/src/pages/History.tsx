import { useEffect, useState } from "react";
import { api } from "../services/api";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  X,
  Calendar,
  DollarSign,
  Tag
} from "lucide-react";
import { exportAnalysisToPDF } from "../utils/pdfExporter";

type Analysis = {
  id: string;
  productName: string;
  price: number;
  category: string;
  description?: string;
  aiResponse: string;
  createdAt: string;
};

export default function History({ onBack }: { onBack: () => void }) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Filtros
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // UI States
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Categorias únicas para filtro
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, [page, limit, search, category, minPrice, maxPrice, sortBy, sortOrder]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        sortBy,
        sortOrder
      });

      const res = await api.get(`/stats/history?${params}`);
      setAnalyses(res.data.analyses);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/stats/history?limit=1000");
      const uniqueCategories = [...new Set(
        res.data.analyses.map((a: Analysis) => a.category).filter(Boolean)
      )];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/stats/analysis/${id}`);
      setDeleteConfirm(null);
      loadHistory();
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  }

  function handleExport(analysis: Analysis) {
    exportAnalysisToPDF(analysis);
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }

  const hasFilters = search || category || minPrice || maxPrice;

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 pb-12 sm:pb-20 text-white animate-fadeIn">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
              📊 Histórico de Análises
            </h1>
            <p className="text-sm sm:text-base text-zinc-400">
              {total} {total === 1 ? 'análise' : 'análises'} encontrada{total !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>

        {/* BARRA DE BUSCA E FILTROS */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nome do produto..."
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition text-sm sm:text-base"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Botão Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl border transition flex items-center justify-center gap-2 ${
                showFilters || hasFilters
                  ? 'bg-yellow-500 text-black border-yellow-400'
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <Filter size={20} />
              Filtros
              {hasFilters && <span className="text-xs">(ativos)</span>}
            </button>

            {/* Itens por página */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full sm:w-auto px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none text-sm"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>

          {/* Painel de Filtros */}
          {showFilters && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 sm:p-6 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Categoria */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <Tag size={16} />
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg focus:border-yellow-500 outline-none text-sm"
                  >
                    <option value="">Todas</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Preço Mínimo */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <DollarSign size={16} />
                    Preço Mínimo
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPage(1);
                    }}
                    placeholder="R$ 0"
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg focus:border-yellow-500 outline-none text-sm"
                  />
                </div>

                {/* Preço Máximo */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
                    <DollarSign size={16} />
                    Preço Máximo
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPage(1);
                    }}
                    placeholder="R$ 10000"
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg focus:border-yellow-500 outline-none text-sm"
                  />
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* LISTA/TABELA */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl sm:rounded-2xl p-8 sm:p-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-zinc-600 w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Nenhuma análise encontrada</h3>
            <p className="text-sm sm:text-base text-zinc-400 mb-6">
              {hasFilters 
                ? 'Tente ajustar seus filtros de busca'
                : 'Você ainda não fez nenhuma análise'
              }
            </p>
            {hasFilters ? (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition"
              >
                Limpar filtros
              </button>
            ) : (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition"
              >
                Fazer primeira análise
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Cards para mobile, tabela para desktop */}
            <div className="space-y-4">
              {/* Desktop: Tabela */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Produto</th>
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Categoria</th>
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Preço</th>
                      <th className="text-left p-4 text-sm font-semibold text-zinc-400">Data</th>
                      <th className="text-right p-4 text-sm font-semibold text-zinc-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((analysis) => (
                      <tr key={analysis.id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition">
                        <td className="p-4">
                          <p className="font-medium">{analysis.productName}</p>
                          {analysis.description && (
                            <p className="text-xs text-zinc-500 truncate max-w-xs">{analysis.description}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs">{analysis.category}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-green-400 font-bold">R$ {analysis.price.toFixed(2)}</span>
                        </td>
                        <td className="p-4 text-sm text-zinc-400">
                          {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedAnalysis(analysis)}
                              className="p-2 hover:bg-zinc-800 rounded-lg transition"
                              title="Ver detalhes"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleExport(analysis)}
                              className="p-2 hover:bg-zinc-800 rounded-lg transition"
                              title="Exportar PDF"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(analysis.id)}
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                              title="Deletar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet: Cards */}
              <div className="lg:hidden space-y-4">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold mb-1 break-words">{analysis.productName}</h3>
                        <p className="text-xs text-zinc-500">{analysis.category}</p>
                      </div>
                      <span className="text-green-400 font-bold whitespace-nowrap ml-3">
                        R$ {analysis.price.toFixed(2)}
                      </span>
                    </div>

                    {analysis.description && (
                      <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{analysis.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">
                        {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition"
                          title="Ver"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleExport(analysis)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition"
                          title="Exportar"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(analysis.id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
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

            {/* PAGINAÇÃO */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-zinc-900 border border-zinc-700 rounded-xl">
                <p className="text-sm text-zinc-400 text-center sm:text-left">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL DE DETALHES */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4 sm:p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold break-words">{selectedAnalysis.productName}</h2>
                  <p className="text-sm text-zinc-400 mt-1">{selectedAnalysis.category}</p>
                </div>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition flex-shrink-0"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Preço</p>
                    <p className="text-2xl font-bold text-green-400">R$ {selectedAnalysis.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Data da Análise</p>
                    <p className="text-lg font-semibold">{new Date(selectedAnalysis.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {selectedAnalysis.description && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Descrição</p>
                    <p className="text-sm text-zinc-300 break-words">{selectedAnalysis.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-zinc-500 mb-2">Análise IA</p>
                  <div className="bg-black/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                      {selectedAnalysis.aiResponse}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleExport(selectedAnalysis)}
                    className="flex-1 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE DELETE */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Confirmar exclusão</h3>
              <p className="text-zinc-400 mb-6">
                Tem certeza que deseja deletar esta análise? Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
                >
                  Sim, deletar
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}