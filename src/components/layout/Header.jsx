import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Header = ({ activeView, setActiveView }) => {
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
        <span className="hdr-title">Bolna<span className="hdr-accent"> Dashboard</span></span>
      </div>
      <div className="hdr-nav">
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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
