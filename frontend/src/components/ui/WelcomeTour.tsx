import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom';
}

const tourSteps: TourStep[] = [
  {
    target: '.stat-cards',
    title: '📊 Seu Dashboard',
    description: 'Aqui você vê um resumo das suas análises e uso mensal. Fique de olho no limite do seu plano!',
    position: 'bottom'
  },
  {
    target: '.tools-grid',
    title: '🔧 Ferramentas de Análise',
    description: 'Escolha a ferramenta ideal para analisar seus produtos: links, PDFs, imagens ou análise em lote.',
    position: 'bottom'
  },
  {
    target: '.recent-analyses',
    title: '📝 Histórico Recente',
    description: 'Todas as suas análises ficam salvas aqui. Clique para ver detalhes ou exportar relatórios.',
    position: 'top'
  },
  {
    target: '.user-menu',
    title: '👤 Seu Perfil',
    description: 'Gerencie sua conta, altere preferências e veja detalhes do seu plano.',
    position: 'bottom'
  }
];

interface WelcomeTourProps {
  onComplete?: () => void;
}

export default function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});

  // Inicializar tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('pricemind_tour_completed');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        console.log('🎓 Iniciando WelcomeTour...');
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Atualizar posição quando step muda
  useEffect(() => {
    if (isOpen) {
      // Pequeno delay para garantir que DOM está pronto
      const timer = setTimeout(() => {
        updatePosition();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen]);

  const updatePosition = () => {
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);
    
    console.log(`📍 Step ${currentStep + 1}/${tourSteps.length}: "${step.target}"`);
    
    if (!element) {
      console.error(`❌ Elemento "${step.target}" não encontrado!`);
      return;
    }

    console.log('✅ Elemento encontrado:', element);

    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const arrowHeight = 12;
    const spacing = 20;

    let top = 0;
    let left = 0;
    let arrowTop = 0;
    let arrowLeft = 0;
    let showTopArrow = false;
    let showBottomArrow = false;

    // Calcular posição horizontal (sempre centralizado)
    left = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);

    // Garantir que não saia da tela horizontalmente
    const minLeft = 20;
    const maxLeft = window.innerWidth - tooltipWidth - 20;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Calcular posição vertical
    if (step.position === 'bottom') {
      // Tooltip abaixo do elemento
      top = rect.bottom + scrollY + spacing;
      showTopArrow = true;
      arrowTop = top - arrowHeight;
      arrowLeft = rect.left + scrollX + (rect.width / 2);
    } else {
      // Tooltip acima do elemento
      top = rect.top + scrollY - tooltipHeight - spacing;
      showBottomArrow = true;
      arrowTop = rect.top + scrollY - arrowHeight;
      arrowLeft = rect.left + scrollX + (rect.width / 2);
    }

    console.log(`📐 Posição: top=${top}px, left=${left}px`);
    console.log(`🎯 Viewport: width=${window.innerWidth}, height=${window.innerHeight}`);
    console.log(`📏 Scroll: x=${scrollX}, y=${scrollY}`);

    // Aplicar estilos
    setTooltipStyle({
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10000
    });

    setArrowStyle({
      position: 'absolute',
      top: `${arrowTop}px`,
      left: `${arrowLeft}px`,
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '12px solid transparent',
      borderRight: '12px solid transparent',
      ...(showTopArrow && {
        borderBottom: '12px solid rgb(234, 179, 8)'
      }),
      ...(showBottomArrow && {
        borderTop: '12px solid rgb(234, 179, 8)'
      }),
      zIndex: 10000
    });

    // Scroll suave até o elemento
    const elementTop = rect.top + window.scrollY - 200;
    window.scrollTo({
      top: elementTop,
      behavior: 'smooth'
    });
  };

  const handleNext = () => {
    console.log(`➡️ Próximo: Step ${currentStep + 1} → ${currentStep + 2}`);
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    console.log(`⬅️ Anterior: Step ${currentStep + 1} → ${currentStep}`);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    console.log('✅ Tour completado!');
    localStorage.setItem('pricemind_tour_completed', 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    console.log('⏭️ Tour pulado');
    localStorage.setItem('pricemind_tour_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay - z-index 9998 */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={handleSkip}
      />
      
      {/* Seta - z-index 9999 */}
      <div style={arrowStyle} />
      
      {/* Tooltip - z-index 10000 */}
      <div style={tooltipStyle}>
        <div 
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-black rounded-2xl shadow-2xl p-6 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-lg">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="hover:bg-black/10 rounded-lg p-1 transition"
              aria-label="Fechar tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Descrição */}
          <p className="text-black/90 mb-6 leading-relaxed text-base">
            {step.description}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Progress indicators */}
            <div className="flex gap-1.5">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-black'
                      : index < currentStep
                      ? 'w-2 bg-black/50'
                      : 'w-2 bg-black/20'
                  }`}
                />
              ))}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-black/10 hover:bg-black/20 rounded-xl font-medium transition-all duration-200 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-black hover:bg-black/90 text-yellow-400 rounded-xl font-bold transition-all duration-200 flex items-center gap-1"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Finalizar
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Step counter */}
          <div className="text-center mt-3 text-xs text-black/60 font-medium">
            {currentStep + 1} de {tourSteps.length}
          </div>
        </div>
      </div>
    </>
  );
}