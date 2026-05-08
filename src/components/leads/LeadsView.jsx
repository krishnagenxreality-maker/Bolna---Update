import React, { useMemo, useState, useEffect } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { StatusPill } from '../ui/StatusPill';
import { LEAD_CATEGORIES } from '../../utils/constants';
import { DatePicker } from '../ui/DatePicker';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  CalendarDays, PhoneCall, ListTodo, BarChart3, Users, ClipboardList, ChevronLeft, ChevronRight, Download, UserPlus, UserMinus, UserCheck, MessageSquareOff
} from 'lucide-react';

export const LeadsView = ({ 
  contacts, 
  leadsStatusTab, 
  setLeadsStatusTab, 
  searchDate, 
  setSearchDate,
  stats,
  activeView,
  setActiveView
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const ROWS_PER_PAGE = 4;

  const filteredContacts = useMemo(() => contacts.filter(c => !searchDate || c.date === searchDate), [contacts, searchDate]);
  
  // Filtering table data based on selected lead category tab
  const filteredLeads = useMemo(() => {
    return filteredContacts.filter(c => c.leadCategory === leadsStatusTab);
  }, [filteredContacts, leadsStatusTab]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchDate, leadsStatusTab]);

  const totalPages = Math.ceil(filteredLeads.length / ROWS_PER_PAGE);
  const currentRows = useMemo(() => {
    return filteredLeads.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const classificationData = useMemo(() => {
    const counts = { 'Interested': 0, 'Not Interested': 0, 'Rescheduled': 0 };
    filteredContacts.forEach(c => {
      if (c.leadCategory === 'interested') counts['Interested']++;
      else if (c.leadCategory === 'not_interested') counts['Not Interested']++;
      else if (c.leadCategory === 'reschedule') counts['Rescheduled']++;
    });
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [filteredContacts]);

  const leadsTrendData = useMemo(() => {
    const counts = {};
    contacts.filter(c => c.leadCategory === 'interested').forEach(c => {
      counts[c.date] = (counts[c.date] || 0) + 1;
    });
    return Object.keys(counts).sort().map(date => ({ date, count: counts[date] }));
  }, [contacts]);

  const COLORS = ['#4ade80', '#f87171', '#fbbf24'];

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
    { id: 'report', label: 'Report', icon: <ClipboardList size={18} /> }
  ];

  const handleDownload = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to download for this selection.");
      return;
    }

    const headers = ['Name', 'Phone Number', 'Status', 'Response', 'Category', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(c => [
        `"${c.name || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.status || ''}"`,
        `"${(c.response || '').replace(/"/g, '""')}"`,
        `"${c.leadCategory || ''}"`,
        `"${c.date || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${searchDate || 'all'}_${leadsStatusTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="leads-page-container">
      
      {/* Page Heading Section */}
      <div className="leads-header-section">
        <h1 className="leads-main-heading">Leads Section</h1>
        <p className="leads-sub-heading">
          Track customer interests, monitor engagement outcomes, and analyze lead conversion activity.
        </p>
      </div>

      <div className="leads-layout-wrapper">
        
        {/* LEFT COLUMN: Navigation & Metrics */}
        <div className="leads-left-column">
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
              <div className="metric-icon-wrap" style={{ color: '#4ade80' }}>
                <UserCheck size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">
                  {filteredContacts.filter(c => c.leadCategory === 'interested').length}
                </div>
                <div className="metric-label">Interested</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#f87171' }}>
                <UserMinus size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">
                  {filteredContacts.filter(c => c.leadCategory === 'not_interested').length}
                </div>
                <div className="metric-label">Not Interested</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#fbbf24' }}>
                <PhoneCall size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">
                  {filteredContacts.filter(c => c.leadCategory === 'reschedule').length}
                </div>
                <div className="metric-label">Reschedule</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#6366f1' }}>
                <MessageSquareOff size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">
                  {filteredContacts.filter(c => c.status === 'no answer').length}
                </div>
                <div className="metric-label">No Answer</div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Analytics */}
        <div className="leads-center-column">
          <Panel label="Lead Classification">
            <div className="panel-body" style={{ height: '200px', paddingTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {classificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTheme.tooltip} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel label="Leads Acquisition Trend">
            <div className="panel-body" style={{ height: '200px', paddingTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={chartTheme.text} fontSize={10} tickLine={false} />
                  <YAxis stroke={chartTheme.text} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTheme.tooltip} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: Leads Analysis Table */}
        <div className="leads-right-column">
          <Panel>
            <PanelHead>
              <div className="panel-label" style={{marginBottom:0}}>
                <span className="label-dot" />
                AI Lead Analysis
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
              <div className="details-tabs">
                {LEAD_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`tab-btn ${leadsStatusTab === cat.id ? 'active' : ''}`}
                    onClick={() => setLeadsStatusTab(cat.id)}
                  >
                    {cat.label}
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
                        <th>Category</th>
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
                          <td>
                            <span className={`spill s-${c.leadCategory === 'interested' ? 'done' : c.leadCategory === 'reschedule' ? 'queued' : 'pending'}`}>
                              {(c.leadCategory || 'PENDING').replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="td-phone" style={{ fontSize: '11px' }}>{c.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLeads.length === 0 && (
                    <div className="no-data" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                      No lead records found for this selection.
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
                    Showing {currentPage * ROWS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ROWS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length}
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
            
            {/* Disclaimer Section */}
            <div style={{ 
              margin: '0 20px 16px', 
              padding: '12px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.3)',
              lineHeight: '1.4'
            }}>
              "After every month the leads data will be deleted, so please make sure that you download your data. Due to security reasons, we do not store or access your data. Your data always remains with you."
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
};
