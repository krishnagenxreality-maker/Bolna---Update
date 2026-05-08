import React, { useState } from 'react';
import './styles/BolnaDashboard.css';

// Hooks
import { useBolnaDashboard } from './hooks/useBolnaDashboard';

// Layout
import { Header } from './components/layout/Header';
import { SmokeBackground } from './components/layout/SmokeBackground';

// Dashboard Components
import { ConfigPanel } from './components/dashboard/ConfigPanel';
import { UploadPanel } from './components/dashboard/UploadPanel';
import { CallFlowVisualization } from './components/dashboard/CallFlowVisualization';
import { ContactsTable } from './components/dashboard/ContactsTable';
import { ActionBar } from './components/dashboard/ActionBar';
import { ProgressPanel } from './components/dashboard/ProgressPanel';
import { DoneBanner } from './components/dashboard/DoneBanner';
import { CompletionModal } from './components/dashboard/CompletionModal';

// Other Views
import { CallDetailsView } from './components/details/CallDetailsView';
import { ResponseAnalysisView } from './components/responses/ResponseAnalysisView';
import { LeadsView } from './components/leads/LeadsView';
import { CalendarDashboardView } from './components/calendar/CalendarDashboardView';
import { ReportView } from './components/report/ReportView';

import { Sidebar } from './components/layout/Sidebar';
import { Dropdown } from './components/ui/Dropdown';
import { ListTodo, BarChart, Users, ClipboardList, ArrowRight, CalendarDays, Clock, FileText } from 'lucide-react';

