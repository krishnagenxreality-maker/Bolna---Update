import React, { useMemo, useState, useEffect } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { DatePicker } from '../ui/DatePicker';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  CalendarDays, PhoneCall, ListTodo, BarChart3, Users, ClipboardList, ChevronLeft, ChevronRight, Megaphone 
} from 'lucide-react';

export const ResponseAnalysisView = ({ 
  contacts, 
  responseTab, 
  setResponseTab, 
  searchDate, 
  setSearchDate,
  stats,
  activeView,
  setActiveView
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 4;

  const filteredContacts = useMemo(() => contacts.filter(c => !searchDate || c.date === searchDate), [contacts, searchDate]);
  const uniqueResponses = useMemo(() => Array.from(new Set(filteredContacts.map(c => c.response).filter(r => r))).sort(), [filteredContacts]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchDate, responseTab]);

  const currentTableData = useMemo(() => {
    return filteredContacts.filter(c => !responseTab || c.response === responseTab);
  }, [filteredContacts, responseTab]);

  const totalPages = Math.ceil(currentTableData.length / ROWS_PER_PAGE);
  const currentRows = useMemo(() => {
    return currentTableData.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  }, [currentTableData, currentPage]);

  const distributionData = useMemo(() => {
    const counts = { 'Interested': 0, 'Not Interested': 0, 'Reschedule': 0, 'No Response': 0 };
    filteredContacts.forEach(c => {
      const cat = c.leadCategory || c.classification || 'No Response';
      const key = cat.includes('Not') ? 'Not Interested' : cat.includes('Reschedule') ? 'Reschedule' : cat.includes('Interested') ? 'Interested' : 'No Response';
      counts[key]++;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [filteredContacts]);

  const responseCountData = useMemo(() => {
    const counts = {};
    filteredContacts.forEach(c => {
      if (c.response) counts[c.response] = (counts[c.response] || 0) + 1;
    });
    return Object.keys(counts).map(resp => ({ name: resp, count: counts[resp] }));
  }, [filteredContacts]);

  const COLORS = ['#4ade80', '#f87171', '#fbbf24', '#60a5fa'];

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
    { id: 'campaign', label: 'Campaign', icon: <Megaphone size={18} /> },
    { id: 'report', label: 'Report', icon: <ClipboardList size={18} /> }
  ];

  return (
    <div className="responses-page-container">
      
      {/* Page Heading Section */}
      <div className="responses-header-section">
        <h1 className="responses-main-heading">Responses Section</h1>
        <p className="responses-sub-heading">
          Track customer responses, analyze engagement outcomes, and monitor response activity trends.
        </p>
      </div>

      <div className="responses-layout-wrapper">
        
        {/* LEFT COLUMN: Navigation & Metrics */}
        <div className="responses-left-column">
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
                <div className="metric-label">Completed</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#fbbf24' }}>
                <PhoneCall size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{contacts.filter(c => c.status === 'busy').length}</div>
                <div className="metric-label">Busy</div>
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

        {/* CENTER COLUMN: Analytics */}
        <div className="responses-center-column">
          <Panel label="Response Distribution">
            <div className="panel-body" style={{ height: '200px', paddingTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTheme.tooltip} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel label="Detailed Response Count">
            <div className="panel-body" style={{ height: '200px', paddingTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseCountData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" stroke={chartTheme.text} fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke={chartTheme.text} fontSize={10} width={80} tickLine={false} />
                  <Tooltip {...chartTheme.tooltip} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: Table Analysis */}
        <div className="responses-right-column">
          <Panel>
            <PanelHead>
              <div className="panel-label" style={{marginBottom:0}}>
                <span className="label-dot" />
                Response Analysis Table
              </div>
              <DatePicker value={searchDate} onChange={setSearchDate} />
            </PanelHead>

            <div className="panel-body">
              <div className="details-tabs">
                <button
                  className={`tab-btn ${!responseTab ? 'active' : ''}`}
                  onClick={() => setResponseTab(null)}
                >
                  ALL RECORDS
                </button>
                {uniqueResponses.map(resp => (
                  <button
                    key={resp}
                    className={`tab-btn ${responseTab === resp ? 'active' : ''}`}
                    onClick={() => setResponseTab(resp)}
                  >
                    {resp.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="details-table-scroll-container" style={{ flex: '0 0 auto', maxHeight: 'none' }}>
                <div className="table-wrap">
                  <table className="ct">
                    <thead>
                      <tr>
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
                  {currentTableData.length === 0 && (
                    <div className="no-data" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                      No response records found for the selected criteria.
                    </div>
                  )}
                </div>
              </div>

              {/* Flex spacer to push pagination to the bottom */}
              <div style={{ flex: 1 }} />

              {/* Pagination Controls - Aligned to bottom */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginTop: '0px',
                  padding: '12px 4px 4px'
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                    Showing {currentPage * ROWS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ROWS_PER_PAGE, currentTableData.length)} of {currentTableData.length}
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

      </div>
    </div>
  );
};

