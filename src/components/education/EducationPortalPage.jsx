import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SmokeBackground } from '../layout/SmokeBackground';
import { 
  Shield, LogIn, ArrowRight, Zap, BarChart3, Users 
} from 'lucide-react';
import '../../styles/BolnaDashboard.css';

export default function EducationPortalPage() {
  const navigate = useNavigate();

  const educationFeatures = [
    {
      icon: <Users size={24} className="sn-white" />,
      title: "Student Engagement",
      desc: "Connect with students naturally through AI-driven voice interactions that feel personal and supportive."
    },
    {
      icon: <Zap size={24} className="sn-green" />,
      title: "Automated Reminders",
      desc: "Automate fee reminders, attendance follow-ups, and exam notifications without manual intervention."
    },
    {
      icon: <BarChart3 size={24} className="sn-blue" />,
      title: "Progress Monitoring",
      desc: "Track student and parent engagement in real-time with detailed analytics and automated scoring."
    }
  ];

  return (
    <div className="app">
      <SmokeBackground />
      
      {/* Top Navigation */}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hdr-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="logo-mark">
            <Shield size={20} />
          </div>
          <span className="hdr-title">Calling <span className="hdr-accent">Gen</span></span>
          <div className="hdr-badge" style={{ marginLeft: '12px' }}>by GenxReality</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button onClick={() => navigate('/')} className="nav-link" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: '500' }}>Home</button>
          <button onClick={() => navigate('/pricing')} className="nav-link" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: '500' }}>Pricing</button>
          <button className="nav-link-highlight">Education Portal</button>
          <button onClick={() => navigate('/login')} className="logout-btn" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}>
            <LogIn size={16} /> Login
          </button>
        </div>
      </header>

      <main className="main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', textAlign: 'center' }}>
        {/* Hero Section */}
        <div style={{ maxWidth: '800px', padding: '0 20px', marginBottom: '80px' }}>
          <div className="spill s-pending" style={{ marginBottom: '24px', padding: '6px 16px' }}>
            Education Management Reimagined
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: '700', color: '#fff', marginBottom: '24px', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            Where <span className="hdr-accent">Education and Student Monitoring</span> is Easy
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginBottom: '40px', lineHeight: '1.6', fontFamily: 'Outfit' }}>
            Simplified communication with students and parents through intelligent automation. 
            Automate reminders and follow-ups while maintaining easy tracking and high engagement for your institution.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/pricing')} className="btn-call" style={{ padding: '16px 40px', fontSize: '16px' }}>
              Join <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="stats-grid" style={{ maxWidth: '1200px', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {educationFeatures.map((f, i) => (
            <div key={i} className="panel" style={{ padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
