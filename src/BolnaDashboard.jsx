import React from 'react';
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

// Other Views
import { CallDetailsView } from './components/details/CallDetailsView';
import { ResponseAnalysisView } from './components/responses/ResponseAnalysisView';
import { LeadsView } from './components/leads/LeadsView';
import { CalendarDashboardView } from './components/calendar/CalendarDashboardView';
import { ReportView } from './components/report/ReportView';

import { Sidebar } from './components/layout/Sidebar';

export default function BolnaDashboard() {
  const {
    apiKey, setApiKey,
    agentId, setAgentId,
    contacts,
    sessionContacts,
    logs,
    isCalling,
    showProgress,
    showDone,
    doneSummary,
    activeView, setActiveView,
    detailsStatusTab, setDetailsStatusTab,
    responseTab, setResponseTab,
    leadsStatusTab, setLeadsStatusTab,
    searchDate, setSearchDate,
    handleFile,
    startCalling,
    availableAgents,
    stats,
    credits
  } = useBolnaDashboard();

  return (
    <div className="app-container" style={{ flexDirection: 'column', gap: 0, paddingRight: 0 }}>
      <SmokeBackground />
      <Header activeView={activeView} setActiveView={setActiveView} credits={credits} />

      <div style={{ display: 'flex', flex: 1, gap: '20px', paddingRight: '20px', position: 'relative', zIndex: 1 }}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        <div className="main-content">
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
              <div className="manager-container">
                <div className="manager-top-grid">
                  <div className="manager-left-col">
                    <ConfigPanel 
                      apiKey={apiKey} 
                      agentId={agentId} 
                      setAgentId={setAgentId}
                      availableAgents={availableAgents}
                    />
                    <UploadPanel handleFile={handleFile} />
                  </div>
                  
                  <div className="manager-right-col">
                    <ContactsTable contacts={sessionContacts} />
                    <ActionBar 
                      isCalling={isCalling} 
                      startCalling={startCalling} 
                      contactsCount={sessionContacts.length} 
                    />
                  </div>
                </div>
                
                <div className="manager-flow-section">
                  <CallFlowVisualization contacts={sessionContacts} agentId={agentId} isCalling={isCalling} />
                </div>

                <div className="manager-bottom-section">
                  <ProgressPanel 
                    showProgress={showProgress} 
                    stats={stats} 
                    logs={logs} 
                  />

                  <DoneBanner 
                    showDone={showDone} 
                    doneSummary={doneSummary} 
                  />
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
