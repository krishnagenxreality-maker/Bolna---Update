import React, { useState } from 'react';
import {
  X, ArrowRight, ArrowLeft, Shield, CheckCircle2,
  Calendar, Phone, Mail, Building2, User, Sparkles
} from 'lucide-react';

const STEPS = [
  'Basic Details', 'Business Type', 'Use Case', 'Call Volume',
  'Languages', 'Current Process', 'Schedule Demo', 'Extra Notes'
];

const BUSINESS_TYPES = [
  'School / College', 'Coaching Center', 'Real Estate', 'Healthcare',
  'Financial Services', 'SaaS / Tech', 'E-commerce', 'Recruitment',
  'Marketing Agency', 'Other'
];

const USE_CASES = [
  'Lead Qualification', 'Admissions Outreach', 'Payment Reminders',
  'Customer Follow-ups', 'Appointment Booking', 'Sales Outreach',
  'Event Invitations', 'Feedback Collection', 'Support Calls', 'Other'
];

const CALL_VOLUMES = ['Under 1,000 calls', '1,000 – 5,000', '5,000 – 15,000', '15,000+'];
const LANGUAGES = ['English', 'Telugu', 'Hindi', 'Tamil', 'Other'];

const CURRENT_PROCESS = [
  'Manual calling team', 'Call center', 'Existing AI platform',
  'No current system', 'Other'
];

const TIMEZONES = [
  'IST (UTC+5:30)', 'UTC (UTC+0)', 'EST (UTC-5)', 'PST (UTC-8)', 'GST (UTC+4)'
];

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#fff',
  fontFamily: 'Outfit, sans-serif',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '500',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontFamily: 'Outfit, sans-serif'
};

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '999px',
        border: selected ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
        background: selected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
        color: selected ? '#fff' : 'rgba(255,255,255,0.4)',
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: 'Outfit, sans-serif',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {selected && <CheckCircle2 size={12} />}
      {label}
    </button>
  );
}

function SelectCard({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        border: selected ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
        background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
        color: selected ? '#fff' : 'rgba(255,255,255,0.45)',
        fontSize: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'Outfit, sans-serif',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%'
      }}
    >
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: selected ? '5px solid #fff' : '2px solid rgba(255,255,255,0.2)',
        flexShrink: 0,
        transition: 'all 0.15s'
      }} />
      {label}
    </button>
  );
}

import { API_BASE_URL } from '../../config';

