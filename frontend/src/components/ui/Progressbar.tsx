import { useState, useEffect } from 'react';
import { Loader2, Sparkles, CheckCircle, Zap } from 'lucide-react';

interface ProgressBarProps {
  isActive: boolean;
  onComplete?: () => void;
  steps?: ProgressStep[];
}

interface ProgressStep {
  label: string;
  icon: string;
  progress: number;
}

const defaultSteps: ProgressStep[] = [
  { label: 'Processando dados...', icon: '🔍', progress: 25 },
  { label: 'Analisando com IA...', icon: '🤖', progress: 60 },
  { label: 'Gerando insights...', icon: '💡', progress: 85 },
  { label: 'Finalizando...', icon: '✨', progress: 100 },
];

export default function ProgressBar({ isActive, onComplete, steps = defaultSteps }: ProgressBarProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setProgress(0);
      setIsComplete(false);
      return;
    }

    // Avançar steps automaticamente
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000); // Muda de step a cada 2s

    return () => clearInterval(stepInterval);
  }, [isActive, steps.length]);

  useEffect(() => {
    if (!isActive) return;

    const targetProgress = steps[currentStep]?.progress || 0;
    
    // Animar progresso suavemente
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < targetProgress) {
          return Math.min(prev + 1, targetProgress);
        }
        return prev;
      });
    }, 30);

    return () => clearInterval(progressInterval);
  }, [currentStep, isActive, steps]);

  useEffect(() => {
    if (progress >= 100 && isActive) {
      setTimeout(() => {
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 800);
      }, 500);
    }
  }, [progress, isActive, onComplete]);

  if (!isActive && !isComplete) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-2xl mb-4 relative">
            {isComplete ? (
              <CheckCircle className="w-10 h-10 text-yellow-500 animate-in zoom-in duration-300" />
            ) : (
              <>
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl animate-pulse" />
              </>
            )}
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            {isComplete ? '🎉 Análise Concluída!' : 'Analisando...'}
          </h3>
          
          {!isComplete && (
            <p className="text-zinc-400 text-sm">
              {steps[currentStep]?.icon} {steps[currentStep]?.label}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-zinc-400 mb-3">
            <span className="font-medium">Progresso</span>
            <span className="font-mono font-bold text-yellow-500">{progress}%</span>
          </div>
          
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 relative">
            <div
              className={`h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-300 ease-out relative ${
                isComplete ? 'animate-pulse' : ''
              }`}
              style={{ width: `${progress}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Steps */}
        {!isComplete ? (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  index === currentStep
                    ? 'opacity-100 scale-100'
                    : index < currentStep
                    ? 'opacity-50 scale-95'
                    : 'opacity-30 scale-95'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-yellow-500 text-black scale-90'
                      : index === currentStep
                      ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500 animate-pulse scale-100'
                      : 'bg-zinc-800 text-zinc-600 border border-zinc-700 scale-90'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span
                  className={`text-sm transition-colors duration-300 ${
                    index === currentStep 
                      ? 'text-white font-medium' 
                      : index < currentStep
                      ? 'text-zinc-500'
                      : 'text-zinc-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Success Message */
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-center gap-2 text-yellow-500">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <p className="font-bold text-lg">Resultados prontos!</p>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-zinc-400 text-sm">
              Sua análise foi concluída com sucesso
            </p>
            
            {/* Confetti effect */}
            <div className="flex justify-center gap-2 text-2xl">
              {['🎊', '🎉', '✨', '🎊', '🎉'].map((emoji, i) => (
                <span
                  key={i}
                  className="animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}