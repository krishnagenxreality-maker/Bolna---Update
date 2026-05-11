import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { SmokeBackground } from '../layout/SmokeBackground';
import { Shield, LogIn, CheckCircle2, X, Phone, Mic, Zap, Users, BarChart3, Globe, ArrowRight, Check } from 'lucide-react';
import '../../styles/BolnaDashboard.css';
import '../../styles/PricingPage.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹4,999',
    setup: '₹7,999',
    cta: 'Get Started',
    popular: false,
    features: [
      'Up to 2,000 AI calls / month',
      'Telugu & English AI voice agents',
      'AI call summaries',
      'AI lead classification',
      'Campaign analytics',
      'CSV upload',
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
      'Up to 6,000 AI calls / month',
      'Multi-campaign AI calling',
      'AI retry calling',
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
      'Up to 15,000 AI calls / month',
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

const CREDITS = [
  { calls: '1,000 Calls', price: '₹2,499' },
  { calls: '5,000 Calls', price: '₹9,999' },
  { calls: '10,000 Calls', price: '₹17,999' },
];

const ENTERPRISE_FEATURES = [
  { icon: <Globe size={18} />, text: 'Custom AI deployment' },
  { icon: <Zap size={18} />, text: 'Dedicated infrastructure' },
  { icon: <Mic size={18} />, text: 'Multilingual AI agents' },
  { icon: <Phone size={18} />, text: 'Enterprise-scale AI calling' },
  { icon: <Users size={18} />, text: 'Unlimited team members' },
  { icon: <BarChart3 size={18} />, text: 'Priority support & SLA' },
];

// Simple waveform bars component
function WaveformBars({ active }) {
  return (
    <div className="pp-wave" aria-hidden>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`pp-wave-bar${active ? ' pp-wave-bar--active' : ''}`}
          style={{ animationDelay: `${i * 0.07}s` }}
        />
      ))}
    </div>
  );
}

