import React from 'react';
import { Panel } from '../ui/Panel';

export const ConfigPanel = ({ apiKey, setApiKey, agentId, setAgentId }) => {
  return (
    <Panel label="Configuration">
      <div className="config-grid">
        <div className="field">
          <label className="field-label">Bolna API Key</label>
          <input
            type="password"
            className="field-input"
            placeholder="sk-xxxxxxxxxxxxxxxx"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label">Agent ID</label>
          <input
            type="text"
            className="field-input"
            placeholder="123e4567-e89b-12d3-a456-…"
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
          />
        </div>
      </div>
    </Panel>
  );
};
