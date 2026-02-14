import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  imageUrl?: string;
}

export default function EmptyState({
  icon = '📊',
  title,
  description,
  actionLabel,
  onAction,
  imageUrl
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Imagem ou Ícone */}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-48 h-48 mb-6 opacity-50"
        />
      ) : (
        <div className="text-8xl mb-6 opacity-40 animate-pulse">
          {icon}
        </div>
      )}

      {/* Título */}
      <h3 className="text-2xl font-bold text-white mb-3">
        {title}
      </h3>

      {/* Descrição */}
      <p className="text-zinc-400 text-lg mb-8 max-w-md">
        {description}
      </p>

      {/* Botão de Ação (opcional) */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-yellow-500/20"
        >
          {actionLabel}
        </button>
      )}

      {/* Dica adicional */}
      <div className="mt-6 text-sm text-zinc-500">
        💡 Dica: Você pode começar explorando as ferramentas no menu lateral
      </div>
    </div>
  );
}

// Exemplos de uso pré-configurados:

export function EmptyAnalyses({ onStartAnalysis }: { onStartAnalysis?: () => void }) {
  return (
    <EmptyState
      icon="🔍"
      title="Nenhuma análise ainda"
      description="Comece analisando seu primeiro produto para ver insights poderosos com IA!"
      actionLabel="Analisar Agora"
      onAction={onStartAnalysis}
    />
  );
}

export function EmptyHistory() {
  return (
    <EmptyState
      icon="📋"
      title="Histórico vazio"
      description="Suas análises anteriores aparecerão aqui. Faça sua primeira análise para começar!"
    />
  );
}

export function EmptyMonitor({ onAddProduct }: { onAddProduct?: () => void }) {
  return (
    <EmptyState
      icon="📊"
      title="Nenhum produto monitorado"
      description="Adicione produtos para monitorar variações de preço em tempo real"
      actionLabel="Adicionar Produto"
      onAction={onAddProduct}
    />
  );
}

export function EmptyResults() {
  return (
    <EmptyState
      icon="🔎"
      title="Nenhum resultado encontrado"
      description="Tente ajustar seus filtros ou fazer uma nova busca"
    />
  );
}

export function UpgradeRequired({ planName = "Pro" }: { planName?: string }) {
  return (
    <EmptyState
      icon="💎"
      title={`Recurso exclusivo do plano ${planName}`}
      description={`Faça upgrade para o plano ${planName} para desbloquear este recurso incrível!`}
      actionLabel={`Upgrade para ${planName}`}
      onAction={() => window.location.href = '/profile?tab=plan'}
    />
  );
}

export function LimitReached({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Limite de análises atingido"
      description="Você atingiu o limite do seu plano neste mês. Faça upgrade para continuar analisando!"
      actionLabel="Ver Planos"
      onAction={onUpgrade}
    />
  );
}