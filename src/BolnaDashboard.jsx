import React, { useState } from 'react';
import './styles/BolnaDashboard.css';

// Hooks
import { useBolnaDashboard } from './hooks/useBolnaDashboard';
import { useAuth } from './context/AuthContext';

// Layout
import { Header } from './components/layout/Header';
import { SmokeBackground } from './components/layout/SmokeBackground';
import { LockedFeatureModal } from './components/ui/LockedFeatureModal';
import { TutorialProvider } from './context/TutorialContext';
import { TutorialTooltip } from './components/ui/TutorialTooltip';
import axios from 'axios';

// Dashboard Components
import { ConfigPanel } from './components/dashboard/ConfigPanel';
import { UploadPanel } from './components/dashboard/UploadPanel';
import { CallFlowVisualization } from './components/dashboard/CallFlowVisualization';
import { ContactsTable } from './components/dashboard/ContactsTable';
import { ActionBar } from './components/dashboard/ActionBar';
import { ProgressPanel } from './components/dashboard/ProgressPanel';
import { DoneBanner } from './components/dashboard/DoneBanner';
import { CompletionModal } from './components/dashboard/CompletionModal';
import { AgentScriptPanel } from './components/dashboard/AgentScriptPanel';
import { CreateAgentModal } from './components/dashboard/CreateAgentModal';

// Other Views
import { CallDetailsView } from './components/details/CallDetailsView';
import { ResponseAnalysisView } from './components/responses/ResponseAnalysisView';
import { LeadsView } from './components/leads/LeadsView';
import { CalendarDashboardView } from './components/calendar/CalendarDashboardView';
import { ReportView } from './components/report/ReportView';
import { CampaignView } from './components/campaign/CampaignView';
import { InboundView } from './components/inbound/InboundView';

import { Sidebar } from './components/layout/Sidebar';
import { Dropdown } from './components/ui/Dropdown';
import { DatePicker } from './components/ui/DatePicker';
import { TimePicker } from './components/ui/TimePicker';
import { ListTodo, BarChart, Users, ClipboardList, ArrowRight, CalendarDays, Clock, FileText, Megaphone, PhoneIncoming } from 'lucide-react';

