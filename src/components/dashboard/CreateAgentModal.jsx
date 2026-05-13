import React, { useState, useEffect } from 'react';
import { X, Wand2, PenTool, Loader, Bot, Sparkles, Mic2, ChevronDown } from 'lucide-react';
import { DEEPSEEK_API_KEY } from '../../utils/constants';
import { fetchVoices } from '../../services/api';

export const CreateAgentModal = ({ isOpen, onClose, apiKey, onAgentCreated }) => {
  const [agentName, setAgentName] = useState('');
  const [scriptMode, setScriptMode] = useState('manual'); // 'manual' | 'ai'
  const [manualScript, setManualScript] = useState('');
  const [aiPurpose, setAiPurpose] = useState('');
  const [aiGeneratedScript, setAiGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null); // { name, id }
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  const resetForm = () => {
    setAgentName('');
    setScriptMode('manual');
    setManualScript('');
    setAiPurpose('');
    setAiGeneratedScript('');
    setIsGenerating(false);
    setIsCreating(false);
    setError('');
    setVoices([]);
    setSelectedVoice(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen && apiKey) {
      const loadVoices = async () => {
        setIsLoadingVoices(true);
        try {
          const data = await fetchVoices(apiKey);
          console.log("AVAILABLE_VOICES:", data);
          
          let flattened = [];
          if (Array.isArray(data)) {
            flattened = data.map(v => ({ name: v.name, id: v.voice_id || v.id }));
          } else if (data && typeof data === 'object') {
            // Handle nested formats if any
            const possibleKey = Object.keys(data).find(k => Array.isArray(data[k]));
            if (possibleKey) {
              flattened = data[possibleKey].map(v => ({ name: v.name, id: v.voice_id || v.id }));
            }
          }

          setVoices(flattened);
          if (flattened.length > 0) {
            setSelectedVoice(flattened[0]);
          }
        } catch (err) {
          console.error("Failed to load voices:", err);
        }
        setIsLoadingVoices(false);
      };
      loadVoices();
    }
  }, [isOpen, apiKey]);

  const generateScriptWithAI = async () => {
    if (!aiPurpose.trim()) {
      setError('Please enter the purpose for your agent.');
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert script writer for AI voice calling agents. Generate a complete, professional, conversational script that an AI phone agent will speak. The script should include a greeting, main conversation flow, objection handling, and closing. Write it as a natural conversation prompt/instruction for the AI agent. Do not include stage directions or formatting — just the actual prompt text the agent should follow.'
            },
            {
              role: 'user',
              content: `Generate a full AI calling agent script for the following purpose:\n\n${aiPurpose}`
            }
          ],
          temperature: 0.7
        })
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();
      const generated = data.choices[0].message.content;
      setAiGeneratedScript(generated);
    } catch (err) {
      setError('Failed to generate script. Please try again.');
      console.error('AI script generation error:', err);
    }
    setIsGenerating(false);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError('');

    const script = scriptMode === 'manual' ? manualScript : aiGeneratedScript;

    if (!agentName.trim()) {
      setError('Please provide an Agent Name.');
      setIsCreating(false);
      return;
    }
    if (!script.trim()) {
      setError('Please provide a script for the agent.');
      return;
    }
    if (!apiKey) {
      setError('No Bolna API key found. Please contact admin.');
      setIsCreating(false);
      return;
    }

    // Frontend Validation
    if (!agentName.trim()) {
      setError('Please provide an Agent Name.');
      setIsCreating(false);
      return;
    }
    if (!script.trim()) {
      setError('Please provide or generate a script first.');
      setIsCreating(false);
      return;
    }

    const payload = {
      agent_config: {
        agent_name: agentName.trim(),
        agent_welcome_message: "Hello! How can I help you today?",
        agent_type: "other",
        tasks: [
          {
            task_type: "conversation",
            task_id: "task_1",
            toolchain: {
              execution: "parallel",
              pipelines: [["transcriber", "llm", "synthesizer"]]
            },
            tools_config: {
              llm_agent: {
                agent_flow_type: "streaming",
                agent_type: "simple_llm_agent",
                llm_config: {
                  provider: "openai",
                  model: "gpt-4o-mini",
                  temperature: 0.3,
                  max_tokens: 100,
                  family: "openai"
                }
              },
              synthesizer: {
                provider: "elevenlabs",
                stream: true,
                provider_config: {
                  voice: selectedVoice?.name || "Rachel",
                  voice_id: selectedVoice?.id || "21m00Tcm4TlvDq8ikWAM",
                  model: "eleven_turbo_v2_5"
                }
              },
              transcriber: {
                provider: "deepgram",
                model: "nova-2",
                language: "en",
                stream: true
              },
              input: {
                provider: "twilio",
                format: "wav"
              },
              output: {
                provider: "twilio",
                format: "wav"
              }
            },
            task_config: {
              hangup_after_silence: 10,
              incremental_delay: 400,
              number_of_words_for_interruption: 2
            },
            metadata: {
              purpose: "custom_agent_creation"
            }
          }
        ]
      },
      agent_prompts: {
        task_1: {
          system_prompt: script.trim()
        }
      }
    };

    console.log("SELECTED_VOICE_ID:", selectedVoice?.id);
    console.log("CREATE_AGENT_PAYLOAD", payload);

    try {
      const bolnaRes = await fetch('https://api.bolna.ai/v2/agent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log("CREATE_AGENT_RESPONSE_STATUS", bolnaRes.status);
      
      const resText = await bolnaRes.text();
      console.log("BOLNA_RESPONSE:", resText);

      if (!bolnaRes.ok) {
        let errorMessage = 'Failed to create agent.';
        try {
          const errData = JSON.parse(resText);
          // Requirement 6: Show real API error message
          if (errData.message) {
            errorMessage = `Bolna API Error: ${errData.message}`;
          } else if (errData.detail) {
            errorMessage = `Bolna API Detail: ${JSON.stringify(errData.detail)}`;
          }
        } catch (e) {
          errorMessage = `Bolna API error (${bolnaRes.status}): ${resText.slice(0, 150)}`;
        }
        throw new Error(errorMessage);
      }

      const bolnaData = JSON.parse(resText);
      const bolnaAgentId = bolnaData.agent_id || bolnaData.id;

      console.log("CREATE_AGENT_SUCCESS", { bolnaAgentId });

      if (!bolnaAgentId) {
        throw new Error('Agent created but no ID was returned from Bolna.');
      }

      await onAgentCreated({
        agentName: agentName.trim(),
        script: script,
        scriptType: scriptMode === 'manual' ? 'manual' : 'ai_generated',
        bolnaAgentId: bolnaAgentId,
        voiceId: selectedVoice?.id,
        voiceName: selectedVoice?.name
      });

      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create agent.');
      console.error('Agent creation error:', err);
    }
    setIsCreating(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadein 0.2s ease'
    }}>
      <div className="panel" style={{
        width: '100%', maxWidth: '580px', padding: '32px',
        maxHeight: '85vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#a78bfa'
            }}>
              <Bot size={18} />
            </div>
            <div>
              <div className="panel-label" style={{ marginBottom: 0 }}>Create your agent</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                Build a custom AI calling agent
              </div>
            </div>
          </div>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Agent Name */}
        <div className="field" style={{ marginBottom: '20px' }}>
          <label className="field-label">Agent Name</label>
          <input
            type="text"
            className="field-input"
            placeholder="e.g. Sales Outreach Agent"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
          />
        </div>

        {/* Script Mode Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label className="field-label" style={{ marginBottom: '10px', display: 'block' }}>Script Mode</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setScriptMode('manual')}
              style={{
                flex: 1, padding: '12px 16px',
                background: scriptMode === 'manual' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${scriptMode === 'manual' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                color: scriptMode === 'manual' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <PenTool size={14} />
              Manual Script
            </button>
            <button
              onClick={() => setScriptMode('ai')}
              style={{
                flex: 1, padding: '12px 16px',
                background: scriptMode === 'ai' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${scriptMode === 'ai' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                color: scriptMode === 'ai' ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={14} />
              AI Gen Script
            </button>
          </div>
        </div>

        {/* Voice Selection */}
        <div className="field" style={{ marginBottom: '20px' }}>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mic2 size={14} />
            Agent Voice
          </label>
          {isLoadingVoices ? (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', padding: '8px' }}>
              <Loader size={12} style={{ display: 'inline', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
              Loading available voices...
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <select
                className="field-input"
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  cursor: 'pointer',
                  appearance: 'none',
                  width: '100%',
                  paddingRight: '40px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                value={selectedVoice?.id || ''}
                onChange={(e) => {
                  const voice = voices.find(v => v.id === e.target.value);
                  if (voice) setSelectedVoice(voice);
                }}
              >
                {voices.length === 0 ? (
                  <option value="" style={{ background: '#121212' }}>No voices available (using fallback)</option>
                ) : (
                  voices.map(v => (
                    <option key={v.id} value={v.id} style={{ background: '#121212', color: '#fff' }}>{v.name}</option>
                  ))
                )}
              </select>
              <div style={{ 
                position: 'absolute', right: '14px', top: '50%', 
                transform: 'translateY(-50%)', pointerEvents: 'none',
                color: 'rgba(255,255,255,0.3)'
              }}>
                <ChevronDown size={14} />
              </div>
            </div>
          )}
        </div>

        {/* Manual Script Mode */}
        {scriptMode === 'manual' && (
          <div className="field" style={{ marginBottom: '20px' }}>
            <label className="field-label">Agent Script</label>
            <textarea
              className="field-input"
              placeholder="Enter the script your agent will follow during calls..."
              value={manualScript}
              onChange={(e) => setManualScript(e.target.value)}
              rows={8}
              style={{
                resize: 'vertical', minHeight: '160px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px', lineHeight: '1.7'
              }}
            />
          </div>
        )}

        {/* AI Gen Script Mode */}
        {scriptMode === 'ai' && (
          <>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label className="field-label">Purpose</label>
              <textarea
                className="field-input"
                placeholder="Describe what this agent should do, e.g. 'Call leads about our new real estate project in Downtown area, qualify their interest and schedule site visits'"
                value={aiPurpose}
                onChange={(e) => setAiPurpose(e.target.value)}
                rows={3}
                style={{
                  resize: 'vertical', minHeight: '80px',
                  fontSize: '13px', lineHeight: '1.6'
                }}
              />
            </div>

            <button
              onClick={generateScriptWithAI}
              disabled={isGenerating || !aiPurpose.trim()}
              style={{
                padding: '10px 20px', marginBottom: '16px',
                background: isGenerating ? 'rgba(59, 130, 246, 0.1)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '10px', cursor: isGenerating ? 'wait' : 'pointer',
                color: '#60a5fa', fontFamily: "'Outfit', sans-serif",
                fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', transition: 'all 0.2s',
                opacity: !aiPurpose.trim() ? 0.5 : 1
              }}
            >
              {isGenerating ? (
                <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating Script...</>
              ) : (
                <><Wand2 size={14} /> Generate Script with AI</>
              )}
            </button>

            {aiGeneratedScript && (
              <div className="field" style={{ marginBottom: '20px' }}>
                <label className="field-label">Generated Script</label>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: '10px', padding: '14px',
                  maxHeight: '200px', overflowY: 'auto',
                  fontSize: '12px', lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {aiGeneratedScript}
                </div>
              </div>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{
            color: '#ff7070', fontSize: '12px',
            marginBottom: '12px', padding: '8px 12px',
            background: 'rgba(255, 112, 112, 0.08)',
            borderRadius: '8px', border: '1px solid rgba(255, 112, 112, 0.15)'
          }}>
            {error}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="btn-call"
          style={{
            width: '100%', justifyContent: 'center',
            padding: '14px', fontSize: '14px',
            opacity: isCreating ? 0.7 : 1
          }}
        >
          {isCreating ? (
            <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating Agent...</>
          ) : (
            'Create Agent'
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
};
