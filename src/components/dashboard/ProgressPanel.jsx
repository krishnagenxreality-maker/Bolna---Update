import React from 'react';
import { Panel } from '../ui/Panel';
import { StatBox } from '../ui/StatBox';
import { LogBox } from '../ui/LogBox';

export const ProgressPanel = ({ showProgress, stats, logs }) => {
  if (!showProgress) return null;

  return (
    <Panel label="Calling Progress">
      <div className="prog-head">
        <div className="panel-label" style={{marginBottom:0}}>
          <span className="label-dot" />
          Calling Progress
        </div>
      </div>

      <div className="prog-track">
        <div className="prog-fill" style={{width: stats.pct + "%"}} />
      </div>

      <div className="stats-grid">
        <StatBox num={stats.total}  label="Total"       cls="sn-white" />
        <StatBox num={stats.done}   label="Completed"   cls="sn-green" />
        <StatBox num={stats.active} label="In Progress" cls="sn-blue" />
        <StatBox num={stats.failed} label="Failed"      cls="sn-red" />
      </div>

      <LogBox logs={logs} />
    </Panel>
  );
};
