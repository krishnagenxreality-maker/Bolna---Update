import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SmokeBackground } from '../layout/SmokeBackground';
import { 
  Shield, LogIn, ArrowRight, CheckCircle2, 
  Users, BarChart3, Zap, X 
} from 'lucide-react';
import FeatureInDevelopment from '../common/FeatureInDevelopment';
import '../../styles/BolnaDashboard.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showJoinModal = searchParams.get('join') === 'true';

  const features = [
    {
      icon: <Zap size={24} className="sn-green" />,
      title: "Calling Automation",
      desc: "Revolutionize your outreach with intelligent AI-driven calling agents that handle conversations naturally."
    },
    {
      icon: <BarChart3 size={24} className="sn-blue" />,
      title: "Real-time Tracking",
      desc: "Monitor every interaction with detailed analytics and lead scoring to optimize your conversion rates."
    },
    {
      icon: <Users size={24} className="sn-white" />,
      title: "Lead Generation",
      desc: "Scale your sales pipeline effortlessly by automating the initial qualification and follow-up processes."
    }
  ];

  const [showDevModal, setShowDevModal] = useState(false);

  const handleOpenJoin = () => {
    setSearchParams({ join: 'true' });
  };

  const handleCloseJoin = () => {
    setSearchParams({});
  };

  return (
    <div className="app">
      <SmokeBackground />
      {showDevModal && <FeatureInDevelopment type="modal" onClose={() => setShowDevModal(false)} />}
      
      {/* Top Navigation */}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hdr-left">
          <div className="logo-mark">
            <Shield size={20} />
          </div>
          <span className="hdr-title">Calling <span className="hdr-accent">Gen</span></span>
          <div className="hdr-badge" style={{ marginLeft: '12px' }}>by GenxReality</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button onClick={() => navigate('/pricing')} className="nav-link" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: '500' }}>Pricing</button>
          <button onClick={() => setShowDevModal(true)} className="nav-link-highlight">Education Portal</button>
          <button onClick={() => navigate('/login', { state: { from: '/' } })} className="logout-btn" style={{
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
            Next-Gen Voice Outreach
          </div>
          <h1 style={{ fontSize: '64px', fontWeight: '700', color: '#fff', marginBottom: '24px', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            The Future of <span className="hdr-accent">Calling Automation</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginBottom: '40px', lineHeight: '1.6', fontFamily: 'Outfit' }}>
            Empower your business with Calling Gen. We combine cutting-edge AI with seamless automation to handle your calls, track leads, and grow your revenue while you focus on what matters.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={handleOpenJoin} className="btn-call" style={{ padding: '16px 40px', fontSize: '16px' }}>
              Join Now <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
            <button className="nav-btn" style={{ padding: '16px 40px', fontSize: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="stats-grid" style={{ maxWidth: '1200px', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {features.map((f, i) => (
            <div key={i} className="panel" style={{ padding: '32px', textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Value Section */}
        <div style={{ marginTop: '100px', width: '100%', maxWidth: '1200px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', textAlign: 'left', alignItems: 'center', padding: '0 20px 100px' }}>
          <div className="panel" style={{ height: '400px', background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Visual placeholder */}
            <div style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '70%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                <div style={{ width: '90%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '32px', color: '#fff', marginBottom: '24px' }}>Professional Grade Infrastructure</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                "Enterprise-ready API for seamless integration",
                "Advanced voice synthesis with human-like prosody",
                "Scalable calling infrastructure for high volume",
                "Detailed call sentiment and outcome analysis"
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} className="sn-green" />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Onboarding Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: '24px', right: '24px' }}>
              <button onClick={handleCloseJoin} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="logo-mark" style={{ width: '56px', height: '56px', margin: '0 auto 24px', borderRadius: '12px' }}>
              <Shield size={28} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px' }}>Get Started with Calling Gen</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px' }}>Choose how you'd like to proceed with our service.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={() => navigate('/login', { state: { from: '/?join=true' } })}
                className="btn-call" 
                style={{ width: '100%', padding: '16px', justifyContent: 'center' }}
              >
                Already have an account
              </button>
              
              <button 
                onClick={() => {
                  navigate('/pricing');
                }}
                className="nav-btn" 
                style={{ width: '100%', padding: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
              >
                New User? Contact Admin
              </button>
            </div>
            
            <div style={{ marginTop: '32px', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
              By joining, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
