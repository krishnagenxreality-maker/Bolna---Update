import React, { useMemo, useState, useEffect } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { DatePicker } from '../ui/DatePicker';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  CalendarDays, PhoneCall, ListTodo, BarChart3, Users, ClipboardList, ChevronLeft, ChevronRight, RotateCcw, Megaphone, PhoneIncoming 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LockedFeatureModal } from '../ui/LockedFeatureModal';

export const CallDetailsView = ({ 
  contacts, 
  searchDate, 
  setSearchDate, 
  detailsStatusTab, 
  setDetailsStatusTab,
  stats,
  activeView,
  setActiveView,
  onRetryCalls,
  isCalling
}) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedForRetry, setSelectedForRetry] = useState([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const ROWS_PER_PAGE = 7;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
    setSelectedForRetry([]);
  }, [searchDate, detailsStatusTab]);

  const filteredData = useMemo(() => {
    return contacts.filter(c => {
      const statusMatch = detailsStatusTab === 'all' || c.status === detailsStatusTab;
      const dateMatch = !searchDate || c.date === searchDate;
      return statusMatch && dateMatch;
    });
  }, [contacts, detailsStatusTab, searchDate]);

  // Contacts eligible for retry (busy or no answer)
  const retryEligible = useMemo(() => {
    return filteredData.filter(c => {
      const resp = (c.response || '').toLowerCase();
      const status = (c.status || '').toLowerCase();
      return resp.includes('no answer') || resp.includes('no_answer') || resp.includes('busy') || status === 'failed';
    });
  }, [filteredData]);

  const isRetryEligible = (contact) => {
    const resp = (contact.response || '').toLowerCase();
    const status = (contact.status || '').toLowerCase();
    return resp.includes('no answer') || resp.includes('no_answer') || resp.includes('busy') || status === 'failed';
  };

  const toggleRetrySelect = (id) => {
    setSelectedForRetry(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedForRetry.length === retryEligible.length) {
      setSelectedForRetry([]);
    } else {
      setSelectedForRetry(retryEligible.map(c => c.id));
    }
  };

  const handleRetryCalls = () => {
    if (selectedForRetry.length > 0 && onRetryCalls) {
      onRetryCalls(selectedForRetry);
      setSelectedForRetry([]);
    }
  };

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const currentRows = useMemo(() => {
    return filteredData.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  }, [filteredData, currentPage]);

  const trendData = useMemo(() => {
    const counts = {};
    contacts.forEach(c => {
      counts[c.date] = (counts[c.date] || 0) + 1;
    });
    return Object.keys(counts).sort().map(date => ({ date, count: counts[date] }));
  }, [contacts]);

  const statusData = useMemo(() => {
    const counts = { completed: 0, failed: 0, busy: 0, 'no answer': 0 };
    filteredData.forEach(c => {
      const s = c.status?.toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      else if (s === 'called') counts.completed++;
    });
    return Object.keys(counts).map(status => ({ 
      status: status.charAt(0).toUpperCase() + status.slice(1), 
      count: counts[status] 
    }));
  }, [filteredData]);

  const chartTheme = {
    text: 'rgba(255,255,255,0.5)',
    grid: 'rgba(255,255,255,0.05)',
    tooltip: {
      contentStyle: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' },
      itemStyle: { color: '#fff' }
    }
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
        <h1 className="details-main-heading">Call Details Section</h1>
        <p className="details-sub-heading">
          Monitor call records, track call activity trends, analyze statuses, and review detailed call information.
        </p>
      </div>

      <div className="details-layout-wrapper" style={{ display: 'flex', gridTemplateColumns: 'none', height: 'auto', overflow: 'visible' }}>
        
        {/* LEFT COLUMN: Navigation Grid */}
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

          {/* 2x2 Metrics Snapshot Section */}
          <div className="details-metrics-grid">
            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#6366f1' }}>
                <PhoneCall size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{stats?.totalCalls || contacts.length}</div>
                <div className="metric-label">Total Calls</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#10b981' }}>
                <PhoneCall size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{stats?.connected || contacts.filter(c => c.status === 'called').length}</div>
                <div className="metric-label">Connected</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#f43f5e' }}>
                <PhoneCall size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{stats?.failed || contacts.filter(c => c.status === 'failed').length}</div>
                <div className="metric-label">Failed</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#8b5cf6' }}>
                <Users size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{stats?.leadsCount || 0}</div>
                <div className="metric-label">Leads</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT: Table and Graphs */}
        <div className="details-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* CENTERED TABLE SECTION */}
          <div className="details-table-section" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <Panel>
              <PanelHead>
                <div className="panel-label" style={{marginBottom:0}}>
                  <span className="label-dot" />
                  Call Details Search
                </div>
                <DatePicker value={searchDate} onChange={setSearchDate} />
              </PanelHead>

              <div className="panel-body">
                <div className="details-tabs">
                  {['all', 'called', 'failed'].map(tab => (
                    <button
                      key={tab}
                      className={`tab-btn ${detailsStatusTab === tab ? 'active' : ''}`}
                      onClick={() => setDetailsStatusTab(tab)}
                    >
                      {tab === 'all' ? 'All Records' : tab === 'called' ? 'Called' : 'Failed'}
                    </button>
                  ))}
                </div>

                {/* Retry Controls */}
                {retryEligible.length > 0 && onRetryCalls && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', marginBottom: '8px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedForRetry.length === retryEligible.length && retryEligible.length > 0}
                        onChange={toggleSelectAll}
                        style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        {selectedForRetry.length > 0 
                          ? `${selectedForRetry.length} selected` 
                          : `${retryEligible.length} retry-eligible (Busy/No Answer)`}
                      </span>
                    </div>
                    {selectedForRetry.length > 0 && (
                      <button
                        onClick={() => {
                          if (user?.selectedPlan === 'Starter') {
                            setShowLockModal(true);
                            return;
                          }
                          handleRetryCalls();
                        }}
                        disabled={isCalling}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 14px', borderRadius: '6px',
                          background: isCalling ? 'rgba(255,255,255,0.05)' : (user?.selectedPlan === 'Starter' ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))'),
                          border: isCalling ? '1px solid rgba(255,255,255,0.1)' : (user?.selectedPlan === 'Starter' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(59, 130, 246, 0.3)'),
                          color: isCalling ? 'rgba(255,255,255,0.3)' : (user?.selectedPlan === 'Starter' ? 'rgba(255,255,255,0.2)' : '#60a5fa'),
                          cursor: (isCalling || user?.selectedPlan === 'Starter') ? 'not-allowed' : 'pointer',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: '11px', fontWeight: 700,
                          transition: 'all 0.2s',
                          filter: user?.selectedPlan === 'Starter' ? 'grayscale(1)' : 'none'
                        }}
                      >
                        <RotateCcw size={12} />
                        {user?.selectedPlan === 'Starter' ? 'Retry Locked (Starter)' : `Make Calls (${selectedForRetry.length})`}
                      </button>
                    )}
                  </div>
                )}

                <div className="details-table-scroll-container" style={{ flex: '0 0 auto', maxHeight: 'none' }}>
                  <div className="table-wrap">
                    <table className="ct">
                      <thead>
                        <tr>
                          {retryEligible.length > 0 && <th style={{ width: '30px' }}></th>}
                          <th>#</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Response</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRows.map((c, i) => (
                          <tr key={c.id}>
                            {retryEligible.length > 0 && (
                              <td style={{ textAlign: 'center' }}>
                                {isRetryEligible(c) && (
                                  <input
                                    type="checkbox"
                                    checked={selectedForRetry.includes(c.id)}
                                    onChange={() => toggleRetrySelect(c.id)}
                                    style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                                  />
                                )}
                              </td>
                            )}
                            <td className="td-num">{currentPage * ROWS_PER_PAGE + i + 1}</td>
                            <td className="td-name">{c.name}</td>
                            <td className="td-phone">{c.phone}</td>
                            <td>
                              <StatusPill status={c.status} />
                            </td>
                            <td className="td-response">{c.response || "-"}</td>
                            <td className="td-phone" style={{ fontSize: '11px' }}>{c.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredData.length === 0 && (
                      <div className="no-data" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        No records found for the selected criteria.
                      </div>
                    )}
                  </div>
                </div>

                {/* Pagination Controls */}
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
                          padding: '6px', 
                          borderRadius: '6px', 
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
                          padding: '6px', 
                          borderRadius: '6px', 
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

          {/* GRAPHS SECTION BELOW TABLE */}
          <div className="details-graphs-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <Panel label="Calling Activity Trend">
              <div className="panel-body" style={{ height: '200px', paddingTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="date" stroke={chartTheme.text} fontSize={10} tickLine={false} />
                    <YAxis stroke={chartTheme.text} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip {...chartTheme.tooltip} />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel label="Status Breakdown">
              <div className="panel-body" style={{ height: '200px', paddingTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="status" stroke={chartTheme.text} fontSize={10} tickLine={false} />
                    <YAxis stroke={chartTheme.text} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip {...chartTheme.tooltip} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={index % 2 === 0 ? '#8b5cf6' : '#ec4899'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
      </div>
      <LockedFeatureModal 
        isOpen={showLockModal} 
        onClose={() => setShowLockModal(false)} 
        featureName="AI Retry Calling" 
        planRequired="Growth" 
      />
    </div>
  );
};
