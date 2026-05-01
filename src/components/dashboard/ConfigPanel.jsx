import React from 'react';
import { Panel } from '../ui/Panel';
import { Key, UserCheck } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';

export const ConfigPanel = ({ apiKey, agentId, setAgentId, availableAgents = [] }) => {
  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Panel label="Connection Status">
        <div className="config-grid">
          <div className="field">
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={14} /> Bolna API Key
            </label>
            <div className="field-input read-only" style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.85rem',
              padding: '0.6rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontFamily: 'monospace'
            }}>
              {apiKey ? '••••••••' + apiKey.slice(-4) : 'Not configured'}
            </div>
          </div>
          <div className="field">
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={14} /> Bolna Agent
            </label>
            
            {availableAgents.length > 1 ? (
              <Dropdown
                value={agentId}
                onChange={(val) => setAgentId(val)}
                options={availableAgents.map(agent => ({
                  label: agent.name,
                  value: `${agent.name}::${agent.id}`
                }))}
              />
            ) : (
              <div className="field-input read-only" style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.85rem',
                padding: '0.6rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontFamily: 'monospace'
              }}>
                {availableAgents.length === 1 ? availableAgents[0].name : (agentId ? agentId.split('::')[0] : 'Not configured')}
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
};
