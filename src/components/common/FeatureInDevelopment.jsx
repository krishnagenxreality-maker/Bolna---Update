import React from 'react';
import { Shield, Zap, X } from 'lucide-react';
import { SmokeBackground } from '../layout/SmokeBackground';

export default function FeatureInDevelopment({ type = 'page', onClose }) {
  const content = (
    <div className="panel" style={{ 
      maxWidth: '500px', 
      width: '100%', 
      textAlign: 'center', 
      padding: '60px 40px',
      position: 'relative',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      margin: '20px'
    }}>
      {type === 'modal' && (
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', top: '24px', right: '24px', 
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', 
            cursor: 'pointer', transition: 'all 0.2s' 
          }}
        >
          <X size={24} />
        </button>
      )}
      
      <div className="logo-mark" style={{ 
        width: '64px', height: '64px', 
        background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
        margin: '0 auto 24px',
        borderRadius: '16px'
      }}>
        <Shield size={32} />
      </div>
      
      <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '12px', fontWeight: '700', letterSpacing: '-0.02em' }}>
        {type === 'page' ? 'Education Portal' : 'Feature'} in Development
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px', fontFamily: 'Outfit' }}>
        The Education feature is currently under development and will be available soon. We're working hard to bring you the best experience.
      </p>
      
      <button 
        onClick={type === 'page' ? () => window.location.href = '/' : onClose}
        className="btn-call" 
        style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
      >
        {type === 'page' ? 'Back to Homepage' : 'Close'}
      </button>
    </div>
  );

  if (type === 'modal') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}>
        {content}
      </div>
    );
  }

  return (
    <div className="app" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: '#080808'
    }}>
      <SmokeBackground />
      {content}
    </div>
  );
}
