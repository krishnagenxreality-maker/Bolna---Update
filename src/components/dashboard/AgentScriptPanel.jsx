import React, { useState, useEffect } from 'react';
import { FileText, Loader } from 'lucide-react';

export const AgentScriptPanel = ({ agentId, apiKey, availableAgents = [] }) => {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    if (!agentId || !apiKey) {
      setScript('');
      setAgentName('');
      return;
    }

    const actualBolnaId = agentId.includes('::') ? agentId.split('::')[1] : agentId;
    const displayName = agentId.includes('::') ? agentId.split('::')[0] : 'Agent';
    setAgentName(displayName);

    // Check if we already have the script in availableAgents (for custom agents)
    const localAgent = availableAgents.find(a => a.id === actualBolnaId);
    if (localAgent && localAgent.script) {
      setScript(localAgent.script);
      setLoading(false);
      return;
    }

    const fetchScript = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.bolna.ai/v2/agent/${actualBolnaId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) {
          setScript('Unable to fetch agent script.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        
        // Extract prompt from agent_prompts
        let prompt = '';
        if (data.agent_prompts) {
          const keys = Object.keys(data.agent_prompts);
          if (keys.length > 0) {
            prompt = data.agent_prompts[keys[0]]?.prompt || '';
          }
        }
        
        // Fallback: check welcome message
        if (!prompt && data.agent_config?.agent_welcome_message) {
          prompt = `Welcome Message: ${data.agent_config.agent_welcome_message}`;
        }

        setScript(prompt || 'No script found for this agent.');
      } catch (err) {
        setScript('Error loading agent script.');
        console.error('Failed to fetch agent script:', err);
      }
      setLoading(false);
    };

    fetchScript();
  }, [agentId, apiKey, availableAgents]);

  if (!agentId || !apiKey) return null;

  return (
    <div className="mgr-section" style={{ marginTop: '4px' }}>
      <label className="mgr-section-label">
        <FileText size={14} />
        Agent Script
        {agentName && <span style={{ 
          fontSize: '10px', 
          color: 'rgba(255,255,255,0.3)', 
          fontWeight: 400,
          marginLeft: '8px'
        }}>({agentName})</span>}
      </label>
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '14px',
        maxHeight: '180px',
        overflowY: 'auto',
        fontSize: '12px',
        lineHeight: '1.7',
        color: 'rgba(255, 255, 255, 0.55)',
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        position: 'relative'
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)' }}>
            <Loader size={14} className="spin-animation" />
            Loading script...
          </div>
        ) : script}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
};
