import { useState } from "react";
import { api } from "../services/api";
import { BarChart3, Download, Loader } from "lucide-react";

export default function ExecutiveDashboard({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);

  async function downloadDashboard() {
    try {
      setLoading(true);
      const response = await api.get('/reports/executive-dashboard', {
        responseType: 'blob'
      });

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-executivo-${month}-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao gerar dashboard:', error);
      alert('Erro ao gerar dashboard executivo');
    } finally {
      setLoading(false);
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Executivo</h1>
                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-bold">
                  📊 RELATÓRIO MENSAL
                </span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-zinc-400">
              Resumo completo do mês atual em formato executivo
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="text-purple-400 w-10 h-10 sm:w-12 sm:h-12" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3">
                  Gerar Relatório Executivo
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
                  Baixe um PDF profissional com o resumo completo de todas as suas análises,
                  métricas e insights do mês atual.
                </p>
              </div>

              <div className="bg-black/50 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-left max-w-md mx-auto">
                <h3 className="font-semibold mb-3 text-purple-400 text-sm sm:text-base">O relatório inclui:</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>Total de análises realizadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>Preço médio dos produtos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>Categorias mais analisadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>Status do plano atual</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span>Últimas 5 análises</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={downloadDashboard}
                disabled={loading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3 mx-auto text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Gerando relatório...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    <span className="hidden sm:inline">Baixar Dashboard Executivo (PDF)</span>
                    <span className="sm:hidden">Baixar Dashboard (PDF)</span>
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-500 px-4">
                O relatório é gerado com os dados do mês atual ({new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })})
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}