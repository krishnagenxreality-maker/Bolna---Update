import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Zap } from 'lucide-react';

export const Header = ({ activeView, setActiveView, credits }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const isDemoUser = user?.userType === 'demo';

  return (
    <>
      {isDemoUser && (
        <div style={{
          width: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
          color: '#fff',
          padding: '8px 0',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'Outfit, sans-serif',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1000
        }}>
          <div className="marquee-content" style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            animation: 'marquee 20s linear infinite',
            gap: '50px'
          }}>
            {[...Array(10)].map((_, i) => (
              <span key={i}>Calls cannot be made for demo users. Upgrade your plan to start outreach.</span>
            ))}
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>
      )}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hdr-left">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 10C2 5.58 5.58 2 10 2s8 3.58 8 8-3.58 8-8 8-8-3.58-8-8Z" fill="url(#lg)" fillOpacity=".2" stroke="url(#lg)" strokeWidth="1.2"/>
              <path d="M7 10.5l1.5 1.5L13 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="lg" x1="2" y1="2" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffffff"/>
                  <stop offset="1" stopColor="#888888"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="hdr-title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Calling<span className="hdr-accent"> Gen</span></span>
          
          {/* Dashboard Nav Button */}
          {activeView !== 'calendar' && (
            <button 
              className="btn-dashboard-nav"
              onClick={() => {
                setActiveView('calendar');
                navigate('/dashboard');
              }}
            >
              Dashboard
            </button>
          )}
        </div>
        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isDemoUser && (
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '11px',
              fontWeight: '700',
              color: '#3b82f6',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '4px 12px',
              borderRadius: '99px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              Onboarding process started
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '6px 14px',
            borderRadius: '100px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {user?.selectedPlan || 'Starter'} PLAN
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            color: credits > 0 ? '#7dffb3' : '#ff7070',
            background: credits > 0 ? 'rgba(125, 255, 179, 0.06)' : 'rgba(255, 112, 112, 0.06)',
            border: `1px solid ${credits > 0 ? 'rgba(125, 255, 179, 0.15)' : 'rgba(255, 112, 112, 0.15)'}`,
            padding: '6px 14px',
            borderRadius: '100px',
            backdropFilter: 'blur(8px)',
            textShadow: credits > 0 ? '0 0 10px rgba(125, 255, 179, 0.3)' : '0 0 10px rgba(255, 112, 112, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <Zap size={13} />
            <span>{credits}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '400', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>credits</span>
          </div>

          {/* Upgrade Button */}
          <button
            onClick={() => navigate('/upgrade')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              color: 'rgba(255,255,255,0.8)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '6px 14px',
              borderRadius: '100px',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
          >
            Upgrade
          </button>

          <div className="hdr-badge">{user?.organization || 'Voice AI Call Manager'}</div>
          <button onClick={logout} className="logout-btn" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>
    </>
  );
};
