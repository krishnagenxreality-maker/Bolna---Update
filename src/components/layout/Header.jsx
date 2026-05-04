import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Zap } from 'lucide-react';

export const Header = ({ activeView, setActiveView, credits }) => {
  const { logout, user } = useAuth();

  return (
    <header className="hdr">
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
        <span className="hdr-title">Calling<span className="hdr-accent"> Gen</span></span>
      </div>
      <div className="hdr-nav">
        <button
          className={`nav-btn ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          Dashboard
        </button>
        <button
          className={`nav-btn ${activeView === 'manager' ? 'active' : ''}`}
          onClick={() => setActiveView('manager')}
        >
          Call Manager
        </button>
        <button
          className={`nav-btn ${activeView === 'details' ? 'active' : ''}`}
          onClick={() => setActiveView('details')}
        >
          View Call Details
        </button>
        <button
          className={`nav-btn ${activeView === 'responses' ? 'active' : ''}`}
          onClick={() => setActiveView('responses')}
        >
          Response Details
        </button>
        <button
          className={`nav-btn ${activeView === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveView('leads')}
        >
          Leads
        </button>
        <button
          className={`nav-btn ${activeView === 'report' ? 'active' : ''}`}
          onClick={() => setActiveView('report')}
        >
          Report
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
  );
};
