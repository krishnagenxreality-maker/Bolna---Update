import React, { useState, useEffect } from 'react';
import { FileText, Loader } from 'lucide-react';

export const AgentScriptPanel = ({ agentId, apiKey, availableAgents = [] }) => {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    console.log("SCRIPT_RETRIEVAL_INIT", { agentId, hasApiKey: !!apiKey });
    if (!agentId || !apiKey) {
      setScript('');
      setAgentName('');
      return;
    }

    const actualBolnaId = agentId.includes('::') ? agentId.split('::')[1] : agentId;
    const displayName = agentId.includes('::') ? agentId.split('::')[0] : 'Agent';
    setAgentName(displayName);

    console.log("SCRIPT_RETRIEVAL_MAPPING", { 
      originalId: agentId, 
      mappedBolnaId: actualBolnaId, 
      displayName 
    });

    // Check if we already have the script in availableAgents (for custom agents)
    const localAgent = availableAgents.find(a => a.id === actualBolnaId);
    if (localAgent && localAgent.script) {
      console.log("SCRIPT_RETRIEVAL_SOURCE", "Matched in local availableAgents", { scriptLength: localAgent.script.length });
      setScript(localAgent.script);
      setLoading(false);
      return;
    }

    const fetchScript = async () => {
      setLoading(true);
      console.log("SCRIPT_RETRIEVAL_FETCH_START", { url: `https://api.bolna.ai/v2/agent/${actualBolnaId}` });
      try {
        const res = await fetch(`https://api.bolna.ai/v2/agent/${actualBolnaId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        console.log("SCRIPT_RETRIEVAL_FETCH_STATUS", res.status);
        
        if (!res.ok) {
          const errText = await res.text();
          console.error("SCRIPT_RETRIEVAL_FETCH_ERROR", errText);
          setScript('Unable to fetch agent script.');
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        console.log("SCRIPT_RETRIEVAL_FETCH_SUCCESS", { dataKeys: Object.keys(data) });
        
        // Extract prompt from agent_prompts
        let prompt = '';
        if (data.agent_prompts) {
          // Check task_1 (V2) or task_0 (legacy) or any first key
          const taskObj = data.agent_prompts.task_1 || data.agent_prompts.task_0 || data.agent_prompts[Object.keys(data.agent_prompts)[0]];
          if (taskObj) {
            prompt = taskObj.system_prompt || taskObj.prompt || '';
            if (prompt) console.log("SCRIPT_RETRIEVAL_FOUND", "In agent_prompts (v1/v2)");
          }
        }
        
        // Fallback 1: check agent_config.tasks
        if (!prompt && data.agent_config?.tasks) {
          const conversationTask = data.agent_config.tasks.find(t => t.task_type === 'conversation');
          if (conversationTask?.tools_config?.llm_agent?.prompt) {
            prompt = conversationTask.tools_config.llm_agent.prompt;
            if (prompt) console.log("SCRIPT_RETRIEVAL_FOUND", "In agent_config.tasks.llm_agent.prompt");
          } else if (conversationTask?.tools_config?.llm_agent?.llm_config?.prompt) {
            prompt = conversationTask.tools_config.llm_agent.llm_config.prompt;
            if (prompt) console.log("SCRIPT_RETRIEVAL_FOUND", "In agent_config.tasks.llm_agent.llm_config.prompt");
          }
        }
        
        // Fallback 2: check welcome message
        if (!prompt && data.agent_config?.agent_welcome_message) {
          prompt = `Welcome Message: ${data.agent_config.agent_welcome_message}`;
          if (prompt) console.log("SCRIPT_RETRIEVAL_FOUND", "In welcome_message fallback");
        }

        if (!prompt) console.warn("SCRIPT_RETRIEVAL_NOT_FOUND", "No prompt found in any expected field");

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
