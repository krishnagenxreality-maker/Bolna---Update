import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SmokeBackground } from '../layout/SmokeBackground';
import { Shield, LogIn, CheckCircle2, X } from 'lucide-react';
import '../../styles/BolnaDashboard.css';

export default function PricingPage() {
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    purpose: '',
    scriptContent: '',
    creditsSelected: ''
  });

  const handleSelectPlan = (plan) => {
    let credits = '';
    if (plan === 'plan1') credits = '1000 credits';
    else if (plan === 'plan2') credits = '3000 credits';
    else if (plan === 'custom') credits = 'Custom / Contact Admin';
    
    setFormData({
      ...formData,
      creditsSelected: credits
    });
    setSuccess(false);
    setShowForm(true);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/requests', formData);
      setSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
        setFormData({
          name: '',
          organizationName: '',
          purpose: '',
          scriptContent: '',
          creditsSelected: ''
        });
      }, 3000);
    } catch (error) {
      alert('Failed to send request. Please try again.');
    }
  };

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
          <button onClick={() => navigate('/pricing')} className="nav-link" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: '600' }}>Pricing</button>
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

      <main className="main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', minHeight: 'calc(100vh - 80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Simple, transparent <span className="hdr-accent">pricing</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit' }}>
            Choose the plan that best fits your outreach needs.
          </p>
        </div>

        <div className="stats-grid" style={{ width: '100%', maxWidth: '1100px', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', alignItems: 'stretch' }}>
          {/* Plan 1 */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', padding: '40px 32px', height: '100%' }}>
            <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '12px', fontWeight: '600', textAlign: 'center' }}>Starter</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '700', color: '#fff' }}>₹10,000</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>/ month</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1, justifyContent: 'flex-start' }}>
              {[
                "1000 credits / month",
                "1 call per credit (1K calls)",
                "Detailed segregation",
                "Lead generation"
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} className="sn-green" />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{feature}</span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => handleSelectPlan('plan1')}
              className="btn-call" 
              style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: 'auto' }}
            >
              Select
            </button>
          </div>

          {/* Plan 2 */}
          <div style={{ position: 'relative', height: '100%', transform: 'scale(1.05)', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#000', padding: '4px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', zIndex: 2, boxShadow: '0 4px 12px rgba(255,255,255,0.15)' }}>
              Most Popular
            </div>
            <div className="panel" style={{ 
              display: 'flex', flexDirection: 'column', padding: '40px 32px', height: '100%',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.04)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
              <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '12px', fontWeight: '600', textAlign: 'center' }}>Professional</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '700', color: '#fff' }}>₹20,000</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>/ month</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1, justifyContent: 'flex-start' }}>
              {[
                "3000 credits / month",
                "1 call per credit (2K calls)",
                "Detailed segregation",
                "Lead generation"
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} className="sn-green" />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{feature}</span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => handleSelectPlan('plan2')}
              className="btn-call" 
              style={{ width: '100%', justifyContent: 'center', padding: '16px', background: 'rgba(255,255,255,0.1)', marginTop: 'auto' }}
            >
              Select
            </button>
            </div>
          </div>

          {/* Plan 3 */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', padding: '40px 32px', height: '100%' }}>
            <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '12px', fontWeight: '600', textAlign: 'center' }}>Enterprise</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '700', color: '#fff' }}>Custom</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1, justifyContent: 'flex-start' }}>
              {[
                "Unlimited credits",
                "Custom concurrent calls",
                "Dedicated support",
                "Custom integration"
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={18} className="sn-green" />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{feature}</span>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => handleSelectPlan('custom')}
              className="btn-call" 
              style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: 'auto' }}
            >
              Select
            </button>
          </div>
        </div>

        {/* Pricing Request Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="panel" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>
              {success ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <CheckCircle2 size={48} className="sn-green" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '12px' }}>Request Sent Successfully!</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>
                    Our team will review your request and get back to you shortly.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div className="panel-label" style={{ marginBottom: 0 }}>
                      <div className="label-dot"></div>
                      Request Pricing Plan
                    </div>
                    <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="field">
                      <label className="field-label">Name</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="field">
                      <label className="field-label">Organization Name</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.organizationName}
                        onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Purpose of Using This</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.purpose}
                        onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Describe What the Script Should Contain</label>
                      <textarea
                        className="field-input"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                        value={formData.scriptContent}
                        onChange={e => setFormData({ ...formData, scriptContent: e.target.value })}
                        required
                      />
                    </div>

                    <div className="field">
                      <label className="field-label">Credits Selected</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.creditsSelected}
                        readOnly
                        style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed' }}
                      />
                    </div>

                    <button type="submit" className="btn-call" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
                      Send Request
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
