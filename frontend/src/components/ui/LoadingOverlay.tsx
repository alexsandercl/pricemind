import React, { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  progress?: number;
  steps?: string[];
  currentStep?: number;
}

export default function LoadingOverlay({
  isOpen,
  message = 'Processando...',
  progress,
  steps,
  currentStep = 0
}: LoadingOverlayProps) {
  const [dots, setDots] = useState('');

  // Animação de pontos
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900/90 border border-zinc-700 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Spinner Animado */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Círculo externo girando */}
            <div className="w-20 h-20 border-4 border-zinc-700 border-t-yellow-500 rounded-full animate-spin"></div>
            
            {/* Círculo interno pulsando */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full animate-pulse"></div>
            </div>

            {/* Ícone central */}
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🤖
            </div>
          </div>
        </div>

        {/* Mensagem principal */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          {message}{dots}
        </h3>

        {/* Submensagem */}
        <p className="text-sm text-zinc-400 text-center mb-6">
          Isso pode levar alguns segundos
        </p>

        {/* Barra de Progresso (se fornecida) */}
        {progress !== undefined && (
          <div className="mb-6">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-zinc-500 text-center mt-2">
              {progress}% completo
            </p>
          </div>
        )}

        {/* Steps (se fornecidos) */}
        {steps && steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  index === currentStep 
                    ? 'text-yellow-400' 
                    : index < currentStep 
                      ? 'text-green-400' 
                      : 'text-zinc-600'
                }`}
              >
                {/* Ícone de status */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === currentStep
                    ? 'bg-yellow-500 text-black animate-pulse'
                    : index < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>

                {/* Texto do step */}
                <span className={`text-sm font-medium ${
                  index === currentStep ? 'font-bold' : ''
                }`}>
                  {step}
                </span>

                {/* Spinner no step atual */}
                {index === currentStep && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-yellow-500 rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Check no step concluído */}
                {index < currentStep && (
                  <div className="ml-auto text-green-400">✓</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dica */}
        <div className="mt-6 text-xs text-zinc-500 text-center italic">
          💡 Nossa IA está analisando cuidadosamente...
        </div>
      </div>
    </div>
  );
}

// Variações pré-configuradas:

export function AIAnalysisLoading({ isOpen }: { isOpen: boolean }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const steps = [0, 1, 2, 3];
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <LoadingOverlay
      isOpen={isOpen}
      message="Analisando com IA"
      steps={[
        'Extraindo dados do produto',
        'Analisando preços do mercado',
        'Calculando estratégias',
        'Gerando insights'
      ]}
      currentStep={currentStep}
    />
  );
}

export function UploadLoading({ 
  isOpen, 
  progress 
}: { 
  isOpen: boolean; 
  progress?: number 
}) {
  return (
    <LoadingOverlay
      isOpen={isOpen}
      message="Fazendo upload"
      progress={progress}
    />
  );
}

export function SimpleLoading({ 
  isOpen, 
  message 
}: { 
  isOpen: boolean; 
  message?: string 
}) {
  return (
    <LoadingOverlay
      isOpen={isOpen}
      message={message || 'Carregando'}
    />
  );
}