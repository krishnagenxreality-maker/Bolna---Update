import React, { useState, useMemo } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { DatePicker } from '../ui/DatePicker';
import { Download, Sparkles, Loader2, CalendarDays, PhoneCall, ListTodo, BarChart3, Users, ClipboardList, UserCheck, UserMinus, PhoneForwarded, Megaphone } from 'lucide-react';
import { generateDailyReportWithDeepSeek } from '../../services/api';
import { DEEPSEEK_API_KEY } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export const ReportView = ({ 
  contacts, 
  agentId, 
  searchDate, 
  setSearchDate,
  stats: globalStats,
  activeView,
  setActiveView
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const activeContacts = useMemo(() => agentId ? contacts.filter(c => c.agentId === agentId) : contacts, [contacts, agentId]);
  const dayContacts = useMemo(() => activeContacts.filter(c => c.date === searchDate), [activeContacts, searchDate]);

  const total = dayContacts.length;
  const completed = dayContacts.filter(c => c.status === 'completed' || c.status === 'called').length;
  const busy = dayContacts.filter(c => (c.response || '').toLowerCase().includes('busy')).length;
  const interested = dayContacts.filter(c => c.leadCategory === 'interested' || ((c.response || '').toLowerCase().includes('interested') && !(c.response || '').toLowerCase().includes('not interested'))).length;
  const notInterested = dayContacts.filter(c => c.leadCategory === 'not_interested' || (c.response || '').toLowerCase().includes('not interested')).length;
  const rescheduled = dayContacts.filter(c => c.leadCategory === 'reschedule' || (c.response || '').toLowerCase().includes('reschedule')).length;

  const currentStats = { total, completed, busy, interested, notInterested, rescheduled };

  const handleGenerate = async () => {
    // Plan validation
    if (user?.selectedPlan === 'Starter') {
      alert("Daily AI Report generation is not available on the Starter Plan. Please upgrade to the Growth or Pro Plan to unlock automated reporting.");
      return;
    }

    if (total === 0) {
      alert("No calls found for the selected date.");
      return;
    }

    // Weekly/Monthly Limit Check (Example logic for Growth/Pro)
    const isGrowth = user?.selectedPlan === 'Growth';
    const isPro = user?.selectedPlan === 'Pro';
    
    if (isGrowth && (user?.reportUsageWeekly || 0) >= 7) {
      alert("Growth Plan Limit: You have reached your weekly limit of 7 AI reports. Please wait for next week or upgrade to Pro.");
      return;
    }

    setIsGenerating(true);
    
    const summaries = dayContacts
      .filter(c => c.summary && c.summary.trim() !== '')
      .map(c => `- ${c.name}: ${c.summary}`)
      .slice(0, 10);

    const generated = await generateDailyReportWithDeepSeek(DEEPSEEK_API_KEY, currentStats, summaries);
    setReport(generated);
    
    // Track usage in backend
    try {
      await axios.post(`${API_BASE_URL}/api/reports/track/${user.userId}`, { type: 'weekly' });
      await axios.post(`${API_BASE_URL}/api/reports/track/${user.userId}`, { type: 'monthly' });
    } catch (e) { }

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

  const navItems = [
    { id: 'calendar', label: 'Dashboard', icon: <CalendarDays size={18} /> },
    { id: 'manager', label: 'Call Manager', icon: <PhoneCall size={18} /> },
    { id: 'details', label: 'Call Details', icon: <ListTodo size={18} /> },
    { id: 'responses', label: 'Responses', icon: <BarChart3 size={18} /> },
    { id: 'leads', label: 'Leads', icon: <Users size={18} /> },
    { id: 'campaign', label: 'Campaign', icon: <Megaphone size={18} /> },
    { id: 'report', label: 'Report', icon: <ClipboardList size={18} /> }
  ];

  return (
    <div className="report-page-container" style={{ paddingTop: '20px' }}>
      
      <div className="report-layout-wrapper">
        
        {/* LEFT COLUMN: Navigation & Metrics */}
        <div className="report-left-column">
          <div className="details-nav-matrix">
            {navItems.map((item) => (
              <div 
                key={item.id}
                className={`nav-matrix-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <div className="nav-matrix-icon">{item.icon}</div>
                <span className="nav-matrix-label">{item.label}</span>
              </div>
            ))}
          </div>

          {/* 1x4 Metrics Snapshot Section - Vertical Inline Stack */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: '8px',
            marginTop: '20px',
            width: '100%'
          }}>
            <div className="mini-metric-card" style={{ padding: '10px 16px', height: '44px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
              <div className="metric-icon-wrap" style={{ color: '#6366f1', width: '28px', height: '28px', flexShrink: 0 }}>
                <PhoneCall size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="metric-value" style={{ fontSize: '16px', fontWeight: '800' }}>{total}</span>
                <span className="metric-label" style={{ fontSize: '12px', fontWeight: '600', opacity: 0.6 }}>Total Calls</span>
              </div>
            </div>

            <div className="mini-metric-card" style={{ padding: '10px 16px', height: '44px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
              <div className="metric-icon-wrap" style={{ color: '#4ade80', width: '28px', height: '28px', flexShrink: 0 }}>
                <UserCheck size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="metric-value" style={{ fontSize: '16px', fontWeight: '800' }}>{interested}</span>
                <span className="metric-label" style={{ fontSize: '12px', fontWeight: '600', opacity: 0.6 }}>Interested</span>
              </div>
            </div>

            <div className="mini-metric-card" style={{ padding: '10px 16px', height: '44px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
              <div className="metric-icon-wrap" style={{ color: '#f87171', width: '28px', height: '28px', flexShrink: 0 }}>
                <UserMinus size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="metric-value" style={{ fontSize: '16px', fontWeight: '800' }}>{notInterested}</span>
                <span className="metric-label" style={{ fontSize: '12px', fontWeight: '600', opacity: 0.6 }}>Not Interested</span>
              </div>
            </div>

            <div className="mini-metric-card" style={{ padding: '10px 16px', height: '44px', flexDirection: 'row', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
              <div className="metric-icon-wrap" style={{ color: '#fbbf24', width: '28px', height: '28px', flexShrink: 0 }}>
                <PhoneForwarded size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="metric-value" style={{ fontSize: '16px', fontWeight: '800' }}>{rescheduled}</span>
                <span className="metric-label" style={{ fontSize: '12px', fontWeight: '600', opacity: 0.6 }}>Reschedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Report Generator */}
        <div className="report-right-column">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
            
            <Panel style={{ flex: 1, minHeight: 0, borderRadius: '24px', overflow: 'hidden' }}>
              <div className="panel-body" style={{ 
                height: '100%', 
                padding: '32px', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: '0 0 24px 24px' /* Ensure bottom corners of body are rounded */
              }}>
                
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ 
                    fontSize: '32px', 
                    fontWeight: '800', 
                    color: '#fff', 
                    marginBottom: '8px',
                    letterSpacing: '-0.04em'
                  }}>
                    AI Report Generator
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px' }}>
                    Generate a comprehensive, AI-powered analysis of your call performance.
                  </p>
                </div>

                {/* AI Controls Section - Single Line Glassmorphic Container */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px', 
                  marginBottom: '24px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}>
                  <DatePicker value={searchDate} onChange={setSearchDate} />
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || total === 0}
                    style={{
                      background: isGenerating ? 'rgba(139, 92, 246, 0.2)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: (isGenerating || total === 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isGenerating ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.2)',
                      transition: 'all 0.3s ease',
                      opacity: total === 0 ? 0.5 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isGenerating ? 'Analyzing...' : 'Generate AI Report'}
                  </button>

                  <button 
                    onClick={handleDownload}
                    disabled={!report}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: !report ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      opacity: !report ? 0.3 : 1
                    }}
                  >
                    <Download size={16} /> Download TXT
                  </button>

                  {total === 0 && (
                    <span style={{ color: 'rgba(244, 63, 94, 0.7)', fontSize: '11px', fontWeight: '500' }}>
                      * No calls recorded
                    </span>
                  )}
                </div>

                {/* Report Content Output - Internally Scrollable */}
                <div style={{ 
                  width: '100%',
                  maxWidth: '750px',
                  alignSelf: 'center',
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '0 20px',
                  minHeight: 0,
                  textAlign: 'left',
                  maxHeight: '320px',
                  borderRadius: '0 0 16px 16px' /* Subtle round for bottom of scroll area */
                }} className="details-table-scroll-container">
                  {report ? (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '20px' }}>
                      <div>
                        <h3 style={{ color: '#8b5cf6', fontSize: '16px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }} />
                          Summary Overview
                        </h3>
                        <div style={{ 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          padding: '16px 20px', 
                          borderRadius: '12px',
                          lineHeight: '1.6',
                          color: 'rgba(255, 255, 255, 0.65)',
                          fontSize: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.03)'
                        }}>
                          {report.summary}
                        </div>
                      </div>
                      
                      <div>
                        <h3 style={{ color: '#10b981', fontSize: '16px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                          Insights & Conclusion
                        </h3>
                        <div style={{ 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          padding: '16px 20px', 
                          borderRadius: '12px',
                          lineHeight: '1.6',
                          color: 'rgba(255, 255, 255, 0.65)',
                          fontSize: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.03)'
                        }}>
                          {report.conclusion}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      opacity: 0.15,
                      textAlign: 'center'
                    }}>
                      <Sparkles size={60} style={{ marginBottom: '20px' }} />
                      <p style={{ fontSize: '18px', fontWeight: '700' }}>Select a date and click generate</p>
                    </div>
                  )}
                </div>

              </div>
            </Panel>
          </div>
        </div>

      </div>
    </div>
  );
};
