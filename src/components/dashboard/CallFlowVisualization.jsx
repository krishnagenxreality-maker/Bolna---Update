import React, { useState, useEffect } from 'react';
import { Phone, Users, CheckCircle, Clock, Zap, Target, XCircle, HelpCircle, Timer } from 'lucide-react';

export const CallFlowVisualization = ({ contacts, agentId, isCalling, callStartTime, stats }) => {
  const selectedAgentId = agentId?.includes('::') ? agentId.split('::')[1] : agentId;
  
  // Safe agent fallback: use contacts list directly if agent-specific filtering yields empty set
  let activeContacts = (contacts || []);
  if (selectedAgentId) {
    const filtered = (contacts || []).filter(c => c.agentId === agentId || c.agentId === selectedAgentId || c.id?.includes(selectedAgentId));
    if (filtered.length > 0) {
      activeContacts = filtered;
    }
  }

  // Always compute stats locally from active session contacts to guarantee real-time updates and accurate classification
  const statsToUse = {
    total: activeContacts.length,
    pending: activeContacts.filter(c => !c.status || c.status === 'pending').length,
    active: activeContacts.filter(c => c.status === 'processing' || c.status === 'calling' || c.status === 'queued').length,
    done: activeContacts.filter(c => c.status === 'called' || c.status === 'completed').length,
    completed: activeContacts.filter(c => {
      const isFinished = c.status === 'called' || c.status === 'completed';
      if (!isFinished) return false;
      const s = (c.status || '').toLowerCase();
      const r = (c.response || '').toLowerCase();
      const isNoAnswer = s.includes('no answer') || s.includes('no_answer') || s.includes('busy') || s.includes('failed') || 
                         r.includes('no answer') || r.includes('busy') || r.includes('failed');
      return !isNoAnswer;
    }).length,
    noAnswer: activeContacts.filter(c => {
      const isFinishedOrFailed = c.status === 'called' || c.status === 'completed' || c.status === 'failed';
      if (!isFinishedOrFailed) return false;
      const s = (c.status || '').toLowerCase();
      const r = (c.response || '').toLowerCase();
      return s.includes('no answer') || s.includes('no_answer') || s.includes('busy') || s.includes('failed') || 
             r.includes('no answer') || r.includes('busy') || r.includes('failed') ||
             c.status === 'failed';
    }).length
  };

  const visualStats = {
    uploaded: statsToUse.total || 0,
    pending: statsToUse.pending || 0,
    inProgress: statsToUse.active || 0,
    completed: statsToUse.done || 0,
    branchCompleted: statsToUse.completed || 0,
    branchNoAnswer: statsToUse.noAnswer || 0
  };

  // Check if campaign is completed successfully
  const isCompleted = visualStats.uploaded > 0 && visualStats.completed === visualStats.uploaded;

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
      const remaining = visualStats.uploaded - visualStats.completed;
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
  }, [isCalling, callStartTime, visualStats.uploaded, visualStats.completed]);

  return (
    <div className={`gaming-flow-panel ${isCompleted ? 'campaign-completed' : ''}`}>
      <div className="flow-header">
        <div className="live-tag" style={{
          background: isCompleted ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          borderColor: isCompleted ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
          color: isCompleted ? '#4ade80' : '#f87171'
        }}>
          <div className="live-dot" style={{
            background: isCompleted ? '#4ade80' : '#f87171',
            boxShadow: isCompleted ? '0 0 8px #4ade80' : '0 0 8px #f87171'
          }} />
          {isCompleted ? 'CAMPAIGN COMPLETE' : 'LIVE JOURNEY'}
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
          {isCompleted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              color: '#4ade80',
              fontSize: '10px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '100px',
              letterSpacing: '0.3px',
              animation: 'fadeInEta 0.3s ease'
            }}>
              MISSION ACCOMPLISHED
            </div>
          )}
          <div className="flow-title">Mission Control / Call Flow</div>
        </div>
      </div>
      
      <div className="flow-content">
        <div className="gaming-flow-container">
          
          {/* Node 1: Uploaded */}
          <GamingNode 
            icon={<Target size={22} />}
            title="Registry"
            label="Total Calls"
            value={visualStats.uploaded}
            subtext="Input detected"
            color="#94a3b8"
            active={true}
          />

          <GamingConnector active={visualStats.uploaded > 0} color="#6366f1" fast={isCalling} />

          {/* Node 2: Pending */}
          <GamingNode 
            icon={<Clock size={22} />}
            title="Standby"
            label="Pending"
            value={visualStats.pending}
            subtext="Waiting in queue"
            color="#f59e0b"
            active={visualStats.pending > 0}
          />

          <GamingConnector active={visualStats.pending > 0 || visualStats.inProgress > 0} color="#3b82f6" fast={isCalling} />

          {/* Node 3: In Progress */}
          <GamingNode 
            icon={<Zap size={22} />}
            title="Dialer"
            label="In Progress"
            value={visualStats.inProgress}
            subtext="Active dialing"
            color="#22d3ee"
            pulse={isCalling && visualStats.inProgress > 0}
            active={visualStats.inProgress > 0}
          />

          <GamingConnector active={visualStats.inProgress > 0 || visualStats.completed > 0} color="#a855f7" fast={isCalling} />

          {/* Node 4: Completed */}
          <GamingNode 
            icon={<CheckCircle size={22} />}
            title="Analysis"
            label="Completed"
            value={visualStats.completed}
            subtext="Finished calls"
            color="#a855f7"
            active={visualStats.completed > 0}
          />

          {/* Branching into 2 options: Completed vs No Answer */}
          <div className="gaming-branch-wrapper">
             <div className="branch-lines">
                <svg width="60" height="100" viewBox="0 0 60 100" className="neon-svg">
                   {/* Upper Branch: Completed */}
                   <path d="M 0 50 Q 30 50 30 20 L 60 20" fill="none" stroke="rgba(74, 222, 128, 0.15)" strokeWidth="2" />
                   <path 
                     d="M 0 50 Q 30 50 30 20 L 60 20" 
                     fill="none" 
                     stroke="#4ade80" 
                     strokeWidth="2" 
                     className="neon-path" 
                     style={{ 
                       opacity: visualStats.branchCompleted > 0 ? 1 : (isCalling ? 0.35 : 0.1),
                       strokeDasharray: visualStats.branchCompleted > 0 ? '5 10' : '10 20',
                       animationDuration: visualStats.branchCompleted > 0 ? '0.5s' : '1.5s',
                       filter: visualStats.branchCompleted > 0 ? 'drop-shadow(0 0 5px #4ade80)' : 'none'
                     }} 
                   />
                   
                   {/* Lower Branch: No Answer */}
                   <path d="M 0 50 Q 30 50 30 80 L 60 80" fill="none" stroke="rgba(96, 165, 250, 0.15)" strokeWidth="2" />
                   <path 
                     d="M 0 50 Q 30 50 30 80 L 60 80" 
                     fill="none" 
                     stroke="#60a5fa" 
                     strokeWidth="2" 
                     className="neon-path" 
                     style={{ 
                       opacity: visualStats.branchNoAnswer > 0 ? 1 : (isCalling ? 0.35 : 0.1),
                       strokeDasharray: visualStats.branchNoAnswer > 0 ? '5 10' : '10 20',
                       animationDuration: visualStats.branchNoAnswer > 0 ? '0.5s' : '1.5s',
                       filter: visualStats.branchNoAnswer > 0 ? 'drop-shadow(0 0 5px #60a5fa)' : 'none'
                     }} 
                   />
                </svg>
             </div>

             <div className="gaming-branch-nodes" style={{ gap: '12px' }}>
                <GamingMiniNode label="Completed" value={visualStats.branchCompleted} sub="Successful Calls" color="#4ade80" />
                <GamingMiniNode label="No Answer" value={visualStats.branchNoAnswer} sub="Failed / Busy" color="#60a5fa" />
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
          transition: all 0.5s ease;
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
          font-size: 9px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.5px;
          border: 1px solid transparent;
          transition: all 0.3s ease;
        }
        .live-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
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
          min-height: 140px;
        }
        .flow-node {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 16px;
          padding: 16px;
          width: 140px;
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
          display: inline-block;
          transition: color 0.3s ease;
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
          animation: gamingFlow var(--flow-duration, 1.5s) infinite linear;
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
          height: 100px;
          display: flex;
          align-items: center;
        }
        .gaming-branch-nodes {
          display: flex;
          flex-direction: column;
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
        .mini-val { font-size: 14px; font-weight: 800; font-family: 'JetBrains Mono', monospace; display: inline-block; }
        .neon-svg { 
          width: 60px;
          height: 100px;
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
        @keyframes valueUpdate {
          0% { transform: scale(1); text-shadow: none; }
          50% { transform: scale(1.2); text-shadow: 0 0 15px currentColor; }
          100% { transform: scale(1); text-shadow: none; }
        }
        @keyframes completedGlow {
          0% { box-shadow: 0 0 20px rgba(74, 222, 128, 0.15); border-color: rgba(74, 222, 128, 0.2); }
          50% { box-shadow: 0 0 40px rgba(74, 222, 128, 0.35); border-color: rgba(74, 222, 128, 0.5); }
          100% { box-shadow: 0 0 20px rgba(74, 222, 128, 0.15); border-color: rgba(74, 222, 128, 0.2); }
        }
        .gaming-flow-panel.campaign-completed {
          animation: completedGlow 3s infinite ease-in-out;
          border: 1px solid rgba(74, 222, 128, 0.3) !important;
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
    <div 
      key={value}
      className="node-value" 
      style={{ 
        color: active ? '#fff' : 'rgba(255,255,255,0.1)',
        animation: active && value > 0 ? 'valueUpdate 0.5s ease-out' : 'none'
      }}
    >
      {value}
    </div>
    <div className="node-subtext">{subtext}</div>
  </div>
);

const GamingConnector = ({ active, color, fast }) => (
  <div className="gaming-connector">
    {active && (
      <div 
        className="connector-flow" 
        style={{ 
          '--flow-color': color,
          '--flow-duration': fast ? '0.75s' : '1.5s'
        }} 
      />
    )}
  </div>
);

const GamingMiniNode = ({ label, value, sub, color }) => (
  <div className="gaming-mini-node" style={{ borderColor: value > 0 ? `${color}33` : 'rgba(255,255,255,0.05)' }}>
    <div className="mini-glow" style={{ background: color, '--mini-color': color }} />
    <div className="mini-info">
      <span className="mini-label">{label}</span>
      <span className="mini-sub">{sub}</span>
    </div>
    <div 
      key={value}
      className="mini-val" 
      style={{ 
        color: value > 0 ? color : 'rgba(255,255,255,0.1)',
        animation: value > 0 ? 'valueUpdate 0.5s ease-out' : 'none'
      }}
    >
      {value}
    </div>
  </div>
);
