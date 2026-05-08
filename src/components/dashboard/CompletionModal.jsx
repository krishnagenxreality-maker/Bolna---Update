import React, { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export const CompletionModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen && window.confetti) {
      // Single elegant confetti burst
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        window.confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="panel" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        border: '1px solid rgba(125, 255, 179, 0.2)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(125, 255, 179, 0.05)'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', 
            cursor: 'pointer', transition: 'color 0.2s' 
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          <X size={20} />
        </button>

        <div style={{
          width: '64px', height: '64px', margin: '0 auto 24px',
          background: 'rgba(125, 255, 179, 0.1)', border: '1px solid rgba(125, 255, 179, 0.2)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7dffb3',
          animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <CheckCircle2 size={32} />
        </div>

        <h2 style={{ 
          color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '12px',
          fontFamily: 'Outfit, sans-serif'
        }}>
          Calls Successfully Completed
        </h2>
        <p style={{ 
          color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          All scheduled calls have been processed successfully. Your session summary is now ready for review.
        </p>

        <button 
          onClick={onClose}
          className="btn-call"
          style={{ 
            width: '100%', justifyContent: 'center', padding: '14px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: 'none', fontWeight: '600'
          }}
        >
          Great, let's see!
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
