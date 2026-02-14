export default function UpgradeModal({
  onClose,
  feature,
}: {
  onClose: () => void;
  feature?: string;
}) {
  // Detectar se é ferramenta Business pelo nome da feature
  const isBusinessFeature = feature?.includes("Business") || 
    feature?.includes("Comparador") || 
    feature?.includes("Simulador de Cenários") ||
    feature?.includes("Assistente IA") ||
    feature?.includes("Dashboard Executivo") ||
    feature?.includes("Análise em Lote") ||
    feature?.includes("Monitor de Preços") ||
    feature?.includes("Integrações") ||
    feature?.includes("Calculadora de ROI");

  // Detectar se é ferramenta PRO
  const isProFeature = feature?.includes("PDF") ||
    feature?.includes("Link") ||
    feature?.includes("Imagem") ||
    feature?.includes("Break-even") ||
    feature?.includes("Desconto");

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="text-center mb-6 sm:mb-8">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isBusinessFeature 
              ? 'bg-gradient-to-br from-orange-500 to-red-500' 
              : isProFeature
              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
              : 'bg-gradient-to-br from-green-500 to-emerald-600'
          }`}>
            <span className="text-3xl sm:text-4xl">
              {isBusinessFeature ? '🔥' : isProFeature ? '💎' : '✨'}
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            isBusinessFeature ? 'text-orange-400' : isProFeature ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {isBusinessFeature ? 'Recurso Business' : isProFeature ? 'Recurso Pro' : 'Recurso Premium'}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            {feature || "Este recurso"} é exclusivo do{' '}
            {isBusinessFeature ? 'Plano Business' : isProFeature ? 'Plano Pro' : 'Plano Starter'}
          </p>
        </div>

        {/* CARDS DOS PLANOS */}
        
        {/* STARTER - se não for Pro nem Business */}
        {!isProFeature && !isBusinessFeature && (
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border  border-green-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl sm:text-2xl">✨</span>
              <p className="text-sm sm:text-base text-zinc-300 font-semibold">
                Com o Plano Starter você tem acesso a:
              </p>
            </div>
            <ul className="space-y-2 sm:space-y-3">
              <Feature text="30 análises por mês" highlight />
              <Feature text="Análise Básica com IA" subtext="Precificação inteligente" />
              <Feature text="Dashboard de Estatísticas" subtext="Acompanhe seu desempenho" />
              <Feature text="Análise por PDF" subtext="E-books, catálogos e documentos" highlight />
              <Feature text="Calculadora de Lucro" subtext="Margem e rentabilidade" />
              <Feature text="Histórico de 30 dias" subtext="Revise suas análises" />
            </ul>
          </div>
        )}

        {/* PRO - se for feature Pro */}
        {isProFeature && !isBusinessFeature && (
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl sm:rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl sm:text-2xl">💎</span>
              <p className="text-sm sm:text-base text-zinc-300 font-semibold">
                Com o Plano Pro você tem acesso a:
              </p>
            </div>

            {/* Tudo do Starter */}
            <div className="mb-5">
              <p className="text-xs text-yellow-400 font-bold mb-3 uppercase tracking-wider">
                ✓ Tudo do Plano Starter +
              </p>
              <ul className="space-y-2 opacity-80 text-xs sm:text-sm">
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-green-400">✓</span>
                  30 análises, Dashboard, PDF, Calculadora, Histórico 30 dias
                </li>
              </ul>
            </div>

            {/* Exclusivos Pro */}
            <div className="border-t border-yellow-500/30 pt-5">
              <p className="text-xs text-yellow-400 font-bold mb-3 uppercase tracking-wider">
                🚀 Recursos Exclusivos Pro:
              </p>
              <ul className="space-y-2 sm:space-y-3">
                <Feature text="100 análises por mês" highlight />
                <Feature text="Análise por Link" subtext="Cole URLs de páginas de vendas" />
                <Feature text="Análise por Imagem" subtext="Screenshots e criativos" />
                <Feature text="Break-even Calculator" subtext="Ponto de equilíbrio financeiro" highlight />
                <Feature text="Simulador de Descontos" subtext="Descubra se promoção vale a pena" highlight />
                <Feature text="Histórico ilimitado" subtext="Acesse todas suas análises" />
                <Feature text="Suporte prioritário" subtext="Resposta em até 24h" />
              </ul>
            </div>

            {/* Badge Economia */}
            <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
              <p className="text-xs sm:text-sm text-green-400 font-semibold">
                💰 Economize R$ 360/ano vs ferramentas separadas
              </p>
            </div>
          </div>
        )}

        {/* BUSINESS - se for feature Business */}
        {isBusinessFeature && (
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/50 rounded-xl sm:rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl sm:text-2xl">🔥</span>
              <p className="text-sm sm:text-base text-zinc-300 font-semibold">
                Com o Plano Business você tem acesso a:
              </p>
            </div>

            {/* TUDO DO STARTER + PRO */}
            <div className="mb-5">
              <p className="text-xs text-orange-400 font-bold mb-3 uppercase tracking-wider">
                ✓ Tudo do Starter + Pro +
              </p>
              <ul className="space-y-2 opacity-80 text-xs sm:text-sm">
                <li className="flex items-center gap-2 text-zinc-400">
                  <span className="text-yellow-400">✓</span>
                  100 análises, PDFs, Links, Imagens, Break-even, Descontos, Histórico
                </li>
              </ul>
            </div>

            {/* EXCLUSIVOS BUSINESS */}
            <div className="border-t border-orange-500/30 pt-5">
              <p className="text-xs text-orange-400 font-bold mb-3 uppercase tracking-wider">
                🚀 Recursos Exclusivos Business:
              </p>
              <ul className="space-y-2 sm:space-y-3">
                <Feature 
                  text="Análises ILIMITADAS" 
                  subtext="Sem limites mensais"
                  highlight
                  business
                />
                <Feature 
                  text="Comparador de Preços" 
                  subtext="Compare com até 5 concorrentes simultaneamente" 
                  business
                />
                <Feature 
                  text="Simulador de Cenários" 
                  subtext="3 cenários automáticos (conservador, realista, otimista)" 
                  business
                />
                <Feature 
                  text="Assistente IA 24/7" 
                  subtext="Chat especializado em precificação sempre disponível" 
                  business
                />
                <Feature 
                  text="Dashboard Executivo" 
                  subtext="Relatório mensal profissional em PDF" 
                  business
                />
                <Feature 
                  text="Análise em Lote (CSV)" 
                  subtext="Analise centenas de produtos de uma vez" 
                  highlight
                  business
                />
                <Feature 
                  text="Monitor de Preços" 
                  subtext="Rastreie concorrentes automaticamente 24/7" 
                  business
                />
                <Feature 
                  text="Integrações E-commerce" 
                  subtext="Shopify, WooCommerce e mais" 
                  business
                />
                <Feature 
                  text="Calculadora de ROI de Tráfego" 
                  subtext="Simule retorno de investimento em ads" 
                  business
                />
                <Feature 
                  text="API de acesso" 
                  subtext="Integre o PriceMind aos seus sistemas" 
                  business
                />
                <Feature 
                  text="Suporte VIP" 
                  subtext="WhatsApp direto + resposta prioritária" 
                  highlight
                  business
                />
              </ul>
            </div>

            {/* BADGE ECONOMIA */}
            <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
              <p className="text-xs sm:text-sm text-green-400 font-semibold">
                💰 Economize R$ 600/ano + 1h consultoria/mês inclusa
              </p>
            </div>
          </div>
        )}

        {/* BOTÕES - ADAPTA BASEADO NO TIPO */}
        <div className="space-y-3 sm:space-y-4">
          {/* Se não é Pro nem Business -> Mostra Starter */}
          {!isProFeature && !isBusinessFeature && (
            <>
              <button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition text-base sm:text-lg shadow-lg shadow-green-500/30"
              >
                ✨ Assinar Plano Starter - R$ 27/mês
              </button>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-2">Ou escolha o plano completo:</p>
                <button 
                  onClick={() => window.location.href = '/pricing'}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition text-sm sm:text-base"
                >
                  💎 Pro - R$ 67/mês (+ ferramentas)
                </button>
              </div>
            </>
          )}

          {/* Se é Pro -> Mostra Pro como principal */}
          {isProFeature && !isBusinessFeature && (
            <>
              <button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition text-base sm:text-lg shadow-lg shadow-yellow-500/30"
              >
                💎 Assinar Plano Pro - R$ 67/mês
              </button>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-2">Ou comece com o Starter:</p>
                <button 
                  onClick={() => window.location.href = '/pricing'}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-emerald-500 transition text-sm sm:text-base"
                >
                  ✨ Starter - R$ 27/mês (ideal para começar)
                </button>
              </div>
            </>
          )}

          {/* Se é Business -> Mostra Business como principal */}
          {isBusinessFeature && (
            <>
              <button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-400 hover:to-red-400 transition text-base sm:text-lg shadow-lg shadow-orange-500/30"
              >
                🔥 Assinar Plano Business - R$ 247/mês
              </button>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-2">Ou comece com o plano Pro:</p>
                <button 
                  onClick={() => window.location.href = '/pricing'}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition text-sm sm:text-base"
                >
                  💎 Pro - R$ 67/mês (100 análises/mês)
                </button>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 text-sm sm:text-base text-zinc-400 hover:text-white transition"
          >
            Voltar para o plano Free
          </button>
        </div>

        {/* GARANTIA */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500">
            🛡️ Garantia de 7 dias - Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ 
  text, 
  subtext,
  highlight,
  business
}: { 
  text: string;
  subtext?: string;
  highlight?: boolean;
  business?: boolean;
}) {
  return (
    <li className={`flex items-start gap-2 sm:gap-3 ${highlight ? 'bg-black/30 rounded-lg p-2' : ''}`}>
      <span className={`text-base sm:text-lg flex-shrink-0 ${business ? 'text-orange-400' : 'text-green-400'}`}>
        ✓
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm font-medium ${highlight ? 'text-white' : 'text-zinc-300'}`}>
          {text}
        </p>
        {subtext && (
          <p className="text-xs text-zinc-500 mt-0.5">
            {subtext}
          </p>
        )}
      </div>
    </li>
  );
}