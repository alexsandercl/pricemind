import { useEffect, useState } from "react";
import { api } from "../services/api";
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, Target, DollarSign } from "lucide-react";

// 🧹 FUNÇÃO PARA LIMPAR MARKDOWN
function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^[\-\*\+]\s+/gm, '• ')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function Dashboard({
  onBack,
  onLogout,
}: {
  onBack: () => void;
  onLogout: () => void;
}) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [competitorsPricing, setCompetitorsPricing] = useState("");
  const [productionCost, setProductionCost] = useState("");
  const [desiredMargin, setDesiredMargin] = useState("");
  const [differentials, setDifferentials] = useState("");
  const [goal, setGoal] = useState("");

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number | string;
    remaining: number | string;
    plan: string;
  } | null>(null);

  useEffect(() => {
    loadUsage();
  }, []);

  async function loadUsage() {
    try {
      const res = await api.get("/stats/usage");
      console.log('📊 Usage data:', res.data);
      setUsage(res.data);
    } catch (err) {
      console.error("Erro ao carregar usage:", err);
    }
  }

  async function handleAnalyze() {
    if (!productName || !price || !category) {
      setError("Preencha pelo menos: nome do produto, preço e categoria");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const response = await api.post("/ai/analyze", {
        productName,
        price: parseFloat(price),
        category,
        description: description || null,
        targetAudience: targetAudience || null,
        competitors: competitors || null,
        competitorsPricing: competitorsPricing || null,
        productionCost: productionCost ? parseFloat(productionCost) : null,
        desiredMargin: desiredMargin ? parseFloat(desiredMargin) : null,
        differentials: differentials || null,
        goal: goal || null,
      });

      const cleanedAnalysis = cleanMarkdown(response.data.analysis);
      setAnalysis(cleanedAnalysis);
      
      await loadUsage();
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        setError(
          `Você atingiu o limite de ${err.response.data.limit} análises no plano ${usage?.plan === 'pro' ? 'Pro' : 'Free'}. ${usage?.plan === 'pro' ? 'Faça upgrade para Business!' : 'Faça upgrade para continuar!'}`
        );
      } else {
        setError(err.response?.data?.message || "Erro ao analisar");
      }
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setProductName("");
    setPrice("");
    setCategory("");
    setDescription("");
    setTargetAudience("");
    setCompetitors("");
    setCompetitorsPricing("");
    setProductionCost("");
    setDesiredMargin("");
    setDifferentials("");
    setGoal("");
    setAnalysis("");
    setError("");
  }

  return (
    <>
      <div className="gold-bg" />

      <div className="relative z-10 min-h-screen px-16 pt-12 text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="text-yellow-400" size={32} />
              Análise Inteligente de Preço
            </h1>
            <p className="text-zinc-400">
              Forneça o máximo de detalhes possível para uma análise precisa
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-sm text-zinc-400 hover:text-yellow-400 transition"
            >
              ← Voltar
            </button>

            <button
              onClick={onLogout}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Sair
            </button>
          </div>
        </div>

        {/* 🔥 CONTADOR DE USO */}
        {usage && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">
                  Análises este mês
                </span>
                <span className="text-lg font-bold text-yellow-400">
                  {usage.used} /{" "}
                  {usage.limit === "unlimited" ? "∞" : usage.limit}
                </span>
              </div>

              {usage.limit !== "unlimited" && (
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        ((usage.used as number) /
                          (usage.limit as number)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              )}

              {usage.limit !== "unlimited" &&
                (usage.remaining as number) <= 3 && (
                  <p className="text-xs text-orange-400 mt-3">
                    ⚠️ Restam apenas {usage.remaining} análises no
                    plano {usage.plan === 'pro' ? 'Pro' : 'Free'}
                  </p>
                )}
            </div>
          </div>
        )}

        {/* FORMULÁRIO */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-3xl p-8">
            {/* Campos básicos */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Nome do produto *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                  placeholder="Ex: Tênis Nike Air Max Preto"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Preço atual (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                    placeholder="299.90"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Categoria/Nicho *
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                    placeholder="Ex: Calçados, Eletrônicos, Moda"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Descrição do produto
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition resize-none"
                  rows={3}
                  placeholder="Descreva o produto: tamanho, cor, material, características..."
                />
              </div>
            </div>

            {/* Toggle campos avançados */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full mb-6 px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl transition flex items-center justify-between"
            >
              <span className="text-sm text-yellow-400 font-medium flex items-center gap-2">
                <Sparkles size={16} />
                Mostrar campos avançados (opcional, mas melhora muito a análise)
              </span>
              {showAdvanced ? (
                <ChevronUp className="text-yellow-400" size={20} />
              ) : (
                <ChevronDown className="text-yellow-400" size={20} />
              )}
            </button>

            {/* Campos avançados */}
            {showAdvanced && (
              <div className="space-y-8 mb-8 animate-fadeIn">
                {/* Público e Concorrência */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-yellow-400" size={24} />
                    Mercado e Concorrência
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Público-alvo
                      </label>
                      <input
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                        placeholder="Ex: Jovens 18-35 anos, classe B/C, interessados em esportes"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Principais concorrentes
                      </label>
                      <input
                        type="text"
                        value={competitors}
                        onChange={(e) => setCompetitors(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                        placeholder="Ex: Nike Store, Netshoes, Centauro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Faixa de preço dos concorrentes (R$)
                      </label>
                      <input
                        type="text"
                        value={competitorsPricing}
                        onChange={(e) => setCompetitorsPricing(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                        placeholder="Ex: R$ 250 a R$ 350"
                      />
                    </div>
                  </div>
                </div>

                {/* Custos e Margens */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="text-yellow-400" size={24} />
                    Custos e Margens
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Custo de produção (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionCost}
                        onChange={(e) => setProductionCost(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                        placeholder="50.00"
                      />
                      {productionCost && price && (
                        <p className="text-xs text-zinc-500 mt-1">
                          Margem atual: {(((parseFloat(price) - parseFloat(productionCost)) / parseFloat(price)) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Margem desejada (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={desiredMargin}
                        onChange={(e) => setDesiredMargin(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>

                {/* Diferenciais e Objetivo */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="text-yellow-400" size={24} />
                    Estratégia
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Diferenciais do produto
                      </label>
                      <textarea
                        value={differentials}
                        onChange={(e) => setDifferentials(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition resize-none"
                        rows={2}
                        placeholder="O que torna seu produto único? Ex: Suporte 24h, garantia estendida, conteúdo exclusivo..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">
                        Objetivo principal desta análise
                      </label>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-xl focus:border-yellow-500 outline-none transition"
                      >
                        <option value="">Selecione um objetivo</option>
                        <option value="Aumentar vendas mantendo margem">Aumentar vendas mantendo margem</option>
                        <option value="Maximizar lucro">Maximizar lucro</option>
                        <option value="Ganhar market share">Ganhar participação de mercado</option>
                        <option value="Validar preço atual">Validar se preço está adequado</option>
                        <option value="Testar novo mercado">Testar entrada em novo mercado</option>
                        <option value="Reposicionar produto">Reposicionar produto (premium/econômico)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ERRO */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* BOTÕES DE AÇÃO */}
            <div className="flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 py-4 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Analisar Preço com IA
                  </>
                )}
              </button>

              {(productName || price || category || description) && (
                <button
                  onClick={clearForm}
                  className="px-6 py-4 bg-zinc-800 text-zinc-300 font-semibold rounded-xl hover:bg-zinc-700 transition"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* RESULTADO DA ANÁLISE */}
          {analysis && (
            <div className="mt-10 bg-zinc-900/80 border border-yellow-500/30 rounded-2xl p-8 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-yellow-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-yellow-400">
                    Análise Completa
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Gerada por IA especializada em precificação
                  </p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {analysis}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-700 flex justify-between items-center">
                <p className="text-xs text-zinc-500">
                  💡 Dica: Cada análise é única. Experimente fornecer mais detalhes para resultados ainda melhores!
                </p>
                <button
                  onClick={handleAnalyze}
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition"
                >
                  Gerar nova análise →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}