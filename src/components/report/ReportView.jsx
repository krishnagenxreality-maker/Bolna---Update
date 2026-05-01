import React, { useState } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { DatePicker } from '../ui/DatePicker';
import { Download, Sparkles, Loader2 } from 'lucide-react';
import { generateDailyReportWithDeepSeek } from '../../services/api';
import { DEEPSEEK_API_KEY } from '../../utils/constants';
import './ReportView.css';

export const ReportView = ({ contacts, agentId, searchDate, setSearchDate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const activeContacts = agentId ? contacts.filter(c => c.agentId === agentId) : contacts;
  const dayContacts = activeContacts.filter(c => c.date === searchDate);

  const total = dayContacts.length;
  const completed = dayContacts.filter(c => c.status === 'completed' || c.status === 'called').length;
  const busy = dayContacts.filter(c => c.response?.toLowerCase().includes('busy')).length;
  const interested = dayContacts.filter(c => c.leadCategory === 'interested' || (c.response?.toLowerCase().includes('interested') && !c.response?.toLowerCase().includes('not interested'))).length;
  const notInterested = dayContacts.filter(c => c.leadCategory === 'not_interested' || c.response?.toLowerCase().includes('not interested')).length;
  const rescheduled = dayContacts.filter(c => c.leadCategory === 'reschedule' || c.response?.toLowerCase().includes('reschedule')).length;

  const stats = { total, completed, busy, interested, notInterested, rescheduled };

  const handleGenerate = async () => {
    if (total === 0) {
      alert("No calls found for the selected date.");
      return;
    }
    setIsGenerating(true);
    
    // Extract up to 10 summaries to give the AI context without blowing up tokens
    const summaries = dayContacts
      .filter(c => c.summary && c.summary.trim() !== '')
      .map(c => `- ${c.name}: ${c.summary}`)
      .slice(0, 10);

    const generated = await generateDailyReportWithDeepSeek(DEEPSEEK_API_KEY, stats, summaries);
    setReport(generated);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!report) return;
    
    const content = `DAILY CALL REPORT
Date: ${searchDate}
----------------------------------------

[ NUMERICAL STATS ]
Total Calls: ${total}
Completed: ${completed}
Interested: ${interested}
Not Interested: ${notInterested}
Busy: ${busy}
Rescheduled: ${rescheduled}

----------------------------------------

[ AI SUMMARY ]
${report.summary}

[ AI CONCLUSION & INSIGHTS ]
${report.conclusion}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_Report_${searchDate}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-view">
      <Panel>
        <PanelHead>
          <div className="panel-label" style={{marginBottom:0}}>
            <span className="label-dot" />
            AI Daily Report Generator
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <DatePicker value={searchDate} onChange={setSearchDate} />
          </div>
        </PanelHead>

        <div className="report-content">
          {/* Stats Display */}
          <div className="report-stats-grid">
            <div className="report-stat-card">
              <span className="stat-label">Total Calls</span>
              <span className="stat-value">{total}</span>
            </div>
            <div className="report-stat-card">
              <span className="stat-label">Interested</span>
              <span className="stat-value txt-green">{interested}</span>
            </div>
            <div className="report-stat-card">
              <span className="stat-label">Not Interested</span>
              <span className="stat-value txt-red">{notInterested}</span>
            </div>
            <div className="report-stat-card">
              <span className="stat-label">Rescheduled</span>
              <span className="stat-value txt-orange">{rescheduled}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="report-actions">
            <button 
              className={`btn-generate ${isGenerating ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating || total === 0}
            >
              {isGenerating ? <Loader2 className="spin-icon" size={16} /> : <Sparkles size={16} />}
              {isGenerating ? 'Analyzing Data...' : 'Generate AI Report'}
            </button>

            {report && (
              <button className="btn-download" onClick={handleDownload}>
                <Download size={16} /> Download Report
              </button>
            )}
          </div>

          {/* Report Output */}
          {report && (
            <div className="report-output fade-in">
              <div className="report-section">
                <h3>Summary Overview</h3>
                <p>{report.summary}</p>
              </div>
              
              <div className="report-section">
                <h3>Insights & Conclusion</h3>
                <p>{report.conclusion}</p>
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};
