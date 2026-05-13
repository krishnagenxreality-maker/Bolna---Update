import React from 'react';
import { X, Lock, Sparkles, ArrowRight } from 'lucide-react';

export const LockedFeatureModal = ({ isOpen, onClose, featureName, planRequired = "Growth" }) => {
  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 10000, 
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: '24px', animation: 'fadeIn 0.3s ease' 
    }} onClick={onClose}>
      <div className="panel" style={{ 
        width: '100%', maxWidth: '420px', padding: '40px', 
        borderRadius: '24px', position: 'relative', 
        animation: 'modalIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        textAlign: 'center',
        background: 'rgba(18, 18, 18, 0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }} onClick={e => e.stopPropagation()}>
        
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '24px', right: '24px',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', 
            cursor: 'pointer', transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          <X size={20} />
        </button>

        <div style={{ 
          width: '64px', height: '64px', borderRadius: '16px', 
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(52, 211, 153, 0.15))',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a78bfa', margin: '0 auto 24px'
        }}>
          <Lock size={28} />
        </div>

        <h3 style={{ 
          fontSize: '24px', fontWeight: '700', color: '#fff', 
          marginBottom: '12px', fontFamily: 'Outfit, sans-serif',
          letterSpacing: '-0.02em'
        }}>
          Feature Locked
        </h3>
        
        <p style={{ 
          color: 'rgba(255,255,255,0.45)', fontSize: '15px', 
          fontFamily: 'Outfit, sans-serif', lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          {featureName} is not available on your current plan. Please upgrade to the <strong>{planRequired} Plan</strong> to unlock this and more premium features.
        </p>

        <button
          onClick={() => {
            onClose();
            // We could navigate to upgrade page here if needed, but per instructions, we just match design.
            window.location.hash = '#upgrade'; // or just rely on existing upgrade flows
          }}
          style={{
            width: '100%', padding: '16px 24px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #a78bfa, #34d399)',
            border: 'none', color: '#0a0a0a',
            fontFamily: 'Outfit', fontWeight: '700', fontSize: '16px',
            cursor: 'pointer', transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 8px 24px rgba(167, 139, 250, 0.3)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(167, 139, 250, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(167, 139, 250, 0.3)';
          }}
        >
          Upgrade Plan <ArrowRight size={18} />
        </button>

        <div style={{ 
          marginTop: '24px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', gap: '8px', color: 'rgba(255,255,255,0.25)',
          fontSize: '12px', fontFamily: 'Outfit'
        }}>
          <Sparkles size={14} /> Unlock full potential
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      ` }} />
    </div>
  );
};
