import React from 'react';
import { Panel } from '../ui/Panel';
import { Key, UserCheck } from 'lucide-react';

export const ConfigPanel = ({ apiKey, agentId }) => {
  return (
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
            <UserCheck size={14} /> Agent ID
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
            {agentId || 'Not configured'}
          </div>
        </div>
      </div>
    </Panel>
  );
};
