import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SmokeBackground } from '../layout/SmokeBackground';
import { Shield, LogIn, CheckCircle2, X, ChevronDown, Check } from 'lucide-react';
import '../../styles/BolnaDashboard.css';

const PURPOSE_TEMPLATES = [
  "Payment Reminder (Any service)",
  "EMI / Loan Restructuring Offers",
  "Credit Card Pre-approved Offers",
  "Insurance Renewal (especially when near expiry)",
  "Sales Offer",
  "Educational Course / Job-Oriented Training Promotion",
  "College Admission",
  "College Fee Payment Reminder",
  "Other"
];

export default function PricingPage() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    email: '',
    selectedPurposes: [],
    otherPurpose: '',
    callPurpose: '',
    targetAudience: '',
    scriptPoints: '',
    creditsSelected: ''
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const togglePurpose = (purpose) => {
    setFormData(prev => {
      const selected = prev.selectedPurposes.includes(purpose)
        ? prev.selectedPurposes.filter(p => p !== purpose)
        : [...prev.selectedPurposes, purpose];
      return { ...prev, selectedPurposes: selected };
    });
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      // Format data for backend
      const finalPurpose = formData.selectedPurposes.join(', ') + 
        (formData.selectedPurposes.includes('Other') && formData.otherPurpose ? ` (${formData.otherPurpose})` : '');
      
      const finalScriptContent = `Target Audience: ${formData.targetAudience}\nScript Points: ${formData.scriptPoints}`;

      const payload = {
        name: formData.name,
        organizationName: formData.organizationName,
        email: formData.email,
        purpose: finalPurpose,
        callPurpose: formData.callPurpose,
        scriptContent: finalScriptContent,
        creditsSelected: formData.creditsSelected
      };

      await axios.post('http://localhost:5000/api/requests', payload);
      setSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
        setFormData({
          name: '',
          organizationName: '',
          email: '',
          selectedPurposes: [],
          otherPurpose: '',
          callPurpose: '',
          targetAudience: '',
          scriptPoints: '',
          creditsSelected: ''
        });
      }, 3000);
    } catch (error) {
      alert('Failed to send request. Please try again.');
    }
  };

  const isOtherSelected = formData.selectedPurposes.includes('Other');

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
            <div className="panel" data-hide-scrollbar style={{ width: '100%', maxWidth: '540px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                      <label className="field-label">Email ID</label>
                      <input
                        type="email"
                        className="field-input"
                        placeholder="yourname@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="field" style={{ position: 'relative' }} ref={dropdownRef}>
                      <label className="field-label">Purpose of Using This</label>
                      <div 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="field-input"
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          cursor: 'pointer', minHeight: '44px', padding: '8px 16px'
                        }}
                      >
                        <span style={{ 
                          color: formData.selectedPurposes.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                          fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {formData.selectedPurposes.length > 0 
                            ? formData.selectedPurposes.join(', ') 
                            : 'Select purpose(s)'}
                        </span>
                        <ChevronDown size={16} style={{ 
                          transform: showDropdown ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          color: 'rgba(255,255,255,0.3)'
                        }} />
                      </div>
                      
                      {showDropdown && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                          marginTop: '8px', background: '#1a1a1a', 
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden'
                        }}>
                          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '8px' }}>
                            {PURPOSE_TEMPLATES.map((tpl) => (
                              <div 
                                key={tpl}
                                onClick={() => togglePurpose(tpl)}
                                style={{
                                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  background: formData.selectedPurposes.includes(tpl) ? 'rgba(255,255,255,0.05)' : 'transparent',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = formData.selectedPurposes.includes(tpl) ? 'rgba(255,255,255,0.05)' : 'transparent'}
                              >
                                <div style={{
                                  width: '18px', height: '18px', borderRadius: '4px',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: formData.selectedPurposes.includes(tpl) ? '#fff' : 'transparent'
                                }}>
                                  {formData.selectedPurposes.includes(tpl) && <Check size={12} color="#000" strokeWidth={3} />}
                                </div>
                                <span style={{ color: '#fff', fontSize: '13px' }}>{tpl}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {isOtherSelected && (
                      <>
                        <div className="field">
                          <label className="field-label">Who are you making calls to</label>
                          <input
                            type="text"
                            className="field-input"
                            value={formData.targetAudience}
                            onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                            required
                          />
                        </div>
                        <div className="field">
                          <label className="field-label">Important points you want in the script</label>
                          <textarea
                            className="field-input"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                            value={formData.scriptPoints}
                            onChange={e => setFormData({ ...formData, scriptPoints: e.target.value })}
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="field">
                      <label className="field-label">Purpose of the Call</label>
                      <textarea
                        className="field-input"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                        placeholder="Briefly describe the purpose of the calls you intend to make"
                        value={formData.callPurpose}
                        onChange={e => setFormData({ ...formData, callPurpose: e.target.value })}
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

                    <button 
                      type="submit" 
                      className="btn-call" 
                      style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                      disabled={formData.selectedPurposes.length === 0}
                    >
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
