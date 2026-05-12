import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmokeBackground } from '../layout/SmokeBackground';
import { ArrowLeft, Check, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import '../../styles/BolnaDashboard.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹4,999',
    setup: '₹7,999',
    cta: 'Get Started',
    popular: false,
    features: [
      '2,000 Completed AI calls',
      'No charges for No-Answer/Busy',
      'Telugu & English AI voice agents',
      'AI summaries & classification',
      'Campaign analytics',
      'Excel Upload',
      'Single workspace',
      'Email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₹11,999',
    setup: '₹14,999',
    cta: 'Scale With AI',
    popular: true,
    features: [
      '6,000 Completed AI calls',
      'No charges for No-Answer/Busy',
      'Multi-campaign AI calling',
      'AI retry calling unlock',
      'Advanced analytics',
      'AI conversation insights',
      'Lead tracking',
      'Faster processing',
      '3 team members',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹24,999',
    setup: '₹29,999',
    cta: 'Contact Sales',
    popular: false,
    features: [
      '15,000 Completed AI calls',
      'No charges for No-Answer/Busy',
      'Multi-agent AI calling',
      'Custom AI voice',
      'Dedicated infrastructure',
      'Enterprise analytics',
      'Priority queue',
      'Dedicated onboarding',
      'Team collaboration',
    ],
  },
];

const CREDIT_STEPS = [
  { label: '₹2,999',  payment: '₹2,999',  calls: 500,   bestFor: 'Trial campaigns & small follow-ups'     },
  { label: '₹4,999',  payment: '₹4,999',  calls: 1000,  bestFor: 'Small outreach operations'              },
  { label: '₹19,999', payment: '₹19,999', calls: 5000,  bestFor: 'Growing campaigns'                      },
  { label: '₹34,999', payment: '₹34,999', calls: 10000, bestFor: 'High-volume outreach'                   },
  { label: '₹47,999', payment: '₹47,999', calls: 15000, bestFor: 'Enterprise operations'                  },
  { label: '₹59,999', payment: '₹59,999', calls: 20000, bestFor: 'Large-scale AI outreach infrastructure' },
];

const PAGE_STYLES = `
  @keyframes fadeSlideUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes bestForFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes modalIn     { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }

  input[type=range].credit-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 4px; border-radius: 99px;
    outline: none; cursor: pointer;
    background: linear-gradient(90deg, #a78bfa 0%, #34d399 100%);
  }
  input[type=range].credit-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 20px; height: 20px; border-radius: 50%;
    background: #a78bfa; border: 2px solid #fff;
    box-shadow: 0 0 10px rgba(167,139,250,0.6); cursor: pointer;
    transition: box-shadow 0.2s ease;
  }
  input[type=range].credit-slider::-webkit-slider-thumb:hover { box-shadow: 0 0 18px rgba(167,139,250,0.9); }
  input[type=range].credit-slider::-moz-range-thumb {
    width: 20px; height: 20px; border-radius: 50%;
    background: #a78bfa; border: 2px solid #fff;
    box-shadow: 0 0 10px rgba(167,139,250,0.6); cursor: pointer;
  }

  .bestfor-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 999px;
    background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.25);
    font-size: 13px; font-family: Outfit, sans-serif; color: #c4b5fd; font-weight: 500;
    animation: bestForFade 0.3s cubic-bezier(0.16,1,0.3,1) both; margin-bottom: 20px;
  }

  .topup-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #a78bfa, #34d399);
    color: #0a0a0a; font-family: Outfit, sans-serif; font-weight: 700; font-size: 15px;
    box-shadow: 0 6px 28px rgba(167,139,250,0.35);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .topup-btn:hover { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 10px 36px rgba(167,139,250,0.45); }

  .sales-field { display: flex; flex-direction: column; gap: 6px; }
  .sales-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); font-family: Outfit, sans-serif; letter-spacing: 0.04em; }
  .sales-input {
    background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.15);
    color: #fff; font-family: Outfit, sans-serif; font-size: 15px;
    padding: 10px 0; outline: none; width: 100%; transition: border-color 0.2s;
  }
  .sales-input::placeholder { color: rgba(255,255,255,0.2); }
  .sales-input:focus { border-bottom-color: #a78bfa; }
  .phone-row { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); transition: border-color 0.2s; }
  .phone-row:focus-within { border-bottom-color: #a78bfa; }
  .country-prefix {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 10px 10px 0; cursor: pointer;
    font-family: Outfit, sans-serif; font-size: 14px; color: rgba(255,255,255,0.6);
    white-space: nowrap; flex-shrink: 0;
  }
  .phone-input {
    background: none; border: none; color: #fff;
    font-family: Outfit, sans-serif; font-size: 15px;
    padding: 10px 0; outline: none; flex: 1;
  }
  .phone-input::placeholder { color: rgba(255,255,255,0.2); }
  .ok-btn {
    padding: 10px 28px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08); color: #fff;
    font-family: Outfit, sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; margin-top: 8px; align-self: flex-start;
  }
  .ok-btn:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.35); }
`;

export default function UpgradePricingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', org: '', email: '' });
  const [proForm, setProForm] = useState({ name: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [proSubmitted, setProSubmitted] = useState(false);
  const [sliderIdx, setSliderIdx] = useState(0);

  const currentStep = CREDIT_STEPS[sliderIdx];

  const handlePlanClick = (plan) => {
    if (plan.id === 'pro') { setShowProModal(true); return; }
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/requests`, {
        name: formData.name, organizationName: formData.org, email: formData.email,
        creditsSelected: selectedPlan?.name, purpose: 'AI Calling Plan Upgrade',
        callPurpose: 'Plan upgrade', scriptContent: '', purposeType: 'regular',
      });
      setSubmitted(true);
      setTimeout(() => { setShowModal(false); setSubmitted(false); setFormData({ name: '', org: '', email: '' }); }, 3000);
    } catch { alert('Failed to submit. Please try again.'); }
  };

  const handleProSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/requests`, {
        name: proForm.name, email: proForm.email, phone: proForm.phone,
        purpose: 'Pro Plan - Contact Sales', callPurpose: 'Enterprise sales inquiry',
        creditsSelected: 'Pro', scriptContent: '', purposeType: 'regular',
      });
      setProSubmitted(true);
      setTimeout(() => { setShowProModal(false); setProSubmitted(false); setProForm({ name: '', email: '', phone: '' }); }, 3000);
    } catch { alert('Failed to submit. Please try again.'); }
  };

  return (
    <div className="app" style={{ overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
      <SmokeBackground />

      {/* ── Header ── */}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hdr-left">
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: '500', transition: 'color 0.2s', padding: 0 }}
            onMouseOver={e => e.currentTarget.style.color = '#fff'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
        <div className="hdr-badge">Upgrade Your Plan</div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px', minHeight: 'calc(100vh - 80px)' }}>

        {/* ── Page Title ── */}
        <div style={{ textAlign: 'center', marginBottom: '60px', animation: 'fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) both' }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', color: '#fff', marginBottom: '14px', letterSpacing: '-0.03em', fontFamily: 'Outfit, sans-serif' }}>
            Upgrade your <span className="hdr-accent">plan</span>
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit, sans-serif' }}>
            Scale your outreach with the right number of AI call credits.
          </p>
        </div>

        {/* ── Pricing Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%', maxWidth: '1100px', marginBottom: '80px' }}>
          {PLANS.map((plan, idx) => (
            <div
              key={plan.id}
              style={{
                position: 'relative', padding: '44px 36px',
                background: plan.popular ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.025)',
                border: plan.popular ? '1px solid rgba(167,139,250,0.35)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: '22px', display: 'flex', flexDirection: 'column',
                animation: `fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) ${0.1 + idx * 0.1}s both`,
                boxShadow: plan.popular ? '0 0 60px rgba(167,139,250,0.14)' : 'none',
                transition: 'border-color 0.25s ease, background 0.25s ease, transform 0.25s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = plan.popular ? 'rgba(167,139,250,0.11)' : 'rgba(255,255,255,0.045)'; e.currentTarget.style.borderColor = plan.popular ? 'rgba(167,139,250,0.55)' : 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = plan.popular ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = plan.popular ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #a78bfa, #34d399)', color: '#0a0a0a', fontSize: '11px', fontWeight: '800', fontFamily: 'Outfit', letterSpacing: '0.12em', padding: '5px 18px', borderRadius: '0 0 12px 12px', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: '15px', color: plan.popular ? '#a78bfa' : 'rgba(255,255,255,0.45)', fontFamily: 'Outfit', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', marginTop: plan.popular ? '16px' : '0' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: '800', color: '#fff', fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit' }}>/month</span>
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Outfit', marginBottom: '24px' }}>+ {plan.setup} one-time setup</div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '22px' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '13px', flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Check size={14} style={{ color: plan.popular ? '#a78bfa' : 'rgba(255,255,255,0.35)', flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit', lineHeight: '1.5' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanClick(plan)}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: '12px',
                  fontFamily: 'Outfit', fontWeight: '700', fontSize: '15px',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  ...(plan.popular ? { background: 'linear-gradient(135deg, #a78bfa, #34d399)', border: 'none', color: '#0a0a0a', boxShadow: '0 6px 28px rgba(167,139,250,0.4)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }),
                }}
                onMouseEnter={e => { if (plan.popular) { e.currentTarget.style.opacity = '0.88'; } else { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (plan.popular) { e.currentTarget.style.opacity = '1'; } else { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
              >
                {plan.cta} {plan.popular && <ArrowRight size={15} />}
              </button>
            </div>
          ))}
        </div>

        {/* ── Add-On Credits Slider ── */}
        <div style={{ width: '100%', maxWidth: '1100px', marginBottom: '80px' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', fontWeight: '700', color: '#fff', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', marginBottom: '8px', textAlign: 'center' }}>Add-On Credits</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', fontFamily: 'Outfit, sans-serif', marginBottom: '28px', textAlign: 'center' }}>
            Need more calls? Top up your plan with add-on credit packs.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '36px 40px' }}>

            <div key={sliderIdx} className="bestfor-badge">
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #34d399)', flexShrink: 0, display: 'inline-block' }} />
              Best for: {currentStep.bestFor}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
              <div>
                <span style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', color: '#a78bfa', fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>
                  {currentStep.calls.toLocaleString()} calls
                </span>
                <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Outfit', marginLeft: '14px' }}>
                  {currentStep.payment}
                </span>
              </div>

              {/* Top Up button — no modal, no action */}
              <button className="topup-btn">
                <Zap size={16} fill="#0a0a0a" />
                Top Up {currentStep.payment}
              </button>
            </div>

            <input
              type="range" className="credit-slider"
              min={0} max={CREDIT_STEPS.length - 1} step={1}
              value={sliderIdx} onChange={e => setSliderIdx(Number(e.target.value))}
              style={{ marginBottom: '12px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {CREDIT_STEPS.map((s, i) => (
                <span key={s.label} onClick={() => setSliderIdx(i)} style={{ fontSize: '11px', fontFamily: 'Outfit', color: i === sliderIdx ? '#a78bfa' : 'rgba(255,255,255,0.25)', fontWeight: i === sliderIdx ? '700' : '400', cursor: 'pointer', transition: 'color 0.2s', userSelect: 'none' }}>{s.label}</span>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* ══ STARTER / GROWTH MODAL ══ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowModal(false)}>
          <div className="panel" style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '18px', position: 'relative', animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }} onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle2 size={48} style={{ color: '#34d399', margin: '0 auto 16px', display: 'block' }} />
                <h3 style={{ fontSize: 22, color: '#fff', marginBottom: 8, fontFamily: 'Outfit' }}>Request Sent!</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Outfit' }}>Our team will reach out shortly.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <div className="panel-label" style={{ padding: 0, marginBottom: 4 }}><div className="label-dot" /> Upgrade Plan</div>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'Outfit' }}>{selectedPlan?.name} Plan</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[['name','Full Name','text','Your full name'],['org','Organization','text','Company name'],['email','Work Email','email','work@example.com']].map(([key, label, type, ph]) => (
                    <div key={key} className="field">
                      <label className="field-label">{label}</label>
                      <input type={type} className="field-input" placeholder={ph} required value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
                    </div>
                  ))}
                  <button type="submit" style={{ width: '100%', padding: '13px', marginTop: 8, borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #a78bfa, #34d399)', color: '#0a0a0a', fontFamily: 'Outfit', fontWeight: '700', fontSize: '14px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Submit Request</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ PRO CONTACT SALES MODAL ══ */}
      {showProModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowProModal(false)}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '40px 44px', position: 'relative', animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }} onClick={e => e.stopPropagation()}>
            {proSubmitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle2 size={52} style={{ color: '#34d399', margin: '0 auto 18px', display: 'block' }} />
                <h3 style={{ fontSize: 24, color: '#fff', marginBottom: 10, fontFamily: 'Outfit', fontWeight: 700 }}>Thank you!</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, fontFamily: 'Outfit', lineHeight: 1.6 }}>Our sales team will contact you within 24 hours.</p>
              </div>
            ) : (
              <>
                <button onClick={() => setShowProModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#a78bfa', fontWeight: 700, fontFamily: 'Outfit' }}>1</div>
                  <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'Outfit', margin: 0 }}>CallingGen — Pro Plan | Contact Sales</h2>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'Outfit', marginBottom: 36, lineHeight: 1.5 }}>Please provide your details and our sales team will connect with you shortly.</p>
                <form onSubmit={handleProSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div className="sales-field">
                    <label className="sales-label">Full Name *</label>
                    <input className="sales-input" type="text" placeholder="Type your answer here..." required value={proForm.name} onChange={e => setProForm({ ...proForm, name: e.target.value })} />
                  </div>
                  <div className="sales-field">
                    <label className="sales-label">Business Email *</label>
                    <input className="sales-input" type="email" placeholder="name@example.com" required value={proForm.email} onChange={e => setProForm({ ...proForm, email: e.target.value })} />
                  </div>
                  <div className="sales-field">
                    <label className="sales-label">Phone Number *</label>
                    <div className="phone-row">
                      <div className="country-prefix">
                        <span style={{ fontSize: 18 }}>🇮🇳</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>▾</span>
                        <span style={{ marginLeft: 2, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>+91</span>
                        <span style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.12)', margin: '0 10px' }} />
                      </div>
                      <input className="phone-input" type="tel" placeholder="081234 56789" required value={proForm.phone} onChange={e => setProForm({ ...proForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="ok-btn">OK ✓</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}