export default function BolnaDashboard() {
  const { user } = useAuth();
  const {
    apiKey, setApiKey,
    agentId, setAgentId,
    allContacts,
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
    credits,
    scheduledJobs,
    campaigns,
    deleteScheduledJob,
    callStartTime,
    addCustomAgent,
    retryCalls,
    setAvailableAgents,
    inboundCalls,
    refreshInbound,
    isLoadingInbound
  } = useBolnaDashboard();

  // Local state for Call Manager scheduling UI
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockFeatureName, setLockFeatureName] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
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

  const managerQuickNavItems = [
    { id: 'details', label: 'Call Details', icon: <ListTodo size={20} />, color: '#3b82f6' },
    { id: 'responses', label: 'Responses', icon: <BarChart size={20} />, color: '#7dffb3' },
    { id: 'leads', label: 'Leads', icon: <Users size={20} />, color: '#f5c842' },
    { id: 'campaign', label: 'Campaign', icon: <Megaphone size={20} />, color: '#ec4899' },
    { id: 'inbound', label: 'Inbound', icon: <PhoneIncoming size={20} />, color: '#60a5fa' },
    { id: 'report', label: 'Report', icon: <ClipboardList size={20} />, color: '#a855f7' }
  ];

  const isFullWidthView = activeView === 'calendar' || activeView === 'manager' || activeView === 'details' || activeView === 'responses' || activeView === 'leads' || activeView === 'campaign' || activeView === 'report' || activeView === 'inbound';

  return (
    <TutorialProvider activeView={activeView} user={user}>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: 0, paddingRight: 0 }}>
        <SmokeBackground />
        <Header activeView={activeView} setActiveView={setActiveView} credits={credits} />

        <CompletionModal isOpen={showDone} onClose={handleCloseModal} />
        <TutorialTooltip />

        <div style={{ display: 'flex', flex: 1, gap: isFullWidthView ? '0px' : '20px', paddingRight: isFullWidthView ? '0px' : '20px', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          {!isFullWidthView && (
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
          )}

          <div className="main-content" style={isFullWidthView ? { maxWidth: '100%', flex: 1, padding: '0 20px', overflow: 'auto' } : { flex: 1, overflow: 'auto' }}>
            <main className="main" style={{ width: '100%' }}>
              {activeView === 'calendar' && (
                <CalendarDashboardView
                  contacts={allContacts}
                  inboundCalls={inboundCalls}
                  agentId={agentId}
                  setAgentId={setAgentId}
                  availableAgents={availableAgents}
                  setSearchDate={setSearchDate}
                  setActiveView={setActiveView}
                />
              )}

              {activeView === 'manager' && (
                <>
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
                      <div className="mgr-section agent-selector-wrapper">
                        <label className="mgr-section-label">
                          <Users size={14} />
                          Select Agent
                        </label>
                        {availableAgents.length > 0 ? (
                          <Dropdown
                            value={agentId}
                            onChange={(val) => {
                              if (val === '__other__') {
                                setShowCreateAgentModal(true);
                              } else {
                                setAgentId(val);
                              }
                            }}
                            options={[
                              ...availableAgents.map(agent => ({
                                label: agent.name,
                                value: `${agent.name}::${agent.id}`
                              })),
                              { label: '＋ Other (Create Agent)', value: '__other__' }
                            ]}
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
                            {availableAgents.length === 1 ? availableAgents[0].name : (agentId ? String(agentId).split('::')[0] : 'Not configured')}
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
                          <div className="schedule-field" style={{ flex: 1 }}>
                            <DatePicker 
                              value={scheduleDate} 
                              onChange={(val) => setScheduleDate(val)}
                              placeholder="Select date"
                            />
                          </div>
                          <div className="schedule-field" style={{ width: '120px' }}>
                            <TimePicker 
                              value={scheduleTime} 
                              onChange={(val) => setScheduleTime(val)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Upload Section */}
                      <div className="mgr-section file-upload-section">
                        <UploadPanel handleFile={handleFileWithTracking} />
                      </div>

                      {/* Agent Script Panel */}
                      <AgentScriptPanel agentId={agentId} apiKey={apiKey} availableAgents={availableAgents} />

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
                        <div className="mgr-action-btn-wrap schedule-section">
                           <ActionBar 
                            isCalling={isCalling} 
                            startCalling={() => {
                              if (credits <= 0) {
                                setLockFeatureName('Outreach Credits');
                                setShowLockModal(true);
                                return;
                              }
                              startCalling(campaignTitle, scheduleDate, scheduleTime);
                            }} 
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

                      <CallFlowVisualization contacts={sessionContacts} agentId={agentId} isCalling={isCalling} callStartTime={callStartTime} />
                    </div>
                  </div>

                {/* Scheduled Calls Section - FULL WIDTH BELOW PANELS */}
                {scheduledJobs && scheduledJobs.filter(j => j.status === 'Scheduled').length > 0 && (
                  <div className="mgr-scheduled-section-full">
                      <h3 className="mgr-section-title">
                        <Clock size={18} />
                        Scheduled Calls
                      </h3>
                      <div className="scheduled-jobs-list">
                        {scheduledJobs.filter(j => j.status === 'Scheduled').map((job) => (
                          <div key={job.id} className="scheduled-job-card">
                            <div className="job-card-main">
                              <div className="job-info">
                                <span className="job-campaign">{job.campaignTitle}</span>
                                <span className="job-agent">{job.agentName}</span>
                              </div>
                              <div className="job-timing">
                                <div className="job-date">
                                  <CalendarDays size={12} />
                                  {new Date(job.scheduledAt).toLocaleDateString()}
                                </div>
                                <div className="job-time">
                                  <Clock size={12} />
                                  {new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className={`job-status status-${job.status.toLowerCase()}`}>
                                {job.status}
                              </div>
                              {job.status === 'Scheduled' && (
                                <button 
                                  className="job-cancel-btn"
                                  onClick={() => deleteScheduledJob(job.id)}
                                  title="Cancel Schedule"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeView === 'details' && (
                <CallDetailsView 
                  contacts={allContacts}
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
                  onRetryCalls={retryCalls}
                  isCalling={isCalling}
                />
              )}

              {activeView === 'responses' && (
                <ResponseAnalysisView 
                  contacts={allContacts}
                  responseTab={responseTab}
                  setResponseTab={setResponseTab}
                  searchDate={searchDate}
                  setSearchDate={setSearchDate}
                  stats={stats}
                  activeView={activeView}
                  setActiveView={setActiveView}
                  onRetryCalls={retryCalls}
                  isCalling={isCalling}
                />
              )}

              {activeView === 'leads' && (
                <LeadsView 
                  contacts={allContacts}
                  searchDate={searchDate}
                  setSearchDate={setSearchDate}
                  stats={stats}
                  activeView={activeView}
                  setActiveView={setActiveView}
                  apiKey={apiKey}
                />
              )}

              {activeView === 'campaign' && (
                <CampaignView
                  contacts={allContacts}
                  campaigns={campaigns}
                  searchDate={searchDate}
                  setSearchDate={setSearchDate}
                  agentId={agentId}
                  activeView={activeView}
                  setActiveView={setActiveView}
                />
              )}

              {activeView === 'inbound' && (
                <InboundView
                  inboundCalls={inboundCalls}
                  isLoading={isLoadingInbound}
                  onRefresh={refreshInbound}
                  activeView={activeView}
                  setActiveView={setActiveView}
                />
              )}
              {activeView === 'report' && (
                <ReportView
                  contacts={allContacts}
                  agentId={agentId}
                  searchDate={searchDate}
                  setSearchDate={setSearchDate}
                  stats={stats}
                  activeView={activeView}
                  setActiveView={setActiveView}
                />
              )}
            </main>
          </div>
        </div>

        {/* Create Agent Modal */}
        <CreateAgentModal
          isOpen={showCreateAgentModal}
          onClose={() => setShowCreateAgentModal(false)}
          apiKey={apiKey}
          onAgentCreated={addCustomAgent}
        />
        <LockedFeatureModal 
          isOpen={showLockModal} 
          onClose={() => setShowLockModal(false)} 
          featureName={lockFeatureName} 
          planRequired="Growth" 
        />
      </div>
    </TutorialProvider>
  );
}
