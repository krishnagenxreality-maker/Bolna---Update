import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { DatePicker } from '../ui/DatePicker';
import { Dropdown } from '../ui/Dropdown';
import { fetchExecutionStatus } from '../../services/api';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  CalendarDays, PhoneCall, ListTodo, BarChart3, Users, ClipboardList, ChevronLeft, ChevronRight, Download, 
  Tag, Layers, CheckCircle2, PhoneOff, X, Play, FileText, Mic, Megaphone, PhoneIncoming
} from 'lucide-react';
import { normalizeDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export const LeadsView = ({ 
  contacts, 
  searchDate, 
  setSearchDate,
  stats,
  activeView,
  setActiveView,
  apiKey
}) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalData, setModalData] = useState(null);
  const [loadingRecording, setLoadingRecording] = useState(false);
  const ROWS_PER_PAGE = 7;

  const [dbContacts, setDbContacts] = useState([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Fetch persisted records directly from Supabase on mount/refresh/login
  useEffect(() => {
    if (!user || !user.userId) return;
    let isMounted = true;
    const fetchPersisted = async () => {
      setLoadingDb(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`);
        if (res.data && isMounted) {
          setDbContacts(res.data);
        }
      } catch (err) {
        console.error("[LeadsView] Failed to fetch persisted contacts:", err);
      } finally {
        if (isMounted) setLoadingDb(false);
      }
    };
    fetchPersisted();
    return () => { isMounted = false; };
  }, [user]);

  // Combine database records with live session updates
  const combinedContacts = useMemo(() => {
    const map = new Map(dbContacts.map(c => [c.id, c]));
    if (contacts && contacts.length > 0) {
      contacts.forEach(c => {
        map.set(c.id, c);
      });
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [dbContacts, contacts]);

  // Filter by date
  const filteredContacts = useMemo(() => {
    const targetSearchDate = normalizeDate(searchDate);
    return combinedContacts.filter(c => 
      !targetSearchDate || 
      normalizeDate(c.date) === targetSearchDate || 
      normalizeDate(c.createdAt) === targetSearchDate
    );
  }, [combinedContacts, searchDate]);

  
  // Get all contacts that are successfully called (completed)
  const categorizedContacts = useMemo(() => {
    return filteredContacts.filter(c => c.status === 'called' || c.status === 'completed' || (c.leadCategory && c.leadCategory !== ''));
  }, [filteredContacts]);

  // Dynamic unique categories
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    categorizedContacts.forEach(c => {
      if (c.leadCategory) cats.add(c.leadCategory);
    });
    return Array.from(cats).sort();
  }, [categorizedContacts]);

  const categoryOptions = useMemo(() => {
    return [
      { value: "", label: "All Categories" },
      ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
    ];
  }, [uniqueCategories]);

  // Filter by selected category
  const filteredLeads = useMemo(() => {
    if (!selectedCategory) return categorizedContacts;
    return categorizedContacts.filter(c => c.leadCategory === selectedCategory);
  }, [categorizedContacts, selectedCategory]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchDate, selectedCategory]);

  const totalPages = Math.ceil(filteredLeads.length / ROWS_PER_PAGE);
  const currentRows = useMemo(() => {
    return filteredLeads.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  // Dynamic category distribution for pie chart
  const classificationData = useMemo(() => {
    const counts = {};
    categorizedContacts.forEach(c => {
      if (c.leadCategory) {
        counts[c.leadCategory] = (counts[c.leadCategory] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .map(name => ({ name, value: counts[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 for chart readability
  }, [categorizedContacts]);

  // Leads per day trend
  const leadsTrendData = useMemo(() => {
    const counts = {};
    combinedContacts.filter(c => c.leadCategory && c.leadCategory !== '').forEach(c => {
      const d = normalizeDate(c.date) || normalizeDate(c.createdAt);
      if (d) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return Object.keys(counts).sort().slice(-7).map(date => ({ date, count: counts[date] }));
  }, [combinedContacts]);

  // Dynamic color palette for pie chart
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

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

  // Handle category click — open modal
  const handleCategoryClick = useCallback(async (contact) => {
    setModalData({
      name: contact.name,
      phone: contact.phone,
      category: contact.leadCategory,
      summary: contact.summary || 'No summary available.',
      recordingUrl: contact.recordingUrl || null,
      loading: false
    });

    // If no recording URL stored but we have executionId and apiKey, try fetching
    if (!contact.recordingUrl && contact.executionId && apiKey) {
      setLoadingRecording(true);
      try {
        const data = await fetchExecutionStatus(apiKey, contact.executionId);
        if (data && data.telephony_data && data.telephony_data.recording_url) {
          setModalData(prev => prev ? { ...prev, recordingUrl: data.telephony_data.recording_url } : prev);
        }
      } catch (e) {
        console.error('Failed to fetch recording:', e);
      }
      setLoadingRecording(false);
    }
  }, [apiKey]);

  const closeModal = () => setModalData(null);

  const handleDownload = () => {
    if (filteredLeads.length === 0) {
      alert("No leads to download for this selection.");
      return;
    }

    const headers = ['Name', 'Phone Number', 'Category', 'Summary', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(c => [
        `"${c.name || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.leadCategory || ''}"`,
        `"${(c.summary || '').replace(/"/g, '""')}"`,
        `"${c.date || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${searchDate || 'all'}${selectedCategory ? '_' + selectedCategory.replace(/\s+/g, '_') : ''}.csv`);
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
          AI-powered call categorization with dynamic filtering. Click any category to view full details and recordings.
        </p>
      </div>

      <div className="leads-layout-wrapper" style={{ display: 'flex', gridTemplateColumns: 'none', height: 'auto', overflow: 'visible' }}>
        
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
                <Tag size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{categorizedContacts.length}</div>
                <div className="metric-label">Total Leads</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#3b82f6' }}>
                <Layers size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{uniqueCategories.length}</div>
                <div className="metric-label">Categories</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#10b981' }}>
                <CheckCircle2 size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{filteredContacts.filter(c => c.status === 'called' || c.status === 'completed').length}</div>
                <div className="metric-label">Completed</div>
              </div>
            </div>

            <div className="mini-metric-card">
              <div className="metric-icon-wrap" style={{ color: '#f59e0b' }}>
                <PhoneOff size={14} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{filteredContacts.filter(c => c.status === 'no answer').length}</div>
                <div className="metric-label">No Answer</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT: Table and Graphs */}
        <div className="leads-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* CENTERED TABLE SECTION */}
          <div className="leads-table-section" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
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
                <div className="leads-filter-bar">
                  <div className="leads-filter-dropdown-wrap">
                    <Tag size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    <Dropdown
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      options={categoryOptions}
                      placeholder="All Categories"
                    />
                  </div>
                  {selectedCategory && (
                    <button 
                      className="leads-filter-clear"
                      onClick={() => setSelectedCategory('')}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>

                <div className="details-table-scroll-container" style={{ flex: '0 0 auto', maxHeight: 'none' }}>
                  <div className="table-wrap">
                    <table className="ct">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Phone</th>
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
                              <span 
                                className="category-cell-clickable lead-category-badge"
                                onClick={() => handleCategoryClick(c)}
                                title="Click to view details"
                              >
                                {c.leadCategory || 'PENDING'}
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

          {/* GRAPHS SECTION BELOW TABLE */}
          <div className="leads-graphs-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <Panel label="Category Distribution">
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

            <Panel label="Lead Volume Trend">
              <div className="panel-body" style={{ height: '200px', paddingTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="date" stroke={chartTheme.text} fontSize={10} tickLine={false} />
                    <YAxis stroke={chartTheme.text} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip {...chartTheme.tooltip} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
      </div>


      {/* Category Detail Modal */}
      {modalData && (
        <div className="category-detail-overlay" onClick={closeModal}>
          <div className="category-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="category-modal-close" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="category-modal-header">
              <div className="category-modal-icon">
                <Tag size={24} />
              </div>
              <div>
                <h2 className="category-modal-title">{modalData.category}</h2>
                <p className="category-modal-contact">{modalData.name} • {modalData.phone}</p>
              </div>
            </div>

            <div className="category-modal-section">
              <div className="category-modal-section-label">
                <FileText size={14} />
                Full Call Summary
              </div>
              <div className="category-summary-block">
                {modalData.summary}
              </div>
            </div>

            <div className="category-modal-section">
              <div className="category-modal-section-label">
                <Mic size={14} />
                Voice Recording
              </div>
              <div className="category-audio-player">
                {loadingRecording ? (
                  <div className="audio-loading">
                    <div className="audio-loading-spinner" />
                    <span>Loading recording...</span>
                  </div>
                ) : modalData.recordingUrl ? (
                  <audio 
                    controls 
                    src={modalData.recordingUrl} 
                    className="audio-element"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <div className="audio-unavailable">
                    <PhoneOff size={16} />
                    <span>Recording not available for this call</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