export default function BolnaDashboard() {
  const {
    apiKey, setApiKey,
    agentId, setAgentId,
    contacts,
    sessionContacts,
    logs,
    isCalling,
    showProgress,
    showDone, setShowDone,
    doneSummary,
    activeView, setActiveView,
    detailsStatusTab, setDetailsStatusTab,
    responseTab, setResponseTab,
    leadsStatusTab, setLeadsStatusTab,
    searchDate, setSearchDate,
    handleFile,
    startCalling,
    stopCalling,
    availableAgents,
    stats,
    credits
  } = useBolnaDashboard();

  // Local state for Call Manager scheduling UI
  const [campaignTitle, setCampaignTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState(searchDate || new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [uploadCount, setUploadCount] = useState(0);
  const [lastUploadTime, setLastUploadTime] = useState(null);
  const [isShining, setIsShining] = useState(false);

  // Wrap handleFile to track upload info
  const handleFileWithTracking = (file) => {
    handleFile(file);
    setUploadCount(prev => prev + 1);
    setLastUploadTime(new Date().toLocaleTimeString());
    setIsShining(false); // Reset shine when new file is uploaded
  };

  // Sync scheduleDate when searchDate changes (coming from calendar)
  React.useEffect(() => {
    if (searchDate) setScheduleDate(searchDate);
  }, [searchDate]);

  // Handle completion modal close
  const handleCloseModal = () => {
    setShowDone(false);
    setIsShining(true); // Start shining effect when popup closes
  };

  // Reset shining when navigating
  const handleNavClick = (id) => {
    setActiveView(id);
    setIsShining(false);
  };

  // Quick Navigation items for manager
  const managerQuickNavItems = [
    { id: 'details', label: 'Call Details', icon: <ListTodo size={20} />, color: '#3b82f6' },
    { id: 'responses', label: 'Responses', icon: <BarChart size={20} />, color: '#7dffb3' },
    { id: 'leads', label: 'Leads', icon: <Users size={20} />, color: '#f5c842' },
    { id: 'report', label: 'Report', icon: <ClipboardList size={20} />, color: '#a855f7' }
  ];

  const isFullWidthView = activeView === 'calendar' || activeView === 'manager' || activeView === 'details';

  return (
    <div className="app-container" style={{ flexDirection: 'column', gap: 0, paddingRight: 0 }}>
      <SmokeBackground />
      <Header activeView={activeView} setActiveView={setActiveView} credits={credits} />

      <CompletionModal isOpen={showDone} onClose={handleCloseModal} />

      <div style={{ display: 'flex', flex: 1, gap: isFullWidthView ? '0px' : '20px', paddingRight: isFullWidthView ? '0px' : '20px', position: 'relative', zIndex: 1 }}>
        {!isFullWidthView && (
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
        )}

        <div className="main-content" style={isFullWidthView ? { maxWidth: '100%', padding: '0 20px' } : {}}>
          <main className="main">
            {activeView === 'calendar' && (
              <CalendarDashboardView
                contacts={contacts}
                agentId={agentId}
                setAgentId={setAgentId}
                availableAgents={availableAgents}
                setSearchDate={setSearchDate}
                setActiveView={setActiveView}
              />
            )}

            {activeView === 'manager' && (
              <div className="manager-page-wrapper">
                
                {/* === LEFT PANEL: Scheduling & Control === */}
                <div className="manager-left-panel">
                  
                  {/* Campaign Title */}
                  <div className="mgr-section">
                    <label className="mgr-section-label">
                      <FileText size={14} />
                      Campaign Title
                    </label>
                    <input
                      type="text"
                      className="field-input campaign-title-input"
                      placeholder="Enter Campaign Title"
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                    />
                  </div>

                  {/* Agent Selection */}
                  <div className="mgr-section">
                    <label className="mgr-section-label">
                      <Users size={14} />
                      Select Agent
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

                  {/* Date & Time Selection */}
                  <div className="mgr-section">
                    <label className="mgr-section-label">
                      <CalendarDays size={14} />
                      Schedule Date & Time
                    </label>
                    <div className="schedule-datetime-row">
                      <div className="schedule-field">
                        <input
                          type="date"
                          className="field-input schedule-date-input"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="schedule-field">
                        <input
                          type="time"
                          className="field-input schedule-time-input"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="mgr-section">
                    <UploadPanel handleFile={handleFileWithTracking} />
                  </div>

                  {/* Uploaded Sheets Info */}
                  {uploadCount > 0 && (
                    <div className="mgr-session-info">
                      <div className="session-info-row">
                        <span className="session-info-label">Sheets Uploaded Today</span>
                        <span className="session-info-value">{uploadCount}</span>
                      </div>
                      <div className="session-info-row">
                        <span className="session-info-label">Last Upload</span>
                        <span className="session-info-value">{lastUploadTime}</span>
                      </div>
                      <div className="session-info-row">
                        <span className="session-info-label">Contacts Loaded</span>
                        <span className="session-info-value">{sessionContacts.length}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* === RIGHT PANEL: Contacts, Actions & Monitoring === */}
                <div className="manager-right-panel">
                  
                  {/* Contacts Table */}
                  <ContactsTable 
                    contacts={sessionContacts} 
                    isCalling={isCalling}
                    stopCalling={stopCalling}
                  />

                  {/* Action Row: Schedule button + Horizontal Navigation */}
                  <div className="mgr-action-row">
                    <div className="mgr-action-btn-wrap">
                      <ActionBar 
                        isCalling={isCalling} 
                        startCalling={startCalling} 
                        contactsCount={sessionContacts.length} 
                      />
                    </div>

                    <div className="mgr-nav-horizontal">
                      {managerQuickNavItems.map((item) => (
                        <button
                          key={item.id}
                          className={`mgr-nav-compact-item ${isShining ? 'shining' : ''}`}
                          onClick={() => handleNavClick(item.id)}
                          style={{ '--nav-accent': item.color }}
                        >
                          <div className="mgr-nav-compact-icon">{item.icon}</div>
                          <span className="mgr-nav-compact-label">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Journey */}
                  <CallFlowVisualization contacts={sessionContacts} agentId={agentId} isCalling={isCalling} />
                </div>
              </div>
            )}

            {activeView === 'details' && (
              <CallDetailsView 
                contacts={contacts}
                searchDate={searchDate}
                setSearchDate={setSearchDate}
                detailsStatusTab={detailsStatusTab}
                setDetailsStatusTab={setDetailsStatusTab}
                showProgress={showProgress}
                stats={stats}
                logs={logs}
                showDone={showDone}
                doneSummary={doneSummary}
                activeView={activeView}
                setActiveView={setActiveView}
              />
            )}

            {activeView === 'responses' && (
              <ResponseAnalysisView 
                contacts={contacts}
                responseTab={responseTab}
                setResponseTab={setResponseTab}
                searchDate={searchDate}
                setSearchDate={setSearchDate}
              />
            )}
            {activeView === 'leads' && (
              <LeadsView 
                contacts={contacts}
                leadsStatusTab={leadsStatusTab}
                setLeadsStatusTab={setLeadsStatusTab}
                searchDate={searchDate}
                setSearchDate={setSearchDate}
              />
            )}
            {activeView === 'report' && (
              <ReportView
                contacts={contacts}
                agentId={agentId}
                searchDate={searchDate}
                setSearchDate={setSearchDate}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