export default function RequestDemoModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [otherDesc, setOtherDesc] = useState({ businessType: '', currentProcess: '' });
  const [form, setForm] = useState({
    fullName: '', company: '', email: '', phone: '', website: '',
    businessType: '', useCases: [], callVolume: '',
    languages: [], currentProcess: '',
    demoDate: '', demoTime: '', timezone: '',
    notes: ''
  });

  const progress = ((step + 1) / STEPS.length) * 100;
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleArr = (key, val) => setForm(f => {
    const arr = f[key];
    return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
  });

  const canNext = () => {
    if (step === 0) return form.fullName.trim() && form.company.trim() && form.email.trim() && form.phone.trim();
    if (step === 1) return !!form.businessType;
    if (step === 2) return form.useCases.length > 0;
    if (step === 3) return !!form.callVolume;
    if (step === 4) return form.languages.length > 0;
    if (step === 5) return !!form.currentProcess;
    if (step === 6) return !!(form.demoDate && form.demoTime);
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  style={inputStyle}
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Company / Organization *</label>
                <input
                  style={inputStyle}
                  placeholder="Your company"
                  value={form.company}
                  onChange={e => set('company', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Work Email *</label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input
                style={inputStyle}
                type="tel"
                placeholder="+91 00000 00000"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Website URL <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                style={inputStyle}
                placeholder="https://yourcompany.com"
                value={form.website}
                onChange={e => set('website', e.target.value)}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', fontFamily: 'Outfit' }}>
              This helps us personalise your demo experience.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {BUSINESS_TYPES.map(t => (
                <SelectCard key={t} label={t} selected={form.businessType === t} onClick={() => set('businessType', t)} />
              ))}
            </div>
            {form.businessType === 'Other' && (
              <div style={{ marginTop: '14px' }}>
                <label style={labelStyle}>Please describe *</label>
                <input
                  style={inputStyle}
                  placeholder="Describe your business type..."
                  value={otherDesc.businessType}
                  onChange={e => setOtherDesc(o => ({ ...o, businessType: e.target.value }))}
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', fontFamily: 'Outfit' }}>
              What do you want AI calling for?{' '}
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>(select all that apply)</span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {USE_CASES.map(u => (
                <Chip key={u} label={u} selected={form.useCases.includes(u)} onClick={() => toggleArr('useCases', u)} />
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', fontFamily: 'Outfit' }}>
              Estimated monthly call volume — important for accurate pricing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {CALL_VOLUMES.map(v => (
                <SelectCard key={v} label={v} selected={form.callVolume === v} onClick={() => set('callVolume', v)} />
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', fontFamily: 'Outfit' }}>
              Which languages do your agents need to speak?{' '}
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>(select all)</span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {LANGUAGES.map(l => (
                <Chip key={l} label={l} selected={form.languages.includes(l)} onClick={() => toggleArr('languages', l)} />
              ))}
            </div>
            {form.languages.includes('Other') && (
              <div style={{ marginTop: '14px' }}>
                <label style={labelStyle}>Specify language(s) *</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Kannada, Bengali..."
                  value={otherDesc.language || ''}
                  onChange={e => setOtherDesc(o => ({ ...o, language: e.target.value }))}
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px', fontFamily: 'Outfit' }}>
              How are you currently handling outreach calls?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {CURRENT_PROCESS.map(p => (
                <SelectCard key={p} label={p} selected={form.currentProcess === p} onClick={() => set('currentProcess', p)} />
              ))}
            </div>
            {form.currentProcess === 'Other' && (
              <div style={{ marginTop: '14px' }}>
                <label style={labelStyle}>Please describe *</label>
                <input
                  style={inputStyle}
                  placeholder="Describe your current process..."
                  value={otherDesc.currentProcess}
                  onChange={e => setOtherDesc(o => ({ ...o, currentProcess: e.target.value }))}
                />
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontFamily: 'Outfit' }}>
              Pick a time that works for you and our team will confirm within 24 hours.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Preferred Date *</label>
                <input
                  style={inputStyle}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.demoDate}
                  onChange={e => set('demoDate', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Preferred Time *</label>
                <input
                  style={inputStyle}
                  type="time"
                  value={form.demoTime}
                  onChange={e => set('demoTime', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Timezone <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <select
                  style={{
                    ...inputStyle,
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    paddingRight: '40px',
                    cursor: 'pointer'
                  }}
                  value={form.timezone}
                  onChange={e => set('timezone', e.target.value)}
                >
                  <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Select timezone...</option>
                  {TIMEZONES.map(t => (
                    <option key={t} value={t} style={{ background: '#1a1a1a', color: '#fff' }}>{t}</option>
                  ))}
                </select>
                <div style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  color: 'rgba(255,255,255,0.4)', fontSize: '10px'
                }}>▼</div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px', fontFamily: 'Outfit' }}>
              Tell us about your outreach goals{' '}
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
            </p>
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', lineHeight: '1.6' }}
              placeholder="e.g. We want to automate admission follow-ups in Telugu and English for 2,000 leads monthly..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontFamily: 'Outfit' }}>
                Your Summary
              </p>
              {[
                [User, (form.fullName || '—') + ' · ' + (form.company || '—')],
                [Mail, form.email || '—'],
                [Phone, form.phone || '—'],
                [Building2, form.businessType || '—'],
                [Calendar, form.demoDate ? form.demoDate + ' at ' + form.demoTime : '—']
              ].map(([Icon, val], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Icon size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Outfit' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CheckCircle2 size={32} style={{ color: '#4ade80' }} />
          </div>
          <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', marginBottom: '12px', fontFamily: 'Outfit' }}>
            Demo Requested!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: '1.7', fontFamily: 'Outfit', marginBottom: '32px' }}>
            Thanks, <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{form.fullName}</strong>. We have received your details
            and will confirm your demo on{' '}
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{form.demoDate}</strong> at{' '}
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{form.demoTime}</strong> within 24 hours.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '14px 40px', borderRadius: '10px',
              background: '#fff', color: '#000',
              border: 'none', fontFamily: 'Outfit, sans-serif',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '560px',
        background: 'rgba(18,18,18,0.98)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{ padding: '28px 32px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={18} style={{ color: '#fff' }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit', margin: 0 }}>
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', fontFamily: 'Outfit', margin: 0 }}>
                  {STEPS[step]}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', borderRadius: '8px',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Single progress bar only */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px' }}>
              <div style={{
                height: '100%', borderRadius: '99px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.95))',
                width: progress + '%',
                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }} />
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '4px 32px 20px', overflowY: 'auto', flex: 1 }}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0
        }}>
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Outfit, sans-serif', fontSize: '14px',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep(s => s + 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '10px',
                background: canNext() ? '#fff' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: canNext() ? '#000' : 'rgba(255,255,255,0.25)',
                fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '600',
                cursor: canNext() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  // Merge 'Other' fields into form
                  const finalForm = { ...form };
                  if (form.businessType === 'Other' && otherDesc.businessType) {
                    finalForm.businessType = `Other: ${otherDesc.businessType}`;
                  }
                  if (form.currentProcess === 'Other' && otherDesc.currentProcess) {
                    finalForm.currentProcess = `Other: ${otherDesc.currentProcess}`;
                  }
                  if (form.languages.includes('Other') && otherDesc.language) {
                    finalForm.languages = form.languages.map(l => l === 'Other' ? `Other: ${otherDesc.language}` : l);
                  }

                  const response = await fetch(`${API_BASE_URL}/api/demo-requests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalForm)
                  });
                  if (response.ok) {
                    setSubmitted(true);
                  } else {
                    const errData = await response.json();
                    alert(`Failed to submit demo request: ${errData.message || 'Please try again.'}`);
                  }
                } catch (err) {
                  alert('Error submitting request. Please check your connection.');
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 32px', borderRadius: '10px',
                background: '#fff', border: 'none', color: '#000',
                fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 0 32px rgba(255,255,255,0.12)'
              }}
            >
              <Sparkles size={16} /> Request Demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}