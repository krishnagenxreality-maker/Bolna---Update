import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap, LayoutDashboard, Users, Calendar, BarChart2 } from 'lucide-react';

export const EducationTopbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="hdr-left">
        <div className="logo-mark">
          <GraduationCap size={20} />
        </div>
        <span className="hdr-title">Education<span className="hdr-accent"> Portal</span></span>
      </div>

      <div className="hdr-nav">
        <button 
          className={`nav-btn ${window.location.pathname === '/education/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/education/dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-btn ${window.location.pathname === '/education/students' ? 'active' : ''}`}
          onClick={() => navigate('/education/students')}
        >
          Students
        </button>
        <button 
          className={`nav-btn ${window.location.pathname === '/education/attendance' ? 'active' : ''}`}
          onClick={() => navigate('/education/attendance')}
        >
          Attendance
        </button>
        <button className="nav-btn">Campaigns</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="hdr-badge">{user?.organization || 'Institution'}</div>
        <button onClick={logout} className="logout-btn" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </header>
  );
};
