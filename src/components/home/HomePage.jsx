import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Shield, LogIn, ArrowRight, CheckCircle2,
  Users, BarChart3, Zap, X, PhoneCall, TrendingUp,
  Upload, Settings2, Rocket, LineChart, ChevronDown,
  Building2, GraduationCap, Home, Briefcase,
  Megaphone, MessageSquare, RefreshCw, PhoneMissed,
  Flame, PieChart, Languages, GitBranch, Play, Pause,
  ShoppingCart, HeartPulse, Hotel, Landmark, MapPin
} from 'lucide-react';
import RequestDemoModal from '../common/RequestDemoModal';
import '../../styles/BolnaDashboard.css';

/* ─────────────────────────────────────────
   GLOBAL KEYFRAMES + ANIMATION CSS
───────────────────────────────────────── */
const SCROLL_STYLES = `
  @keyframes fadeSlideUp    { from { opacity:0; transform:translateY(32px);  } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeSlideLeft  { from { opacity:0; transform:translateX(-28px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeSlideRight { from { opacity:0; transform:translateX(28px);  } to { opacity:1; transform:translateX(0); } }
  @keyframes scaleIn        { from { opacity:0; transform:scale(0.93);       } to { opacity:1; transform:scale(1);     } }
  @keyframes glowPulse      { 0%,100%{ box-shadow:0 0 0 0 rgba(255,255,255,0.04); } 50%{ box-shadow:0 0 32px 0 rgba(255,255,255,0.07); } }
  @keyframes shimmerLine    { from { transform:translateX(-100%); } to { transform:translateX(100%); } }
  @keyframes floatY         { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-8px); } }
  @keyframes scrollBounce   { 0%,100%{ transform:translateY(0); opacity:0.6; } 50%{ transform:translateY(6px); opacity:1; } }
  @keyframes gradientShift  { 0%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } 100%{ background-position:0% 50%; } }
  @keyframes tabSlideIn     { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes cardPop        { 0%{ transform:scale(0.96); opacity:0; } 60%{ transform:scale(1.01); } 100%{ transform:scale(1); opacity:1; } }
  @keyframes borderGlow     { 0%,100%{ border-color: rgba(255,255,255,0.07); } 50%{ border-color: rgba(255,255,255,0.16); } }
  @keyframes wv0 { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
  @keyframes wv1 { from { transform: scaleY(0.55); } to { transform: scaleY(1); } }
  @keyframes wv2 { from { transform: scaleY(0.25); } to { transform: scaleY(1); } }
  @keyframes wv3 { from { transform: scaleY(0.45); } to { transform: scaleY(1); } }
  .scroll-reveal { animation: fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) both; }
  .scroll-reveal-left  { animation: fadeSlideLeft  0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .scroll-reveal-right { animation: fadeSlideRight 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .scroll-scale { animation: scaleIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
  .sector-tab-active { position: relative; }
  .sector-tab-active::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 50%; transform: translateX(-50%);
    width: 20px; height: 2px;
    border-radius: 2px;
    background: currentColor;
    opacity: 0.7;
  }
`;


/* ─────────────────────────────────────────
   HOOKS
───────────────────────────────────────── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.12, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return offset;
}

function useMouseSpotlight() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onMove = (e) => {
      setPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
      setActive(true);
    };
    const onLeave = () => setActive(false);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseleave', onLeave); };
  }, []);
  return { pos, active };
}

/* ─────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────── */
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
        <span style={{ color: open ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: '15px', fontFamily: 'Outfit', fontWeight: '500', transition: 'color 0.2s' }}>{q}</span>
        <div style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: '16px', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={18} />
        </div>
      </div>
      {open && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: '1.7', fontFamily: 'Outfit', paddingBottom: '20px', margin: 0 }}>{a}</p>
      )}
    </div>
  );
}

