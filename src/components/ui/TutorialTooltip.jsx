import React, { useEffect } from 'react';
import { useTutorial } from '../../context/TutorialContext';
import { ChevronRight, X, Info } from 'lucide-react';
import './TutorialTooltip.css';

export const TutorialTooltip = () => {
  const { isActive, currentStep, steps, nextStep, stopTutorial } = useTutorial();

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const highlightElement = () => {
      const step = steps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        // Highlight the element
        element.classList.add('tutorial-highlight');
        
        // Scroll into view if not visible
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isVisible) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return () => element.classList.remove('tutorial-highlight');
      }
    };

    const cleanup = highlightElement();
    return () => {
      if (cleanup) cleanup();
    };
  }, [isActive, currentStep, steps]);

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <div className="tutorial-overlay" onClick={stopTutorial}>
      <div 
        className="tutorial-tooltip fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tooltip-header">
          <div className="tooltip-title">
            <Info size={18} />
            <span>{step.title}</span>
          </div>
          <button className="tooltip-close" onClick={stopTutorial}>
            <X size={16} />
          </button>
        </div>
        
        <div className="tooltip-body">
          {step.content}
        </div>

        <div className="tooltip-footer">
          <div className="step-indicator">
            {currentStep + 1} / {steps.length}
          </div>
          <div className="tooltip-actions">
            <button className="btn-skip" onClick={stopTutorial}>Skip</button>
            <button className="btn-next" onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
