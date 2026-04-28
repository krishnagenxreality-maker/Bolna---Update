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
    stats
  } = useBolnaDashboard();

  return (
    <div className="app">
      <SmokeBackground />
      
      <Header activeView={activeView} setActiveView={setActiveView} />

      <main className="main">
        {activeView === 'manager' && (
          <>
            <ConfigPanel 
              apiKey={apiKey} 
              agentId={agentId} 
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
          />
        )}
        {activeView === 'leads' && (
          <LeadsView 
            contacts={contacts}
            leadsStatusTab={leadsStatusTab}
            setLeadsStatusTab={setLeadsStatusTab}
          />
        )}
      </main>
    </div>
  );
}
