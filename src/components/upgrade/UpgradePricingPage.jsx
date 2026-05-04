import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SmokeBackground } from '../layout/SmokeBackground';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import '../../styles/BolnaDashboard.css';

const PLANS = [
  {
    name: 'Starter',
    price: '₹10,000',
    period: '/ month',
    features: [
      '1000 credits / month',
      '1 call per credit (1K calls)',
      'Detailed segregation',
      'Lead generation',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₹20,000',
    period: '/ month',
    features: [
      '3000 credits / month',
      '1 call per credit (2K calls)',
      'Detailed segregation',
      'Lead generation',
    ],
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Contact Admin',
      'Custom concurrent calls',
      'Dedicated support',
      'Custom integration',
    ],
    highlighted: false,
  },
];

export default function UpgradePricingPage() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <SmokeBackground />

      {/* Header */}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="hdr-left">
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'color 0.2s',
              padding: 0,
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
        <div className="hdr-badge">Upgrade Your Plan</div>
      </header>

      <main
        className="main"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px 40px',
          minHeight: 'calc(100vh - 80px)',
          maxWidth: '1200px',
        }}
      >
        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1
            style={{
              fontSize: '44px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '14px',
              letterSpacing: '-0.02em',
            }}
          >
            Choose your <span className="hdr-accent">plan</span>
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'Outfit',
            }}
          >
            Scale your outreach with the right number of credits.
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '28px',
            width: '100%',
            maxWidth: '1000px',
            alignItems: 'stretch',
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                position: 'relative',
                transform: plan.highlighted ? 'scale(1.05)' : 'none',
                zIndex: plan.highlighted ? 1 : 0,
              }}
            >
              {/* Most Popular Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    color: '#000',
                    padding: '4px 16px',
                    borderRadius: '100px',
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    zIndex: 2,
                    boxShadow: '0 4px 12px rgba(255,255,255,0.15)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div
                className="panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '36px 28px',
                  height: '100%',
                  ...(plan.highlighted
                    ? {
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.04)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                      }
                    : {}),
                }}
              >
                {/* Plan Name */}
                <h3
                  style={{
                    fontSize: '22px',
                    color: '#fff',
                    marginBottom: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {plan.name}
                </h3>

                {/* Price */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '28px',
                  }}
                >
                  <span style={{ fontSize: '38px', fontWeight: '700', color: '#fff' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Features */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    marginBottom: '36px',
                    flex: 1,
                  }}
                >
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <CheckCircle2
                        size={17}
                        style={{ color: '#7dffb3', flexShrink: 0 }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Select Button — no action */}
                <button
                  className="btn-call"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '14px',
                    marginTop: 'auto',
                    ...(plan.highlighted
                      ? { background: 'rgba(255,255,255,0.1)' }
                      : {}),
                  }}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
