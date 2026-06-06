import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const TOUR_STEPS = [
  { target: '[data-tour="library"]', title: 'Scenario Library', content: 'Select a pre-built Turing Machine scenario, or use the AI to generate a brand new one from scratch.' },
  { target: '[data-tour="rules"]', title: 'Rule Editor', content: 'View, edit, or add transition rules. Each rule defines what the machine writes and where it moves next based on the current state and symbol.' },
  { target: '[data-tour="tape"]', title: 'The Tape', content: 'The infinite memory tape of the Turing Machine. The active head reads and writes symbols as the simulation runs.' },
  { target: '[data-tour="controls"]', title: 'Execution Controls', content: 'Run continuously, pause, or step through the logic forward and backward. Use the scrubber to travel in time.' },
  { target: '[data-tour="diagram"]', title: 'State Diagram (UML)', content: 'A dynamic, UML-formatted State Diagram. Watch the machine transition between states in real-time.' },
  { target: '[data-tour="stats"]', title: 'Statistics & Debugger', content: 'Track steps, memory usage, and execution history. Watch for infinite loops or rejection errors.' },
];

export const TourOverlay: React.FC<{ isActive: boolean; onClose: () => void }> = ({ isActive, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive) return;
    
    const updateRect = () => {
      const el = document.querySelector(TOUR_STEPS[currentStep].target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    const t = setTimeout(updateRect, 300);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearTimeout(t);
    };
  }, [isActive, currentStep]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {targetRect && (
        <>
          {/* Highlight mask cutout using immense box-shadow */}
          <div 
            className="absolute rounded transition-all duration-300 border-2 border-primary-base shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          ></div>
          
          {/* Tooltip Dialog */}
          <div 
             className="absolute bg-bg-panel border border-border-active p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-300 w-80 font-sans z-50 text-text-secondary"
             style={{
               top: targetRect.bottom + 16 < window.innerHeight - 150 ? targetRect.bottom + 16 : targetRect.top - 160,
               left: Math.min(Math.max(16, targetRect.left + (targetRect.width / 2) - 160), window.innerWidth - 336)
             }}
          >
            <div className="flex justify-between items-center mb-2 text-text-primary">
              <h3 className="font-bold text-primary-base text-sm tracking-wide">{TOUR_STEPS[currentStep].title}</h3>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
            </div>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">{TOUR_STEPS[currentStep].content}</p>
            
            <div className="flex justify-between items-center border-t border-border-active pt-3">
              <div className="text-[10px] text-text-muted font-bold tracking-widest">STEP {currentStep + 1} OF {TOUR_STEPS.length}</div>
              <div className="flex gap-2">
                <button 
                  disabled={currentStep === 0} 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="p-1 px-2 bg-bg-element rounded hover:bg-border-active disabled:opacity-50 text-text-secondary transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <button 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="px-3 py-1 bg-primary-dark text-black rounded text-[10px] font-bold hover:bg-primary-base flex items-center shadow-lg transition-colors"
                  >
                    NEXT <ChevronRight size={14} className="ml-1" />
                  </button>
                ) : (
                  <button 
                    onClick={onClose}
                    className="px-4 py-1 bg-green-600 text-text-primary rounded text-[10px] font-bold hover:bg-green-500 flex items-center shadow-lg transition-colors tracking-wider"
                  >
                    FINISH
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