// Floating call indicator
function CallIndicator({ label, top, left, delay }) {
  return (
    <div className="pp-call-indicator" style={{ top, left, animationDelay: delay }}>
      <div className="pp-ci-dot" />
      <span className="pp-ci-label">{label}</span>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', org: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [waveActive, setWaveActive] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setWaveActive(v => !v), 2200);
    return () => clearInterval(t);
  }, []);

  const handlePlanClick = (plan) => {
    if (plan.id === 'pro') {
      window.location.href = 'mailto:sales@callinggen.ai';
      return;
    }
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/requests`, {
        name: formData.name,
        organizationName: formData.org,
        email: formData.email,
        creditsSelected: selectedPlan?.name,
        purpose: 'AI Calling Plan Inquiry',
        callPurpose: 'Plan selection',
        scriptContent: '',
        purposeType: 'regular',
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setFormData({ name: '', org: '', email: '' });
      }, 3000);
    } catch {
      alert('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="app">
      <SmokeBackground />

      {/* Ambient glow blobs */}
      <div className="pp-glow pp-glow--1" />
      <div className="pp-glow pp-glow--2" />

      {/* Header */}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hdr-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="logo-mark"><Shield size={20} /></div>
          <span className="hdr-title">Calling <span className="hdr-accent">Gen</span></span>
          <div className="hdr-badge" style={{ marginLeft: 12 }}>by GenxReality</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <button onClick={() => navigate('/pricing')} className="nav-link" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600 }}>Pricing</button>
          <button onClick={() => navigate('/login', { state: { from: '/pricing' } })} className="logout-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}>
            <LogIn size={16} /> Login
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <section className="pp-hero">
          {/* Floating indicators */}
          <CallIndicator label="AI Call Active" top="18%" left="8%" delay="0s" />
          <CallIndicator label="Agent Connected" top="32%" left="85%" delay="0.6s" />
          <CallIndicator label="Processing Voice" top="72%" left="6%" delay="1.2s" />
          <CallIndicator label="Lead Classified" top="60%" left="88%" delay="0.3s" />

          <div className="pp-hero-inner">
            <div className="pp-hero-badge">
              <div className="pp-ci-dot" style={{ width: 7, height: 7 }} />
              AI Voice Infrastructure
            </div>

            <h1 className="pp-hero-h1">
              AI Calling Infrastructure<br />
              <span className="pp-hero-accent">for Modern Outreach</span>
            </h1>

            <p className="pp-hero-sub">
              Deploy multilingual AI voice agents that handle outreach calls<br />
              intelligently at scale.
            </p>

            <WaveformBars active={waveActive} />

            <div className="pp-hero-btns">
              <button className="btn-call pp-btn-primary" onClick={() => document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' })}>
                <Phone size={16} /> Start AI Calling
              </button>
              <button className="btn-call" style={{ background: 'transparent' }} onClick={() => window.location.href = 'mailto:sales@callinggen.ai'}>
                Book Demo <ArrowRight size={15} />
              </button>
            </div>

            {/* Mini stats */}
            <div className="pp-hero-stats">
              {[['15K+', 'AI Calls / Day'], ['99.9%', 'Uptime SLA'], ['12+', 'Languages'], ['< 1s', 'Response Time']].map(([v, l]) => (
                <div key={l} className="pp-hero-stat">
                  <span className="pp-hero-stat-val">{v}</span>
                  <span className="pp-hero-stat-lbl">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="pp-section" id="pricing-section">
          <div className="pp-section-label">Simple Pricing</div>
          <h2 className="pp-section-h2">Built for scalable AI voice outreach</h2>
          <p className="pp-section-sub">One platform. All your AI calling infrastructure needs.</p>

          <div className="pp-cards">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`pp-card${plan.popular ? ' pp-card--popular' : ''}`}
              >
                {plan.popular && (
                  <div className="pp-card-badge">MOST POPULAR</div>
                )}

                <div className="pp-card-name">{plan.name}</div>

                <div className="pp-card-price">
                  <span className="pp-card-amount">{plan.price}</span>
                  <span className="pp-card-period">/month</span>
                </div>

                <div className="pp-card-setup">
                  + {plan.setup} one-time setup
                </div>

                <div className="pp-card-divider" />

                <ul className="pp-card-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Check size={14} className="pp-check" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`btn-call pp-card-cta${plan.popular ? ' pp-btn-primary' : ''}`}
                  onClick={() => handlePlanClick(plan)}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── ENTERPRISE ── */}
        <section className="pp-section">
          <div className="pp-enterprise">
            <div className="pp-enterprise-left">
              <div className="pp-section-label" style={{ justifyContent: 'flex-start' }}>Enterprise</div>
              <h2 className="pp-enterprise-h2">Enterprise AI Calling</h2>
              <p className="pp-enterprise-sub">
                Custom AI calling infrastructure for high-volume outreach operations.
                Tailored deployment, SLA guarantees, and white-glove onboarding.
              </p>
              <button className="btn-call pp-btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => window.location.href = 'mailto:sales@callinggen.ai'}>
                Talk To Sales <ArrowRight size={15} />
              </button>
            </div>
            <div className="pp-enterprise-right">
              {ENTERPRISE_FEATURES.map(({ icon, text }) => (
                <div key={text} className="pp-ent-feat">
                  <div className="pp-ent-icon">{icon}</div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CREDITS ── */}
        <section className="pp-section" style={{ paddingBottom: 80 }}>
          <div className="pp-section-label">Add-On Credits</div>
          <h2 className="pp-section-h2">Additional AI Call Credits</h2>
          <p className="pp-section-sub">Scale instantly with additional AI outreach credits.</p>

          <div className="pp-credits">
            {CREDITS.map(({ calls, price }) => (
              <div key={calls} className="pp-credit-row">
                <div className="pp-credit-calls">
                  <Phone size={14} style={{ opacity: 0.5 }} />
                  {calls}
                </div>
                <div className="pp-credit-dots" />
                <div className="pp-credit-price">{price}</div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="pp-overlay" onClick={() => setShowModal(false)}>
          <div className="panel pp-modal" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle2 size={48} className="sn-green" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 22, color: '#fff', marginBottom: 8 }}>Request Sent!</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Our team will reach out shortly.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <div className="panel-label" style={{ padding: 0, marginBottom: 4 }}>
                      <div className="label-dot" /> Get Started
                    </div>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{selectedPlan?.name} Plan</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[['name', 'Full Name', 'text', 'Your full name'], ['org', 'Organization', 'text', 'Company name'], ['email', 'Work Email', 'email', 'work@example.com']].map(([key, label, type, ph]) => (
                    <div key={key} className="field">
                      <label className="field-label">{label}</label>
                      <input type={type} className="field-input" placeholder={ph} required value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
                    </div>
                  ))}
                  <button type="submit" className="btn-call pp-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                    Submit Request
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky mobile CTA */}
      <div className="pp-sticky-cta">
        <button className="btn-call pp-btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' })}>
          <Phone size={15} /> View Plans
        </button>
      </div>
    </div>
  );
}
