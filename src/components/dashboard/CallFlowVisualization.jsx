import React, { useState, useEffect } from 'react';
import { Phone, Users, CheckCircle, Clock, Zap, Target, XCircle, HelpCircle, Timer } from 'lucide-react';

export const CallFlowVisualization = ({ contacts, agentId, isCalling, callStartTime }) => {
  const selectedAgentId = agentId?.split('::')[1];
  const activeContacts = selectedAgentId 
    ? contacts.filter(c => c.agentId === selectedAgentId || c.id?.includes(selectedAgentId))
    : contacts;

  const stats = {
    uploaded: activeContacts.length,
    inProgress: activeContacts.filter(c => c.status === 'processing' || c.status === 'calling').length,
    completed: activeContacts.filter(c => c.status === 'called' || c.status === 'completed').length,
    interested: activeContacts.filter(c => (c.leadCategory?.toLowerCase() === 'interested') || (c.classification?.toLowerCase() === 'interested')).length,
    notInterested: activeContacts.filter(c => (c.leadCategory?.toLowerCase() === 'not_interested') || (c.classification?.toLowerCase() === 'not_interested')).length,
    reschedule: activeContacts.filter(c => (c.leadCategory?.toLowerCase() === 'reschedule') || (c.classification?.toLowerCase() === 'reschedule')).length,
    noAnswer: activeContacts.filter(c => c.response?.toLowerCase().includes('no answer') || c.response?.toLowerCase().includes('busy')).length
  };

  // ETA calculation
  const [etaText, setEtaText] = useState('');
  
  useEffect(() => {
    if (!isCalling || !callStartTime) {
      setEtaText('');
      return;
    }

    const BATCH_SIZE = 10;
    const BATCH_DELAY_S = 10 * 60; // 10 minutes in seconds
    const CALL_TIME_S = 30; // ~30s per call

    const computeEta = () => {
      const remaining = stats.uploaded - stats.completed - stats.inProgress;
      if (remaining <= 0) {
        setEtaText('Completing...');
        return;
      }
      
      const batchesRemaining = Math.ceil(remaining / BATCH_SIZE);
      const callTimeRemaining = remaining * CALL_TIME_S;
      const batchDelays = Math.max(0, batchesRemaining - 1) * BATCH_DELAY_S;
      const totalSeconds = callTimeRemaining + batchDelays;
      
      if (totalSeconds < 60) {
        setEtaText(`~${totalSeconds}s remaining`);
      } else if (totalSeconds < 3600) {
        const mins = Math.ceil(totalSeconds / 60);
        setEtaText(`~${mins}m remaining`);
      } else {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.ceil((totalSeconds % 3600) / 60);
        setEtaText(`~${hrs}h ${mins}m remaining`);
      }
    };

    computeEta();
    const interval = setInterval(computeEta, 1000);
    return () => clearInterval(interval);
  }, [isCalling, callStartTime, stats.uploaded, stats.completed, stats.inProgress]);

  return (
    <div className="gaming-flow-panel">
      <div className="flow-header">
        <div className="live-tag">
          <div className="live-dot" />
          LIVE JOURNEY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isCalling && etaText && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              fontSize: '10px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '100px',
              letterSpacing: '0.3px',
              animation: 'fadeInEta 0.3s ease'
            }}>
              <Timer size={11} />
              {etaText}
            </div>
          )}
          <div className="flow-title">Mission Control / Call Flow</div>
        </div>
      </div>
      
      <div className="flow-content">
        <div className="gaming-flow-container">
          
          {/* Node 1: Uploaded */}
          <GamingNode 
            icon={<Users size={22} />}
            title="Registry"
            label="Calls Uploaded"
            value={stats.uploaded}
            subtext="Calls ready to process"
            color="#94a3b8"
            active={true}
          />

          <GamingConnector active={stats.uploaded > 0} color="#6366f1" />

          {/* Node 2: In Progress */}
          <GamingNode 
            icon={<Zap size={22} />}
            title="Dialer"
            label="In Progress"
            value={stats.inProgress}
            subtext="Currently dialing"
            color="#22d3ee"
            pulse={isCalling && stats.inProgress > 0}
            active={stats.inProgress > 0}
          />

          <GamingConnector active={stats.inProgress > 0 || stats.completed > 0} color="#a855f7" />

          {/* Node 3: Completed */}
          <GamingNode 
            icon={<CheckCircle size={22} />}
            title="Analysis"
            label="Completed"
            value={stats.completed}
            subtext="Successful connections"
            color="#a855f7"
            active={stats.completed > 0}
          />

          {/* Branching */}
          <div className="gaming-branch-wrapper">
             <div className="branch-lines">
                <svg width="60" height="160" viewBox="0 0 60 160" className="neon-svg">
                   <path d="M 0 80 Q 30 80 30 20 L 60 20" fill="none" stroke="rgba(74, 222, 128, 0.15)" strokeWidth="2" />
                   <path d="M 0 80 Q 30 80 30 20 L 60 20" fill="none" stroke="#4ade80" strokeWidth="2" className="neon-path" style={{ opacity: stats.interested > 0 ? 1 : 0.1 }} />
                   
                   <path d="M 0 80 Q 30 80 30 55 L 60 55" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="2" />
                   <path d="M 0 80 Q 30 80 30 55 L 60 55" fill="none" stroke="#fbbf24" strokeWidth="2" className="neon-path" style={{ opacity: stats.reschedule > 0 ? 1 : 0.1 }} />
                   
                   <path d="M 0 80 Q 30 80 30 105 L 60 105" fill="none" stroke="rgba(96, 165, 250, 0.15)" strokeWidth="2" />
                   <path d="M 0 80 Q 30 80 30 105 L 60 105" fill="none" stroke="#60a5fa" strokeWidth="2" className="neon-path" style={{ opacity: stats.noAnswer > 0 ? 1 : 0.1 }} />
                   
                   <path d="M 0 80 Q 30 80 30 140 L 60 140" fill="none" stroke="rgba(248, 113, 113, 0.15)" strokeWidth="2" />
                   <path d="M 0 80 Q 30 80 30 140 L 60 140" fill="none" stroke="#f87171" strokeWidth="2" className="neon-path" style={{ opacity: stats.notInterested > 0 ? 1 : 0.1 }} />
                </svg>
             </div>

             <div className="gaming-branch-nodes">
                <GamingMiniNode label="Interested" value={stats.interested} sub="Leads secured" color="#4ade80" />
                <GamingMiniNode label="Reschedule" value={stats.reschedule} sub="Needs follow-up" color="#fbbf24" />
                <GamingMiniNode label="No Answer" value={stats.noAnswer} sub="Pending retry" color="#60a5fa" />
                <GamingMiniNode label="Not Interested" value={stats.notInterested} sub="Closed cases" color="#f87171" />
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .gaming-flow-panel {
          background: rgba(10, 10, 15, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          margin-bottom: 24px;
          padding: 16px 24px;
          backdrop-filter: blur(20px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          position: relative;
          overflow: hidden;
        }
        .gaming-flow-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
        }
        .flow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          padding-bottom: 12px;
        }
        .live-tag {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: #f87171;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.5px;
        }
        .live-dot {
          width: 5px; height: 5px;
          background: #f87171;
          border-radius: 50%;
          box-shadow: 0 0 8px #f87171;
          animation: blink 1s infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .flow-title {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .gaming-flow-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          min-height: 180px;
        }
        .flow-node {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 16px;
          width: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .node-glow {
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.4s;
          filter: blur(10px);
          z-index: -1;
        }
        .flow-node.active-node {
          background: rgba(255,255,255,0.03);
          transform: scale(1.02);
        }
        .flow-node.active-node .node-glow { opacity: 0.1; }
        .node-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
          box-shadow: inset 0 0 10px rgba(255,255,255,0.03);
        }
        .node-icon svg { width: 18px; height: 18px; }
        .node-title {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.2);
        }
        .node-value {
          font-size: 24px;
          font-weight: 800;
          line-height: 1;
          font-family: 'Outfit', sans-serif;
        }
        .node-subtext {
          font-size: 10px;
          color: rgba(255,255,255,0.2);
          font-weight: 500;
        }
        .gaming-connector {
          width: 60px;
          height: 1px;
          background: rgba(255,255,255,0.03);
          position: relative;
          overflow: hidden;
        }
        .connector-flow {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, var(--flow-color), transparent);
          animation: gamingFlow 1.5s infinite linear;
        }
        @keyframes gamingFlow { 
          from { left: -100%; }
          to { left: 100%; }
        }
        .gaming-branch-wrapper {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .branch-lines {
          width: 60px;
          height: 160px;
          display: flex;
          align-items: center;
        }
        .gaming-branch-nodes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .gaming-mini-node {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 10px;
          padding: 8px 14px;
          width: 160px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          transition: all 0.3s;
        }
        .mini-glow {
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 2px;
          border-radius: 10px;
          box-shadow: 0 0 10px var(--mini-color);
        }
        .mini-info { display: flex; flex-direction: column; gap: 0; }
        .mini-label { font-size: 10px; font-weight: 700; color: #fff; }
        .mini-sub { font-size: 8px; color: rgba(255,255,255,0.2); font-weight: 600; text-transform: uppercase; }
        .mini-val { font-size: 14px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
        .neon-svg { 
          width: 60px;
          height: 160px;
          overflow: visible; 
        }
        .neon-path {
          stroke-dasharray: 10 20;
          animation: neonDash 0.8s linear infinite;
        }
        @keyframes neonDash { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
        .pulse-effect { animation: gamingPulse 2s infinite; }
        @keyframes gamingPulse {
          0% { box-shadow: 0 0 0 0 var(--pulse-color); }
          70% { box-shadow: 0 0 0 20px rgba(0,0,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
        @keyframes fadeInEta {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      ` }} />
    </div>
  );
};

const GamingNode = ({ icon, title, label, value, subtext, color, pulse, active }) => (
  <div className={`flow-node ${pulse ? 'pulse-effect' : ''} ${active ? 'active-node' : ''}`} 
       style={{ 
         '--pulse-color': `${color}44`,
         borderColor: active ? `${color}44` : 'rgba(255,255,255,0.05)'
       }}>
    <div className="node-glow" style={{ background: color }} />
    <div className="node-icon" style={{ color: color, background: `${color}11` }}>{icon}</div>
    <div className="node-title">{title}</div>
    <div className="node-value" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.1)' }}>{value}</div>
    <div className="node-subtext">{subtext}</div>
  </div>
);

const GamingConnector = ({ active, color }) => (
  <div className="gaming-connector">
    {active && <div className="connector-flow" style={{ '--flow-color': color }} />}
  </div>
);

const GamingMiniNode = ({ label, value, sub, color }) => (
  <div className="gaming-mini-node" style={{ borderColor: value > 0 ? `${color}33` : 'rgba(255,255,255,0.05)' }}>
    <div className="mini-glow" style={{ background: color, '--mini-color': color }} />
    <div className="mini-info">
      <span className="mini-label">{label}</span>
      <span className="mini-sub">{sub}</span>
    </div>
    <div className="mini-val" style={{ color: value > 0 ? color : 'rgba(255,255,255,0.1)' }}>{value}</div>
  </div>
);
