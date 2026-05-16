import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { DatePicker } from '../ui/DatePicker';
import { DEEPSEEK_API_KEY } from '../../utils/constants';
import { 
  CalendarDays, PhoneCall, ListTodo, BarChart3, Users, ClipboardList, ChevronLeft, ChevronRight, 
  Download, X, FileText, Megaphone, Zap, CheckCircle2, Activity, Bot, PhoneIncoming
} from 'lucide-react';

// Helper: generate campaign-level AI summary using DeepSeek
async function generateCampaignSummary(summaries) {
  if (!DEEPSEEK_API_KEY || summaries.length === 0) return null;
  
  const combinedSummaries = summaries.slice(0, 20).join('\n---\n');
  
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a campaign analyst. Given multiple call summaries from the same campaign, generate a brief overall campaign summary (2-3 sentences). Highlight key patterns, outcomes, and actionable insights. Be concise and direct."
          },
          {
            role: "user",
            content: `Campaign call summaries:\n${combinedSummaries}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("Campaign summary generation failed:", err);
    return null;
  }
}

export const CampaignView = ({ 
  contacts,
  campaigns,
  searchDate, 
  setSearchDate,
  agentId,
  activeView,
  setActiveView
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [modalData, setModalData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const ROWS_PER_PAGE = 4;

  const navItems = [
    { id: 'calendar', label: 'Dashboard', icon: <CalendarDays size={18} /> },
    { id: 'manager', label: 'Call Manager', icon: <PhoneCall size={18} /> },
    { id: 'details', label: 'Call Details', icon: <ListTodo size={18} /> },
    { id: 'responses', label: 'Responses', icon: <BarChart3 size={18} /> },
    { id: 'leads', label: 'Leads', icon: <Users size={18} /> },
    { id: 'campaign', label: 'Campaign', icon: <Megaphone size={18} /> },
    { id: 'report', label: 'Report', icon: <ClipboardList size={18} /> }
  ];

  // Build campaigns from campaigns table data
  const allCampaigns = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    return campaigns.map(camp => {
      // We still use contacts to get real-time call counts if possible
      // but the core data comes from the campaign record
      const matchedContacts = contacts.filter(c => c.agentId === camp.agentId || c.agentName === camp.agentName);
      
      const completedCalls = matchedContacts.filter(c => c.status === 'called' || c.status === 'completed').length;
      const noAnswer = matchedContacts.filter(c => (c.status || '').includes('no answer') || (c.response || '').includes('no answer')).length;
      const busy = matchedContacts.filter(c => (c.status || '').includes('busy') || (c.response || '').includes('busy')).length;
      const failed = matchedContacts.filter(c => c.status === 'failed').length;

      // Credits used = total calls attempted (completed + failed + no answer + busy)
      const creditsUsed = completedCalls + noAnswer + busy + failed;

      // Determine display status
      let displayStatus = camp.status;
      if (displayStatus === 'Running-Acknowledge') displayStatus = 'Running';

      // Collect all summaries for AI analysis (if any)
      const callSummaries = matchedContacts
        .filter(c => c.summary && c.summary.length > 0)
        .map(c => c.summary);

      return {
        id: camp.id,
        title: camp.title || 'Untitled Campaign',
        displayDate: camp.displayDate,
        totalCalls: camp.totalCalls || 0,
        completedCalls,
        noAnswer,
        busy,
        failed,
        creditsUsed: camp.creditsUsed || creditsUsed,
        agentName: camp.agentName || 'Default Agent',
        agentId: camp.agentId || '',
        status: displayStatus,
        callSummaries,
        contacts: matchedContacts,
        sheetName: camp.sheetName || 'N/A'
      };
    });
  }, [campaigns, contacts]);

  // Filter campaigns by agent
  const filteredCampaigns = useMemo(() => {
    return allCampaigns.filter(c => {
      let agentMatch = true;
      if (agentId) {
        const targetId = (agentId || '').includes('::') ? agentId.split('::')[1] : agentId;
        const jobAgId = c.agentId || '';
        const actualJobAgentId = jobAgId.includes('::') ? jobAgId.split('::')[1] : jobAgId;
        agentMatch = actualJobAgentId === targetId;
      }
      return agentMatch;
    });
  }, [allCampaigns, agentId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchDate, agentId]);

  const totalPages = Math.ceil(filteredCampaigns.length / ROWS_PER_PAGE);
  const currentRows = useMemo(() => {
    return filteredCampaigns.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  }, [filteredCampaigns, currentPage]);

  // Metrics
  const totalCampaigns = filteredCampaigns.length;
  const totalCalls = filteredCampaigns.reduce((sum, c) => sum + c.totalCalls, 0);
  const totalCredits = filteredCampaigns.reduce((sum, c) => sum + c.creditsUsed, 0);
  const activeCampaigns = filteredCampaigns.filter(c => c.status === 'Running' || c.status === 'Scheduled').length;

  // Handle campaign row click — open modal
  const handleCampaignClick = useCallback(async (campaign) => {
    setAiSummary('');
    setModalData(campaign);

    // Generate AI summary if we have call summaries
    if (campaign.callSummaries && campaign.callSummaries.length > 0) {
      setLoadingSummary(true);
      const summary = await generateCampaignSummary(campaign.callSummaries);
      if (summary) {
        setAiSummary(summary);
      }
      setLoadingSummary(false);
    }
  }, []);

  const closeModal = () => {
    setModalData(null);
    setAiSummary('');
  };

  // Status pill helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
      case 'Running': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' };
      case 'Scheduled': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' };
      case 'Pending': return { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.7)', border: 'rgba(255, 255, 255, 0.1)' };
      default: return { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  const handleDownload = () => {
    if (filteredCampaigns.length === 0) {
      alert("No campaigns to download.");
      return;
    }

    const headers = ['Campaign Title', 'Date', 'Sheet Name', 'Total Calls', 'Credits Used', 'Agent', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredCampaigns.map(c => [
        `"${c.title}"`,
        `"${c.displayDate}"`,
        `"${c.sheetName}"`,
        c.totalCalls,
        c.creditsUsed,
        `"${c.agentName}"`,
        `"${c.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campaigns_${searchDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="leads-page-container">
      
      {/* Page Heading Section */}
      <div className="leads-header-section">
        <h1 className="leads-main-heading">Campaigns</h1>
        <p className="leads-sub-heading">
          Track campaign performance, monitor call outcomes, and view AI-generated campaign insights.
        </p>
      </div>

      <div className="campaign-layout-wrapper" style={{ display: 'flex', gridTemplateColumns: 'none', height: 'auto', overflow: 'visible' }}>
        
        {/* LEFT COLUMN: Navigation & Metrics */}
        <div className="leads-left-column" style={{ width: '280px', flexShrink: 0 }}>
          <div className="details-nav-matrix sidebar-nav">
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

          {/* 2x2 Metrics Snapshot Section */}
          <div className="details-metrics-grid">
            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#8b5cf6' }}>
                <Megaphone size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{totalCampaigns}</div>
                <div className="metric-label">Campaigns</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#3b82f6' }}>
                <PhoneCall size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{totalCalls}</div>
                <div className="metric-label">Total Calls</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#f59e0b' }}>
                <Zap size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{totalCredits}</div>
                <div className="metric-label">Credits Used</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#10b981' }}>
                <Activity size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{activeCampaigns}</div>
                <div className="metric-label">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Campaigns Table */}
        <div className="campaign-right-column" style={{ flex: 1, minWidth: 0 }}>
          <Panel>
            <PanelHead>
              <div className="panel-label" style={{marginBottom:0}}>
                <span className="label-dot" />
                Campaign Analytics
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={handleDownload}
                  className="nav-btn"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Download
                </button>
                <DatePicker value={searchDate} onChange={setSearchDate} />
              </div>
            </PanelHead>

            <div className="panel-body">
              <div className="details-table-scroll-container campaign-table-section" style={{ flex: '0 0 auto', maxHeight: 'none' }}>
                <div className="table-wrap">
                  <table className="ct">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Campaign Name</th>
                        <th>Date</th>
                        <th>Sheet Name</th>
                        <th>Calls</th>
                        <th>Credits</th>
                        <th>Agent</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.map((campaign, i) => {
                        const ss = getStatusStyle(campaign.status);
                        return (
                          <tr 
                            key={campaign.id} 
                            className="campaign-row-clickable"
                            onClick={() => handleCampaignClick(campaign)}
                            title="Click to view campaign details"
                          >
                            <td className="td-num">{currentPage * ROWS_PER_PAGE + i + 1}</td>
                            <td className="td-name">
                              <span className="campaign-title-cell">
                                <Megaphone size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
                                {campaign.title}
                              </span>
                            </td>
                            <td className="td-phone" style={{ fontSize: '11px' }}>{campaign.displayDate}</td>
                            <td className="td-phone" style={{ fontSize: '11px', opacity: 0.7 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FileText size={12} style={{ opacity: 0.4 }} />
                                {campaign.sheetName}
                              </span>
                            </td>
                            <td className="td-num" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{campaign.totalCalls}</td>
                            <td className="td-num" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{campaign.creditsUsed}</td>
                            <td className="td-phone" style={{ fontSize: '11px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Bot size={12} style={{ opacity: 0.4 }} />
                                {(campaign.agentName || '').includes('::') ? campaign.agentName.split('::')[0] : (campaign.agentName || 'Default Agent')}
                              </span>
                            </td>
                            <td>
                              <span className="campaign-status-badge" style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '100px',
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                background: ss.bg,
                                color: ss.color,
                                border: `1px solid ${ss.border}`
                              }}>
                                {campaign.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredCampaigns.length === 0 && (
                    <div className="no-data" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                      No campaigns found. Create campaigns from the Call Manager page.
                    </div>
                  )}
                </div>
              </div>

              {/* Flex spacer */}
              <div style={{ flex: 1 }} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginTop: '0px',
                  padding: '12px 4px 4px'
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                    Showing {currentPage * ROWS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ROWS_PER_PAGE, filteredCampaigns.length)} of {filteredCampaigns.length}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="nav-btn"
                      style={{ 
                        padding: '6px', borderRadius: '6px', 
                        opacity: currentPage === 0 ? 0.3 : 1,
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="nav-btn"
                      style={{ 
                        padding: '6px', borderRadius: '6px', 
                        opacity: currentPage === totalPages - 1 ? 0.3 : 1,
                        cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

      </div>

      {/* Campaign Detail Modal */}
      {modalData && (
        <div className="category-detail-overlay" onClick={closeModal}>
          <div className="category-detail-modal campaign-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="category-modal-close" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="category-modal-header">
              <div className="category-modal-icon" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))' }}>
                <Megaphone size={24} />
              </div>
              <div>
                <h2 className="category-modal-title">{modalData.title}</h2>
                <p className="category-modal-contact">{modalData.agentName.includes('::') ? modalData.agentName.split('::')[0] : modalData.agentName} • {modalData.displayDate}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Sheet: {modalData.sheetName}</p>
              </div>
            </div>

            {/* Campaign Stats Grid */}
            <div className="campaign-modal-stats">
              <div className="campaign-stat-item">
                <div className="campaign-stat-value">{modalData.totalCalls}</div>
                <div className="campaign-stat-label">Total Calls</div>
              </div>
              <div className="campaign-stat-item">
                <div className="campaign-stat-value" style={{ color: '#10b981' }}>{modalData.completedCalls}</div>
                <div className="campaign-stat-label">Completed</div>
              </div>
              <div className="campaign-stat-item">
                <div className="campaign-stat-value" style={{ color: '#f59e0b' }}>{modalData.noAnswer}</div>
                <div className="campaign-stat-label">No Answer</div>
              </div>
              <div className="campaign-stat-item">
                <div className="campaign-stat-value" style={{ color: '#ef4444' }}>{modalData.busy}</div>
                <div className="campaign-stat-label">Busy</div>
              </div>
              <div className="campaign-stat-item">
                <div className="campaign-stat-value" style={{ color: '#8b5cf6' }}>{modalData.creditsUsed}</div>
                <div className="campaign-stat-label">Credits Used</div>
              </div>
              <div className="campaign-stat-item">
                <div className="campaign-stat-value" style={{ color: getStatusStyle(modalData.status).color }}>{modalData.status}</div>
                <div className="campaign-stat-label">Status</div>
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="category-modal-section">
              <div className="category-modal-section-label">
                <FileText size={14} />
                Overall AI Summary
              </div>
              <div className="category-summary-block">
                {loadingSummary ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(139, 92, 246, 0.6)' }}>
                    <div className="audio-loading-spinner" />
                    <span>Generating campaign summary...</span>
                  </div>
                ) : aiSummary ? (
                  aiSummary
                ) : (
                  <span style={{ opacity: 0.5 }}>
                    {modalData.callSummaries.length > 0 
                      ? 'Failed to generate summary. Please try again.' 
                      : 'No call summaries available yet for this campaign. Summary will be generated once calls are completed.'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
