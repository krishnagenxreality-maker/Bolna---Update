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

export default function BolnaDashboard() {
  const {
    apiKey, setApiKey,
    agentId, setAgentId,
    contacts,
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
    stats
  } = useBolnaDashboard();

  return (
    <div className="app">
      <SmokeBackground />
      
      <Header activeView={activeView} setActiveView={setActiveView} />

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
          <>
            <ConfigPanel 
              apiKey={apiKey} 
              agentId={agentId} 
              setAgentId={setAgentId}
              availableAgents={availableAgents}
            />
            
            <UploadPanel handleFile={handleFile} />

            <ContactsTable contacts={contacts} />

            <ActionBar 
              isCalling={isCalling} 
              startCalling={startCalling} 
              contactsCount={contacts.length} 
            />

            <ProgressPanel 
              showProgress={showProgress} 
              stats={stats} 
              logs={logs} 
            />

            <DoneBanner 
              showDone={showDone} 
              doneSummary={doneSummary} 
            />
          </>
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
  );
}
