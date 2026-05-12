import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Shield, LogIn, CheckCircle2, X, Phone, ArrowRight, Check, ChevronDown } from 'lucide-react';
import '../../styles/BolnaDashboard.css';
import '../../styles/PricingPage.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹4,999',
    setup: '₹7,999',
    credits: 2000,
    cta: 'Get Started',
    popular: false,
    features: [
      '2,000 Completed AI calls',
      'No charges for No-Answer/Busy',
      'Telugu & English AI voice agents',
      'AI call summaries',
      'AI lead classification',
      'Campaign analytics',
      'CSV upload',
      'Single workspace',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₹11,999',
    setup: '₹14,999',
    credits: 6000,
    cta: 'Scale With AI',
    popular: true,
    features: [
      '6,000 Completed AI calls',
      'No charges for No-Answer/Busy',
      'Multi-campaign AI calling',
      'AI retry calling',
      'Advanced analytics',
      'AI conversation insights',
      'Lead tracking',
      '3 team members',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹24,999',
    setup: '₹29,999',
    credits: 15000,
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

const FAQS = [
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit/debit cards, UPI, net banking, and bank transfers. All payments are processed securely in INR.',
  },
  {
    q: 'Is the setup fee a one-time charge?',
    a: 'Yes, the setup fee is a one-time charge paid at the time of onboarding. It covers account configuration, AI agent setup, and initial campaign assistance. It is not recurring.',
  },
  {
    q: 'What happens if I exceed my monthly call limit?',
    a: "If you exceed your plan's monthly call limit, your campaigns will pause automatically. You can purchase add-on credit packs instantly to continue without any downtime.",
  },
  {
    q: 'Do unused credits roll over to the next month?',
    a: 'Monthly plan credits reset at the end of each billing cycle and do not roll over. However, add-on credit packs you purchase separately are valid for 90 days from the date of purchase.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes, you can upgrade your plan at any time and the change takes effect immediately. Downgrades take effect at the start of your next billing cycle.',
  },
  {
    q: 'What counts as one AI call credit?',
    a: 'One credit equals one successfully completed outbound AI call. We do NOT deduct credits for calls that are busy, failed, cancelled, or go to voicemail (No Answer). You only pay for results.',
  },
  {
    q: 'Are add-on credits tied to a specific plan?',
    a: 'No, add-on credit packs can be purchased on any plan — Starter, Growth, or Pro. They are added on top of your existing monthly allocation and can be used immediately.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Setup fees are non-refundable. For monthly subscriptions, if you face a technical issue on our end, we will issue pro-rated credits. Please contact support@callinggen.ai for refund requests.',
  },
  {
    q: 'Do you offer a free trial?',
    a: 'We currently do not offer a self-serve free trial. However, you can book a demo with our team and we will run a sample campaign so you can evaluate the platform before subscribing.',
  },
  {
    q: 'Is GST included in the pricing?',
    a: 'All displayed prices are exclusive of GST. Applicable GST (18%) will be added at checkout. A GST invoice will be provided for all transactions.',
  },
];

const PAGE_STYLES = `
  @keyframes fadeSlideUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmerLine { from { transform:translateX(-100%); } to { transform:translateX(100%); } }
  @keyframes glowPulse   { 0%,100%{ box-shadow:0 0 0 0 rgba(255,255,255,0.04); } 50%{ box-shadow:0 0 32px 0 rgba(255,255,255,0.07); } }
  @keyframes bestForFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

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
  input[type=range].credit-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 18px rgba(167,139,250,0.9);
  }
  input[type=range].credit-slider::-moz-range-thumb {
    width: 20px; height: 20px; border-radius: 50%;
    background: #a78bfa; border: 2px solid #fff;
    box-shadow: 0 0 10px rgba(167,139,250,0.6); cursor: pointer;
  }

  .faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s ease; }
  .faq-item:last-child { border-bottom: none; }
  .faq-question {
    width: 100%; display: flex; justify-content: space-between;
    align-items: center; gap: 16px;
    padding: 20px 0; background: none; border: none;
    cursor: pointer; text-align: left;
    color: #fff; font-family: Outfit, sans-serif;
    font-size: 15px; font-weight: 600;
    transition: color 0.2s ease;
  }
  .faq-question:hover { color: #c4b5fd; }
  .faq-answer { overflow: hidden; transition: max-height 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease; }
  .faq-chevron { flex-shrink: 0; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); color: rgba(255,255,255,0.3); }
  .faq-chevron--open { transform: rotate(180deg); color: #a78bfa; }

  .bestfor-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 999px;
    background: rgba(167,139,250,0.1);
    border: 1px solid rgba(167,139,250,0.25);
    font-size: 13px; font-family: Outfit, sans-serif;
    color: #c4b5fd; font-weight: 500;
    animation: bestForFade 0.3s cubic-bezier(0.16,1,0.3,1) both;
    margin-bottom: 20px;
  }
`;

export default function PricingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', org: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const currentStep = CREDIT_STEPS[sliderIdx];

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

  const sectionStyle = {
    width: '100%',
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '80px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const pillLabel = (text) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '5px 14px', borderRadius: '999px',
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.05)',
      fontSize: '11px', color: 'rgba(255,255,255,0.45)',
      fontFamily: 'Outfit', letterSpacing: '0.1em',
      textTransform: 'uppercase', marginBottom: '20px',
      position: 'relative', overflow: 'hidden',
      animation: 'fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <span style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
        animation: 'shimmerLine 1.2s ease-out 0.3s 1 forwards',
        pointerEvents: 'none',
      }} />
      {text}
    </div>
  );

  return (
    <div className="app" style={{ overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }} />

      {/* ── Header ── */}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
        <div className="hdr-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="logo-mark"><Shield size={20} /></div>
          <span className="hdr-title">Calling <span className="hdr-accent">Gen</span></span>
          <div className="hdr-badge" style={{ marginLeft: 12 }}>by GenxReality</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <button
            onClick={() => navigate('/pricing')}
            className="nav-link"
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(52,211,153,0.15))',
              border: '1px solid rgba(167,139,250,0.45)',
              color: '#c4b5fd', cursor: 'pointer',
              fontFamily: 'Outfit', fontWeight: '600', fontSize: '14px',
              padding: '7px 18px', borderRadius: '8px', letterSpacing: '0.02em',
              boxShadow: '0 0 16px rgba(167,139,250,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
              transition: 'all 0.25s ease',
              animation: 'glowPulse 3s ease-in-out infinite',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.28), rgba(52,211,153,0.22))';
              e.currentTarget.style.boxShadow = '0 0 28px rgba(167,139,250,0.45), inset 0 1px 0 rgba(255,255,255,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(52,211,153,0.15))';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(167,139,250,0.25), inset 0 1px 0 rgba(255,255,255,0.08)';
            }}
          >
            ✦ Pricing
          </button>
          <button
            onClick={() => navigate('/login', { state: { from: '/pricing' } })}
            className="logout-btn"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }}
          >
            <LogIn size={16} /> Login
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ PRICING PLANS ══ */}
        <section style={{ ...sectionStyle, paddingTop: '100px' }} id="pricing-section">
          {pillLabel('Simple Pricing')}
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', color: '#fff',
            fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em', lineHeight: '1.1',
            marginBottom: '18px',
            animation: 'fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.1s both',
          }}>
            Built for scalable AI voice outreach
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '18px',
            fontFamily: 'Outfit, sans-serif', marginBottom: '64px', maxWidth: '560px', lineHeight: '1.6',
            animation: 'fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.2s both',
          }}>
            One platform. All your AI calling infrastructure needs.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px', width: '100%', maxWidth: '1200px',
          }}>
            {PLANS.map((plan, idx) => (
              <div
                key={plan.id}
                style={{
                  position: 'relative', padding: '44px 36px',
                  background: plan.popular ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.025)',
                  border: plan.popular ? '1px solid rgba(167,139,250,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '22px', display: 'flex', flexDirection: 'column',
                  animation: `fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) ${0.15 + idx * 0.1}s both`,
                  boxShadow: plan.popular ? '0 0 60px rgba(167,139,250,0.14)' : 'none',
                  transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = plan.popular ? 'rgba(167,139,250,0.11)' : 'rgba(255,255,255,0.045)';
                  e.currentTarget.style.borderColor = plan.popular ? 'rgba(167,139,250,0.55)' : 'rgba(255,255,255,0.14)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = plan.popular ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.025)';
                  e.currentTarget.style.borderColor = plan.popular ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #a78bfa, #34d399)',
                    color: '#0a0a0a', fontSize: '11px', fontWeight: '800',
                    fontFamily: 'Outfit', letterSpacing: '0.12em', padding: '5px 18px',
                    borderRadius: '0 0 12px 12px', whiteSpace: 'nowrap',
                  }}>MOST POPULAR</div>
                )}
                <div style={{
                  fontSize: '15px', color: plan.popular ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'Outfit', fontWeight: '700', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: '20px', marginTop: plan.popular ? '16px' : '0',
                }}>
                  {plan.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: '800', color: '#fff', fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>{plan.price}</span>
                  <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit' }}>/month</span>
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Outfit', marginBottom: '28px' }}>
                  + {plan.setup} one-time setup
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '26px' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <Check size={15} style={{ color: plan.popular ? '#a78bfa' : 'rgba(255,255,255,0.35)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit', lineHeight: '1.5' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanClick(plan)}
                  style={{
                    width: '100%', padding: '16px 24px', borderRadius: '12px',
                    fontFamily: 'Outfit', fontWeight: '700', fontSize: '16px',
                    cursor: 'pointer', transition: 'all 0.25s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    ...(plan.popular ? {
                      background: 'linear-gradient(135deg, #a78bfa, #34d399)',
                      border: 'none', color: '#0a0a0a',
                      boxShadow: '0 6px 28px rgba(167,139,250,0.4)',
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.75)',
                    }),
                  }}
                  onMouseEnter={e => {
                    if (plan.popular) { e.currentTarget.style.opacity = '0.88'; }
                    else { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }
                  }}
                  onMouseLeave={e => {
                    if (plan.popular) { e.currentTarget.style.opacity = '1'; }
                    else { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }
                  }}
                >
                  {plan.cta} {plan.popular && <ArrowRight size={16} />}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ══ ADD-ON CREDITS ══ */}
        <section style={{ ...sectionStyle, paddingTop: '20px', paddingBottom: '80px' }}>
          <h2 style={{
            fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: '700', color: '#fff',
            fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', marginBottom: '10px',
          }}>
            Add-On Credits
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '15px',
            fontFamily: 'Outfit, sans-serif', marginBottom: '32px', maxWidth: '480px',
          }}>
            See pricing for users who opt in for add-on credits on their current plans.
          </p>

          <div style={{
            width: '100%', maxWidth: '680px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '36px 40px', textAlign: 'left',
          }}>
            {/* Best For badge — animates on slider change */}
            <div key={sliderIdx} className="bestfor-badge">
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #a78bfa, #34d399)',
                flexShrink: 0, display: 'inline-block',
              }} />
              Best for: {currentStep.bestFor}
            </div>

            {/* Calls highlighted, amount dimmed */}
            <div style={{ marginBottom: '28px' }}>
              <span style={{
                fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800',
                color: '#a78bfa', fontFamily: 'Outfit', letterSpacing: '-0.03em',
              }}>
                {currentStep.calls.toLocaleString()} calls
              </span>
              <span style={{
                fontSize: '18px', color: 'rgba(255,255,255,0.35)',
                fontFamily: 'Outfit', marginLeft: '14px',
              }}>
                {currentStep.payment}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              className="credit-slider"
              min={0}
              max={CREDIT_STEPS.length - 1}
              step={1}
              value={sliderIdx}
              onChange={e => setSliderIdx(Number(e.target.value))}
              style={{ marginBottom: '12px' }}
            />

            {/* Step labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {CREDIT_STEPS.map((s, i) => (
                <span
                  key={s.label}
                  onClick={() => setSliderIdx(i)}
                  style={{
                    fontSize: '11px', fontFamily: 'Outfit',
                    color: i === sliderIdx ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                    fontWeight: i === sliderIdx ? '700' : '400',
                    cursor: 'pointer', transition: 'color 0.2s', userSelect: 'none',
                  }}
                >{s.label}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section style={{ ...sectionStyle, paddingTop: '0', paddingBottom: '120px' }}>
          {pillLabel('FAQs')}
          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: '700', color: '#fff',
            fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', marginBottom: '12px',
          }}>
            Frequently Asked Questions
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '15px',
            fontFamily: 'Outfit, sans-serif', marginBottom: '48px', maxWidth: '480px',
          }}>
            Everything you need to know about payments, credits, and plans.
          </p>

          <div style={{
            width: '100%', maxWidth: '760px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px', overflow: 'hidden',
          }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="faq-item" style={{ padding: '0 28px' }}>
                  <button className="faq-question" onClick={() => setOpenFaq(isOpen ? null : idx)}>
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`faq-chevron${isOpen ? ' faq-chevron--open' : ''}`} />
                  </button>
                  <div className="faq-answer" style={{ maxHeight: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0 }}>
                    <p style={{
                      fontSize: '14px', color: 'rgba(255,255,255,0.45)',
                      fontFamily: 'Outfit', lineHeight: '1.7',
                      paddingBottom: '20px', margin: 0,
                    }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* ══ MODAL ══ */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="panel"
            style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '18px', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle2 size={48} className="sn-green" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 22, color: '#fff', marginBottom: 8, fontFamily: 'Outfit' }}>Request Sent!</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Outfit' }}>Our team will reach out shortly.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <div className="panel-label" style={{ padding: 0, marginBottom: 4 }}>
                      <div className="label-dot" /> Get Started
                    </div>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'Outfit' }}>
                      {selectedPlan?.name} Plan — {selectedPlan?.credits?.toLocaleString()} Credits
                    </h3>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    ['name', 'Full Name', 'text', 'Your full name'],
                    ['org', 'Organization', 'text', 'Company name'],
                    ['email', 'Work Email', 'email', 'work@example.com'],
                  ].map(([key, label, type, ph]) => (
                    <div key={key} className="field">
                      <label className="field-label">{label}</label>
                      <input
                        type={type}
                        className="field-input"
                        placeholder={ph}
                        required
                        value={formData[key]}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    style={{
                      width: '100%', padding: '13px', marginTop: 8,
                      borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #a78bfa, #34d399)',
                      color: '#0a0a0a', fontFamily: 'Outfit', fontWeight: '700', fontSize: '14px',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
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
        <button
          style={{
            flex: 1, padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #a78bfa, #34d399)',
            color: '#0a0a0a', fontFamily: 'Outfit', fontWeight: '700', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
          onClick={() => document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' })}
        >
          <Phone size={15} /> View Plans
        </button>
      </div>
    </div>
  );
}