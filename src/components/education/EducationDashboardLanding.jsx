import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SmokeBackground } from '../layout/SmokeBackground';
import { Shield, LogOut, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/BolnaDashboard.css';

export default function EducationDashboardLanding() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="app">
      <SmokeBackground />
      
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hdr-left">
          <div className="logo-mark">
            <GraduationCap size={20} />
          </div>
          <span className="hdr-title">Education<span className="hdr-accent"> Portal</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="hdr-badge">Student Management</div>
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

      <main className="main" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 120px)',
        textAlign: 'center' 
      }}>
        <div className="panel" style={{ 
          maxWidth: '600px', 
          padding: '60px 40px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
        }}>
          <div className="logo-mark" style={{ 
            width: '72px', height: '72px', 
            margin: '0 auto 24px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6'
          }}>
            <BookOpen size={32} />
          </div>
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#fff', 
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            Welcome to the <span className="hdr-accent">Education / Student Management Portal</span>
          </h1>
          
          <p style={{ 
            fontSize: '16px', 
            color: 'rgba(255,255,255,0.35)', 
            marginBottom: '40px',
            lineHeight: '1.6',
            fontFamily: 'Outfit'
          }}>
            Manage student interactions, automated reminders, and engagement analytics in one centralized location.
          </p>

          <button 
            onClick={() => navigate('/education/dashboard')}
            className="btn-call" style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '16px',
            justifyContent: 'center'
          }}>
            Enter <ArrowRight size={20} style={{ marginLeft: '10px' }} />
          </button>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>{user?.organization || 'Institution'}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Organization</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>Active</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Account Status</div>
          </div>
        </div>
      </main>
    </div>
  );
}