function WaveformBars({ playing, color }) {
  const bars = [3, 6, 9, 5, 11, 7, 4, 10, 6, 8, 3, 7, 9, 4, 6];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '24px' }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: playing ? `${h * 2}px` : '4px',
            background: color || 'rgba(255,255,255,0.4)',
            borderRadius: '99px',
            transition: `height ${0.15 + i * 0.03}s ease`,
            animation: playing ? `wv${i % 4} 0.75s ease-in-out ${i * 0.055}s infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function SectionLabel({ text }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '5px 14px', borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
        fontSize: '11px', color: 'rgba(255,255,255,0.45)',
        fontFamily: 'Outfit', letterSpacing: '0.1em',
        textTransform: 'uppercase', marginBottom: '20px',
        transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {inView && (
        <span style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
          animation: 'shimmerLine 1.2s ease-out 0.3s 1 forwards',
          pointerEvents: 'none'
        }} />
      )}
      {text}
    </div>
  );
}

/* ─────────────────────────────────────────
   AGENT CARD (legacy, used in old grid)
───────────────────────────────────────── */
function AgentCard({ icon: Icon, title, tag, desc, color, delay = 0 }) {
  const [ref, inView] = useInView();
  const [playing, setPlaying] = useState(false);
  return (
    <div
      ref={ref}
      style={{
        padding: '26px 26px 22px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        cursor: 'default',
        display: 'flex', flexDirection: 'column', gap: '14px'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.045)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} style={{ color }} />
        </div>
        <div>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', fontFamily: 'Outfit', margin: '0 0 5px' }}>{title}</h3>
          <span style={{ padding: '2px 10px', borderRadius: '999px', background: `${color}12`, border: `1px solid ${color}22`, fontSize: '11px', color, fontFamily: 'Outfit', letterSpacing: '0.03em' }}>{tag}</span>
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.65', fontFamily: 'Outfit', margin: 0 }}>{desc}</p>
      <div onClick={() => setPlaying(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', background: playing ? `${color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${playing ? color + '28' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: playing ? color : 'rgba(255,255,255,0.07)', border: `1px solid ${playing ? color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease', boxShadow: playing ? `0 0 14px ${color}45` : 'none' }}>
          {playing ? <Pause size={13} style={{ color: '#000' }} /> : <Play size={13} style={{ color: 'rgba(255,255,255,0.65)', marginLeft: '2px' }} />}
        </div>
        <div style={{ flex: 1 }}><WaveformBars playing={playing} color={playing ? color : 'rgba(255,255,255,0.18)'} /></div>
        <span style={{ fontSize: '11px', fontFamily: 'Outfit', fontWeight: '500', letterSpacing: '0.04em', flexShrink: 0, color: playing ? color : 'rgba(255,255,255,0.22)' }}>{playing ? 'Playing...' : 'Preview'}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTOR AGENT CARD  (Bolna-style)
───────────────────────────────────────── */
function SectorAgentCard({ title, tags, desc, color, delay = 0 }) {
  const [ref, inView] = useInView();
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
        border: hovered ? `1px solid ${color}44` : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '18px',
        overflow: 'hidden',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(26px) scale(0.97)',
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     border-color 0.25s ease,
                     background 0.25s ease`,
        boxShadow: hovered ? `0 8px 32px ${color}12` : 'none',
      }}
    >
      {/* Card top: info + buttons */}
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
          {/* Left: tags + title + desc */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {tags.map(t => (
                <span key={t} style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.45)', fontFamily: 'Outfit', letterSpacing: '0.03em'
                }}>{t}</span>
              ))}
            </div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', fontFamily: 'Outfit', marginBottom: '8px', lineHeight: '1.3' }}>{title}</h4>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.55', fontFamily: 'Outfit', margin: 0 }}>{desc}</p>
          </div>
          {/* Right: play + arrow buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setPlaying(p => !p)}
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: playing ? color : `${color}18`,
                border: `1px solid ${color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.25s ease',
                boxShadow: playing ? `0 0 20px ${color}55` : 'none',
              }}
            >
              {playing ? <Pause size={15} color={playing ? '#000' : color} /> : <Play size={15} color={color} style={{ marginLeft: '2px' }} />}
            </button>

          </div>
        </div>

        {/* Waveform row — visible when playing */}
        <div style={{
          marginTop: '14px',
          height: playing ? '36px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.35s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <WaveformBars playing={playing} color={color} />
          <span style={{ fontSize: '11px', color, fontFamily: 'Outfit', opacity: 0.8, whiteSpace: 'nowrap' }}>Live preview...</span>
        </div>
      </div>


    </div>
  );
}

