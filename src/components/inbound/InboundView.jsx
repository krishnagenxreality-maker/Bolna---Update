import React, { useMemo, useState, useEffect } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { DatePicker } from '../ui/DatePicker';
import { 
  PhoneIncoming, ListTodo, BarChart3, Users, ClipboardList, ChevronLeft, ChevronRight, RefreshCw, CalendarDays, PhoneCall, Megaphone
} from 'lucide-react';

export const InboundView = ({ 
  inboundCalls, 
  isLoading, 
  onRefresh, 
  activeView, 
  setActiveView 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchDate, setSearchDate] = useState('');
  const ROWS_PER_PAGE = 7;

  // Refresh on mount if empty
  useEffect(() => {
    if (inboundCalls.length === 0 && onRefresh) {
      onRefresh();
    }
  }, []);

  // Filter by date
  const filteredData = useMemo(() => {
    return inboundCalls.filter(c => {
      if (!searchDate) return true;
      const callDate = new Date(c.created_at).toISOString().split('T')[0];
      return callDate === searchDate;
    });
  }, [inboundCalls, searchDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchDate]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const currentRows = useMemo(() => {
    return filteredData.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  }, [filteredData, currentPage]);

  const getReason = (call) => {
    if (call.summary) {
      const words = call.summary.split(' ').filter(w => w.length > 0);
      if (words.length >= 2) return `${words[0]} ${words[1]}`;
      return call.summary.slice(0, 20);
    }
    return "Inbound Call";
  };

  const navItems = [
    { id: 'calendar', label: 'Dashboard', icon: <CalendarDays size={18} /> },
    { id: 'manager', label: 'Call Manager', icon: <PhoneCall size={18} /> },
    { id: 'details', label: 'Call Details', icon: <ListTodo size={18} /> },
    { id: 'responses', label: 'Responses', icon: <BarChart3 size={18} /> },
    { id: 'leads', label: 'Leads', icon: <Users size={18} /> },
    { id: 'inbound', label: 'Inbound', icon: <PhoneIncoming size={18} /> },
    { id: 'campaign', label: 'Campaign', icon: <Megaphone size={18} /> },
    { id: 'report', label: 'Report', icon: <ClipboardList size={18} /> }
  ];

  return (
    <div className="details-page-container">
      
      {/* Page Heading Section */}
      <div className="details-header-section">
        <h1 className="details-main-heading">Inbound Calls</h1>
        <p className="details-sub-heading">
          Track and monitor all incoming calls. Review agent assignments, call dates, and concise reasoning for each interaction.
        </p>
      </div>

      <div className="details-layout-wrapper" style={{ display: 'flex', gridTemplateColumns: 'none', height: 'auto', overflow: 'visible' }}>
        
        {/* LEFT COLUMN: Navigation Matrix */}
        <div className="details-left-column" style={{ width: '280px', flexShrink: 0 }}>
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

          {/* Metrics Snapshot */}
          <div className="details-metrics-grid">
            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#3b82f6' }}>
                <PhoneIncoming size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{inboundCalls.length}</div>
                <div className="metric-label">Total Inbound</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT: Table */}
        <div className="details-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          <div className="details-table-section" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <Panel>
              <PanelHead>
                <div className="panel-label" style={{marginBottom:0}}>
                  <span className="label-dot" />
                  Inbound Call Log
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="nav-btn"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: isLoading ? 0.5 : 1
                    }}
                  >
                    <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} /> 
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <DatePicker value={searchDate} onChange={setSearchDate} />
                </div>
              </PanelHead>

              <div className="panel-body">
                <div className="details-table-scroll-container" style={{ flex: '0 0 auto', maxHeight: 'none' }}>
                  <div className="table-wrap">
                    <table className="ct">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Phone Number</th>
                          <th>Agent Name</th>
                          <th>Date</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRows.map((c, i) => (
                          <tr key={c.execution_id || i}>
                            <td className="td-num">{currentPage * ROWS_PER_PAGE + i + 1}</td>
                            <td className="td-name">{c.recipient_name || 'Anonymous'}</td>
                            <td className="td-phone">{c.recipient_phone_number}</td>
                            <td className="td-name" style={{ fontSize: '12px', opacity: 0.8 }}>
                              {c.agent_name || c.agent_id?.slice(0, 8) || 'N/A'}
                            </td>
                            <td className="td-phone" style={{ fontSize: '11px' }}>
                              {new Date(c.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <span className="spill s-blue" style={{ fontSize: '10px' }}>
                                {getReason(c)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredData.length === 0 && !isLoading && (
                      <div className="no-data" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        No inbound calls found.
                      </div>
                    )}
                    {isLoading && filteredData.length === 0 && (
                      <div className="no-data" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        Fetching inbound data...
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginTop: '12px',
                    padding: '0 4px 12px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                      Showing {currentPage * ROWS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ROWS_PER_PAGE, filteredData.length)} of {filteredData.length}
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
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
};