/* ─────────────────────────────────────────
   WORKFLOW / STEP / INDUSTRY CARDS
───────────────────────────────────────── */
function WorkflowCard({ icon: Icon, title, color, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{ padding: '20px 22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', transition: `all 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : 'translateX(-16px)', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} style={{ color }} />
      </div>
      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontFamily: 'Outfit', fontWeight: '500' }}>{title}</span>
    </div>
  );
}

function StepCard({ num, icon: Icon, title, desc, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(28px)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <Icon size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', fontWeight: '700' }}>{num}</span>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', fontFamily: 'Outfit', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step</div>
      </div>
      <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', marginBottom: '8px', fontFamily: 'Outfit' }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.6', fontFamily: 'Outfit', margin: 0 }}>{desc}</p>
    </div>
  );
}

function IndustryCard({ icon: Icon, title, items, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{ padding: '28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <Icon size={22} style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }} />
      <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '14px', fontFamily: 'Outfit' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontFamily: 'Outfit' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SECTOR DATA — 5 sectors × 4 agents each
══════════════════════════════════════════════ */
const SECTOR_TABS = [
  { id: 'EdTech',      label: 'EdTech',       icon: GraduationCap, color: '#a78bfa' },
  { id: 'Ecommerce',   label: 'Ecommerce',    icon: ShoppingCart,  color: '#34d399' },
  { id: 'Hospitality', label: 'Hospitality',  icon: Hotel,         color: '#f87171' },
  { id: 'RealEstate',  label: 'Real Estate',  icon: MapPin,        color: '#fb923c' },
];

const SECTOR_AGENTS = {
  EdTech: [
    { title: 'Admissions Agent',         tags: ['Admissions', 'English + Hindi'],    desc: 'Calls prospective students, answers queries, and drives enrolment conversions at scale without a single manual call.', color: '#a78bfa' },
    { title: 'Fee Reminder Agent',        tags: ['Fee Collection', 'Telugu + Hindi'], desc: 'Automates fee due reminders and payment follow-ups with polite, human-like voice — reduces defaults dramatically.', color: '#a78bfa' },
    { title: 'Exam Announcement Agent',   tags: ['Announcements', 'English'],         desc: 'Broadcasts exam schedules, result dates, and urgent notices to thousands of students in seconds.', color: '#a78bfa' },
    { title: 'Student Re-engagement Agent', tags: ['Retention', 'English + Hindi'],   desc: 'Re-engages inactive students with personalised AI outreach to improve course completion and reduce dropout rates.', color: '#a78bfa' },
  ],
  Ecommerce: [
    { title: 'Order Confirmation Agent',  tags: ['Orders', 'English + Hindi'],        desc: 'Instantly confirms orders, provides ETAs, and handles delivery queries via natural AI voice — zero hold time.', color: '#34d399' },
    { title: 'Cart Recovery Agent',       tags: ['Retention', 'English'],             desc: 'Calls customers who abandoned their cart with personalised AI nudges to recover lost revenue automatically.', color: '#34d399' },
    { title: 'Return & Refund Agent',     tags: ['Support', 'English + Hindi'],       desc: 'Handles return requests, refund status updates, and replacement queries 24/7 without any human involvement.', color: '#34d399' },
    { title: 'Loyalty & Offers Agent',    tags: ['Marketing', 'English'],             desc: 'Proactively calls your top customers with personalised offers and loyalty programme updates to drive repeat orders.', color: '#34d399' },
  ],
  RealEstate: [
    { title: 'Property Lead Qualifier',    tags: ['Lead Ops', 'English + Hindi'],   desc: 'Instantly calls every inbound property enquiry, qualifies buyer intent, budget, and timeline — then routes hot leads to your sales team.', color: '#fb923c' },
    { title: 'Site Visit Booking Agent',   tags: ['Scheduling', 'English + Hindi'], desc: 'Automates site visit scheduling by calling interested buyers, confirming availability, and sending reminders to reduce no-shows.', color: '#fb923c' },
    { title: 'Follow-Up & Nurture Agent',  tags: ['Retention', 'Hindi'],             desc: 'Re-engages cold leads with personalised follow-ups on new listings, price drops, and offers to move them down the funnel.', color: '#fb923c' },
    { title: 'Post-Visit Feedback Agent',  tags: ['Feedback', 'English'],            desc: 'Calls buyers after site visits to collect feedback, gauge purchase intent, and flag high-interest leads for immediate follow-up.', color: '#fb923c' },
  ],
  Hospitality: [
    { title: 'Booking Confirmation Agent', tags: ['Reservations', 'English'],        desc: 'Confirms hotel or restaurant bookings, answers guest queries, and upsells upgrades through natural AI voice..', color: '#f87171' },
    { title: 'Check-in Reminder Agent',    tags: ['Reminders', 'English + Hindi'],   desc: 'Calls guests before arrival with check-in details, directions, and special request confirmations automatically.', color: '#f87171' },
    { title: 'Feedback Collection Agent',  tags: ['Reviews', 'English'],            desc: 'Collects post-stay feedback via a natural voice survey, helping you improve service quality and online ratings.', color: '#f87171' },
    { title: 'Re-booking Campaign Agent',  tags: ['Retention', 'English + Hindi'],   desc: 'Reaches out to past guests with personalised seasonal offers to drive repeat bookings and boost lifetime value.', color: '#f87171' },
  ],
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showJoinModal = searchParams.get('join') === 'true';
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  /* scroll + parallax + spotlight */
  const heroParallax = useParallax(0.18);
  const { pos: spotPos, active: spotActive } = useMouseSpotlight();

  /* sector tab state */
  const [activeSector, setActiveSector] = useState('EdTech');
  const [agentAnimKey, setAgentAnimKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleOpenJoin = () => setSearchParams({ join: 'true' });
  const handleCloseJoin = () => setSearchParams({});

  const handleSectorChange = (id) => {
    if (id === activeSector) return;
    setActiveSector(id);
    setAgentAnimKey(k => k + 1);
  };

  /* ── data ── */
  const features = [
    { icon: <PhoneCall size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />, title: 'AI Voice Outreach', desc: 'Launch AI-powered calling campaigns with multilingual voice agents that sound natural and handle real conversations.' },
    { icon: <TrendingUp size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />, title: 'Live Campaign Analytics', desc: 'Track campaigns, conversations, and lead outcomes in real time with detailed sentiment and conversion data.' },
    { icon: <Users size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />, title: 'AI Lead Qualification', desc: 'Automatically identify interested leads and follow-up opportunities — no manual effort required.' },
  ];

  const workflows = [
    { icon: Zap,           title: 'AI Lead Qualification',  color: '#a78bfa' },
    { icon: MessageSquare, title: 'WhatsApp Follow-Up',     color: '#34d399' },
    { icon: RefreshCw,     title: 'Retry Automation',       color: '#60a5fa' },
    { icon: PhoneMissed,   title: 'Missed Call Handling',   color: '#fbbf24' },
    { icon: Flame,         title: 'Hot Lead Escalation',    color: '#f87171' },
    { icon: PieChart,      title: 'Campaign Analytics',     color: '#818cf8' },
    { icon: Languages,     title: 'Multi-Language AI',      color: '#2dd4bf' },
    { icon: GitBranch,     title: 'Smart Follow-Up Flows',  color: '#fb923c' },
  ];

  const steps = [
    { icon: Upload,    title: 'Upload Contacts',       desc: 'Import your leads via CSV or Excel. Clean, simple, instant.' },
    { icon: Settings2, title: 'Configure AI Agent',    desc: 'Choose language, voice, and outreach workflow for your campaign.' },
    { icon: Rocket,    title: 'Launch Campaign',       desc: 'AI starts outreach automatically — thousands of calls in minutes.' },
    { icon: LineChart, title: 'Track & Convert Leads', desc: 'Monitor responses, sentiment, and outcomes live in your dashboard.' },
  ];

  const industries = [
    { icon: GraduationCap, title: 'Education',          items: ['Admissions outreach', 'Fee reminders', 'Exam announcements', 'Student engagement'] },
    { icon: Home,          title: 'Real Estate',        items: ['Property lead qualification', 'Site visit booking', 'Follow-up automation', 'Buyer nurturing'] },
    { icon: Zap,           title: 'Lead Operations',    items: ['Instant lead response', 'Intent scoring', 'CRM sync', 'Hot lead routing'] },
    { icon: Megaphone,     title: 'Customer Outreach',  items: ['Renewal reminders', 'Feedback collection', 'Reactivation campaigns', 'Announcement calls'] },
    { icon: Briefcase,     title: 'Financial Services', items: ['EMI reminders', 'Loan follow-ups', 'Compliance updates', 'Customer onboarding'] },
  ];

  const faqs = [
    { q: 'What languages does CallingGen support?',          a: 'CallingGen currently supports Telugu, Hindi, English, and Tamil. Our AI voice agents are designed specifically for Indian accents and conversational styles. More languages are being added continuously.' },
    { q: 'How does billing work?',                          a: 'We offer credit-based plans starting at ₹4,999/month for 2,000 calls. Each credit covers one AI call. Enterprise plans with custom concurrent calling limits are available — contact admin for details.' },
    { q: 'What does the onboarding process look like?',     a: 'Onboarding takes under 48 hours. After your demo, we configure your AI agent, set up your calling workflow, and run a test campaign before going live. Our team supports you end-to-end.' },
    { q: 'Is my contact data secure?',                     a: 'Absolutely. All data is processed and stored securely with strict access controls. We do not share or sell your contact lists. Data residency and compliance options are available for enterprise customers.' },
    { q: 'How is CallingGen different from bulk SMS or email?', a: 'Unlike SMS or email, AI voice calls create real two-way conversations. Our agents respond dynamically to what the lead says, qualify intent in real time, and escalate hot leads — all without human involvement.' },
  ];

  const sectionStyle = { width: '100%', maxWidth: '1160px', margin: '0 auto', padding: '100px 24px' };
  const dividerStyle = { width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', position: 'relative', overflow: 'hidden' };
  const sectionHeadStyle = { fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: '700', color: '#fff', marginBottom: '16px', fontFamily: 'Outfit', letterSpacing: '-0.02em' };
  const sectionSubStyle  = { color: 'rgba(255,255,255,0.35)', fontSize: '16px', fontFamily: 'Outfit', maxWidth: '520px', margin: '0 auto', lineHeight: '1.7' };

  const activeSectorData = SECTOR_TABS.find(s => s.id === activeSector);

  return (
    <div className="app" style={{ overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: SCROLL_STYLES }} />

      {showDemoModal && <RequestDemoModal onClose={() => setShowDemoModal(false)} />}

      {/* ── Mouse spotlight ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: spotActive ? 1 : 0, transition: 'opacity 0.6s ease', background: `radial-gradient(600px circle at ${spotPos.x}% ${spotPos.y}%, rgba(255,255,255,0.025), transparent 60%)` }} />

      {/* ══════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════ */}
      <header className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="hdr-left">
          <div className="logo-mark"><Shield size={20} /></div>
          <span className="hdr-title">Calling <span className="hdr-accent">Gen</span></span>
          <div className="hdr-badge" style={{ marginLeft: '12px' }}>by GenxReality</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button
              onClick={() => navigate('/pricing')}
              className="nav-link"
              style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(52,211,153,0.15))',
                border: '1px solid rgba(167,139,250,0.45)',
                color: '#c4b5fd',
                cursor: 'pointer',
                fontFamily: 'Outfit',
                fontWeight: '600',
                fontSize: '14px',
                padding: '7px 18px',
                borderRadius: '8px',
                letterSpacing: '0.02em',
                boxShadow: '0 0 16px rgba(167,139,250,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                animation: 'glowPulse 3s ease-in-out infinite',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.28), rgba(52,211,153,0.22))';
                e.currentTarget.style.boxShadow = '0 0 28px rgba(167,139,250,0.45), inset 0 1px 0 rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.7)';
                e.currentTarget.style.color = '#ddd6fe';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(52,211,153,0.15))';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(167,139,250,0.25), inset 0 1px 0 rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)';
                e.currentTarget.style.color = '#c4b5fd';
              }}
            >
              ✦ Pricing
            </button>
          <Link 
            to="/login" 
            state={{ from: '/' }} 
            className="logout-btn" 
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              color: '#fff', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: '8px 20px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer', 
              fontFamily: 'Outfit, sans-serif', 
              fontSize: '14px', 
              fontWeight: '500', 
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
          >
            <LogIn size={16} /> Login
          </Link>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ══════════════════════════════════════
            HERO
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle, paddingTop: '120px', paddingBottom: '80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.1s linear', opacity: heroVisible ? 1 : 0, transform: `translateY(${heroVisible ? heroParallax : 24}px)` }}>
            <div className="spill s-pending" style={{ marginBottom: '24px', padding: '6px 16px', display: 'inline-block', animation: 'floatY 4s ease-in-out infinite' }}>
              AI Outreach Infrastructure
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '700', color: '#fff', marginBottom: '24px', letterSpacing: '-0.03em', lineHeight: '1.08', fontFamily: 'Outfit, sans-serif' }}>
              Automate Calls,<br />
              Qualify Leads,{' '}
              <span className="hdr-accent">Scale Outreach</span>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.4)', marginBottom: '44px', lineHeight: '1.7', fontFamily: 'Outfit', maxWidth: '660px', margin: '0 auto 44px' }}>
              CallingGen helps schools, real estate teams, and businesses automate outreach, qualify leads, and manage intelligent AI conversations in Telugu, Hindi, and English.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleOpenJoin} className="btn-call" style={{ padding: '15px 36px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Join Now <ArrowRight size={18} />
              </button>
              <button onClick={() => setShowDemoModal(true)} className="nav-btn" style={{ padding: '15px 36px', fontSize: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Request Demo
              </button>
            </div>
          </div>
          {/* Scroll bounce */}
          <div style={{ marginTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: heroVisible ? 0.5 : 0, transition: 'opacity 1s ease 1.2s', animation: 'scrollBounce 2s ease-in-out infinite' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
            <div style={{ width: '1px', height: '32px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
          </div>
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            FEATURES
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle, textAlign: 'center' }}>
          <SectionLabel text="What CallingGen Does" />
          <h2 style={sectionHeadStyle}>Built for Intelligent Communication</h2>
          <p style={{ ...sectionSubStyle, marginBottom: '56px' }}>
            Not bulk calling — an AI outreach operating system that drives real conversations and qualified outcomes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {features.map((f, i) => {
              const [ref, inView] = useInView();
              return (
                <div key={i} ref={ref} style={{ padding: '32px 28px', textAlign: 'left', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ marginBottom: '20px', width: '44px', height: '44px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</div>
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '10px', fontFamily: 'Outfit' }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', lineHeight: '1.6', fontFamily: 'Outfit', margin: 0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            AI VOICE AGENTS — SECTOR TABS
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <SectionLabel text="AI Voice Agents" />
            <h2 style={sectionHeadStyle}>Agents Built for Every Industry</h2>
            <p style={sectionSubStyle}>
              Pre-configured AI voice agents for every sector — multilingual, intelligent, and always on. Select your industry to explore live demos.
            </p>
          </div>

          {/* ── Sector Tab Bar ── */}
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: '0', marginBottom: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '5px', maxWidth: '700px', margin: '0 auto 40px', flexWrap: 'wrap' }}>
            {SECTOR_TABS.map(({ id, label, icon: Icon, color }) => {
              const isActive = id === activeSector;
              return (
                <button
                  key={id}
                  onClick={() => handleSectorChange(id)}
                  style={{
                    flex: '1 1 0',
                    minWidth: '100px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontFamily: 'Outfit',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    background: isActive ? `${color}18` : 'transparent',
                    border: isActive ? `1px solid ${color}44` : '1px solid transparent',
                    color: isActive ? color : 'rgba(255,255,255,0.38)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    boxShadow: isActive ? `0 0 16px ${color}18` : 'none',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Active sector description line ── */}
          <div style={{
            textAlign: 'center',
            marginBottom: '28px',
            opacity: 0.7,
            animation: 'fadeSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
            key: activeSector
          }}>
            <span style={{
              fontSize: '12px', fontFamily: 'Outfit', letterSpacing: '0.06em',
              textTransform: 'uppercase', color: activeSectorData?.color,
              padding: '4px 14px', borderRadius: '999px',
              background: `${activeSectorData?.color}14`,
              border: `1px solid ${activeSectorData?.color}33`,
            }}>
              {activeSector} — {SECTOR_AGENTS[activeSector].length} Agents Available
            </span>
          </div>

          {/* ── Agent Cards Grid — re-animates on tab switch ── */}
          <div
            key={agentAnimKey}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              animation: 'tabSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) both'
            }}
          >
            {SECTOR_AGENTS[activeSector].map((agent, i) => (
              <SectorAgentCard
                key={agent.title + activeSector}
                {...agent}
                delay={i * 70}
              />
            ))}
          </div>
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            AUTOMATION WORKFLOWS
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <SectionLabel text="Automation Workflows" />
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: '700', color: '#fff', marginBottom: '16px', fontFamily: 'Outfit', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Beyond Calling —<br />A Full Outreach Engine
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '15px', fontFamily: 'Outfit', lineHeight: '1.7' }}>
                CallingGen is not a dialer. It is an intelligent outreach system that handles every step of the lead engagement lifecycle — automatically.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {workflows.map((w, i) => <WorkflowCard key={w.title} {...w} delay={i * 60} />)}
            </div>
          </div>
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle, textAlign: 'center' }}>
          <SectionLabel text="How It Works" />
          <h2 style={sectionHeadStyle}>From Upload to Conversion in 4 Steps</h2>
          <p style={{ ...sectionSubStyle, marginBottom: '60px' }}>Simple setup, instant deployment. Go live in hours, not weeks.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', left: '12%', right: '12%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(255,255,255,0.08), rgba(255,255,255,0.08), transparent)', zIndex: 0 }} />
            {steps.map((s, i) => <StepCard key={i} num={i + 1} {...s} delay={i * 100} />)}
          </div>
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            INDUSTRIES
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle, textAlign: 'center' }}>
          <SectionLabel text="Industries" />
          <h2 style={sectionHeadStyle}>Built for Indian Businesses</h2>
          <p style={{ ...sectionSubStyle, marginBottom: '56px' }}>Purpose-built workflows for the industries that rely on high-volume, high-quality outreach.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            {industries.slice(0, 3).map((ind, i) => <IndustryCard key={ind.title} {...ind} delay={i * 80} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginTop: '18px', maxWidth: '780px', margin: '18px auto 0' }}>
            {industries.slice(3).map((ind, i) => <IndustryCard key={ind.title} {...ind} delay={i * 80 + 240} />)}
          </div>
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            CASE STUDIES
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <SectionLabel text="Case Studies" />
            <h2 style={sectionHeadStyle}>Proven Results at Scale</h2>
            <p style={sectionSubStyle}>Real organisations using CallingGen to communicate faster and reach further.</p>
          </div>
          {[
            { org: 'YUVA Junior & Defence College', quote: 'YUVA streamlined large-scale student outreach using AI Voice Agents — reaching thousands of students instantly with automated announcements, reminders, and important updates.', tag: 'Education', stats: [{ num: 21000, suffix: '+', label: 'Calls Completed' }, { num: 1, suffix: '', label: 'Single Campaign Reach' }], points: ['Reached all students in one go', 'High delivery efficiency — no manual calling', 'Instant admissions, exam updates & announcements'], result: 'Mass communication without manual calling' },
            { org: 'Morning Tax', quote: 'Morning Tax automated client communication for new tax regulation updates using AI Voice Calls — ensuring businesses and customers received timely compliance information at scale.', tag: 'Financial Services', stats: [{ num: 10000, suffix: '+', label: 'Calls Completed' }, { num: 24, suffix: '/7', label: 'Automated Communication' }], points: ['Instant outreach for tax regulation updates', 'No manual follow-ups required', 'Fast rollout across large contact lists'], result: 'Business communication at scale' }
          ].map((cs, ci) => {
            const [ref, inView] = useInView();
            return (
              <div key={ci} ref={ref} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', padding: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '20px', alignItems: 'center', transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(28px)' }}>
                <div>
                  <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', marginBottom: '16px', letterSpacing: '0.04em' }}>{cs.tag}</div>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', marginBottom: '14px', fontFamily: 'Outfit' }}>{cs.org}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: '1.7', fontFamily: 'Outfit', marginBottom: '20px' }}>"{cs.quote}"</p>
                  {cs.points.map((p, pi) => (
                    <div key={pi} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <CheckCircle2 size={14} style={{ color: 'rgba(255,255,255,0.3)', marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontFamily: 'Outfit' }}>{p}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {cs.stats.map((s, si) => (
                    <div key={si} style={{ padding: '28px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', animation: 'scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${si * 120}ms` }}>
                      <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff', fontFamily: 'Outfit', letterSpacing: '-0.02em' }}><Counter end={s.num} suffix={s.suffix} /></div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontFamily: 'Outfit', marginTop: '6px' }}>{s.label}</div>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Result</div>
                    <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit', fontWeight: '500', marginTop: '6px' }}>{cs.result}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            FAQ
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle, maxWidth: '760px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <SectionLabel text="FAQ" />
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '700', color: '#fff', fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
          </div>
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </section>

        <div style={dividerStyle} />

        {/* ══════════════════════════════════════
            CTA
        ══════════════════════════════════════ */}
        <section style={{ ...sectionStyle, textAlign: 'center', paddingTop: '80px', paddingBottom: '120px' }}>
          {(() => {
            const [ref, inView] = useInView();
            return (
              <div ref={ref} style={{ transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)' }}>
                <div style={{ padding: '64px 48px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', maxWidth: '680px', margin: '0 auto', animation: 'glowPulse 4s ease-in-out infinite', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%', animation: 'gradientShift 3s ease infinite' }} />
                  <div className="spill s-pending" style={{ marginBottom: '24px', padding: '5px 14px', display: 'inline-block', fontSize: '11px' }}>Get Started</div>
                  <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: '700', color: '#fff', marginBottom: '16px', fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Ready to Automate<br />Your Outreach?
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px', fontFamily: 'Outfit', lineHeight: '1.7', marginBottom: '36px', maxWidth: '420px', margin: '0 auto 36px' }}>
                    Join teams using CallingGen to run intelligent AI voice campaigns at scale — in Telugu, Hindi, and English.
                  </p>
                  <button onClick={() => setShowDemoModal(true)} className="btn-call" style={{ padding: '16px 40px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    Request Demo <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })()}
        </section>

      </main>

      {/* ── JOIN MODAL ── */}
      {showJoinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center', position: 'relative' }}>
            <button onClick={handleCloseJoin} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <div className="logo-mark" style={{ width: '56px', height: '56px', margin: '0 auto 24px', borderRadius: '12px' }}>
              <Shield size={28} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px' }}>Get Started with Calling Gen</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px' }}>Choose how you'd like to proceed with our service.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={() => {
                  handleCloseJoin();
                  navigate('/login', { state: { from: '/?join=true' } });
                }} 
                className="btn-call" 
                style={{ width: '100%', padding: '16px', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
              >
                Already have an account
              </button>
              <button onClick={() => navigate('/pricing')} className="nav-btn" style={{ width: '100%', padding: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
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