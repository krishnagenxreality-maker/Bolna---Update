import React, { useMemo, useState, useEffect } from 'react';
import { Panel, PanelHead } from '../ui/Panel';
import { DatePicker } from '../ui/DatePicker';
import { analyzeSummaryWithDeepSeek } from '../../services/api';
import { DEEPSEEK_API_KEY } from '../../utils/constants';
import { 
  PhoneIncoming, ListTodo, BarChart3, Users, ClipboardList, ChevronLeft, ChevronRight, 
  RefreshCw, CalendarDays, PhoneCall, Megaphone, X, FileText, Play, Clock, Phone, User
} from 'lucide-react';

const SummaryModal = ({ call, isOpen, onClose }) => {
  if (!isOpen || !call) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '85vh',
        overflowY: 'auto', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px', color: 'white',
          background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5
        }}><X size={20} /></button>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><PhoneIncoming size={20} /></div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Call Summary</h2>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {call.caller_name || 'Anonymous'} • {new Date(call.call_date).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Reason Tag */}
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</div>
              <span className="spill s-blue" style={{ fontSize: '12px', padding: '4px 10px' }}>{call.reason || 'Inbound Call'}</span>
            </div>

            {/* Summary Text */}
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview</div>
              <div style={{ 
                fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)',
                padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {call.summary || call.call_summary || 'No summary available for this call.'}
              </div>
            </div>

            {/* Transcript */}
            {call.transcript && (
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transcript</div>
                <div style={{ 
                  fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.6)',
                  padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                  maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  {call.transcript}
                </div>
              </div>
            )}

            {/* Recording */}
            {call.recording_url && (
              <div style={{ marginTop: '10px' }}>
                <a 
                  href={call.recording_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 20px', backgroundColor: 'rgba(59,130,246,0.1)',
                    borderRadius: '12px', color: '#3b82f6', fontSize: '14px',
                    fontWeight: '500', transition: 'all 0.2s', textDecoration: 'none'
                  }}
                >
                  <Play size={16} fill="currentColor" /> Listen to Recording
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InboundCard = ({ call, onClick, onTitleGenerated }) => {
  const [aiTitle, setAiTitle] = useState(call.reason || '');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateTitle = async () => {
      const isGeneric = !call.reason || 
                        call.reason.toLowerCase() === 'conversation' || 
                        call.reason.toLowerCase() === 'inbound call';

      if (isGeneric && call.summary && DEEPSEEK_API_KEY) {
        setIsGenerating(true);
        try {
          const title = await analyzeSummaryWithDeepSeek(DEEPSEEK_API_KEY, call.summary);
          // Try to limit to 2 words if it's too long
          const words = title.split(' ');
          const finalTitle = words.length > 2 ? words.slice(0, 2).join(' ') : title;
          setAiTitle(finalTitle);
          if (onTitleGenerated) onTitleGenerated(call.execution_id, finalTitle);
        } catch (e) {
          console.error("Failed to generate AI title", e);
        } finally {
          setIsGenerating(false);
        }
      }
    };
    generateTitle();
  }, [call.reason, call.summary]);

  return (
    <div 
      className="inbound-grid-card" 
      onClick={() => onClick(call)}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <PhoneIncoming size={16} />
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)', fontFamily: 'JetBrains Mono' }}>
          {new Date(call.call_date || call.created_at).toLocaleDateString()}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={12} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'JetBrains Mono' }}>
            {call.caller_phone || 'Unknown'}
          </span>
        </div>
      </div>

      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '16px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.2)' }}>Outcome</span>
          <span className="spill s-blue" style={{ fontSize: '10px', fontWeight: '600' }}>
            {isGenerating ? 'Analyzing...' : (aiTitle || 'Inbound Call')}
          </span>
        </div>
        <FileText size={14} style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
      </div>
    </div>
  );
};

export const InboundView = ({ 
  inboundCalls, 
  isLoading, 
  onRefresh, 
  activeView, 
  setActiveView 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchDate, setSearchDate] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const CARDS_PER_PAGE = 8;

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
      const callDate = new Date(c.call_date || c.created_at).toISOString().split('T')[0];
      return callDate === searchDate;
    });
  }, [inboundCalls, searchDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchDate]);

  const totalPages = Math.ceil(filteredData.length / CARDS_PER_PAGE);
  const currentCards = useMemo(() => {
    return filteredData.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handleCardClick = (call) => {
    setSelectedCall(call);
    setIsModalOpen(true);
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
      <SummaryModal 
        call={selectedCall} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Page Heading Section */}
      <div className="details-header-section">
        <h1 className="details-main-heading">Inbound Experience</h1>
        <p className="details-sub-heading">
          A visual grid of all incoming customer interactions. AI-powered summaries provide instant context for every call.
        </p>
      </div>

      <div className="details-layout-wrapper" style={{ display: 'flex', gridTemplateColumns: 'none', height: 'auto', overflow: 'visible' }}>
        
        {/* LEFT COLUMN: Navigation Matrix */}
        <div className="details-left-column" style={{ width: '280px', flexShrink: 0 }}>
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

        </div>

        {/* MAIN CONTENT: Grid */}
        <div className="details-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          <div className="inbound-grid-section" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <Panel>
              <PanelHead>
                <div className="panel-label" style={{marginBottom:0}}>
                  <span className="label-dot" />
                  Live Inbound Feed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="nav-btn inbound-refresh-btn"
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

              <div className="panel-body" style={{ padding: '24px' }}>
                {isLoading && filteredData.length === 0 ? (
                  <div style={{ padding: '80px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.3)' }}>
                    <RefreshCw size={32} className="spin-anim" style={{ marginBottom: '16px' }} />
                    <div>Syncing with Bolna AI...</div>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div style={{ padding: '80px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.2)' }}>
                    <PhoneIncoming size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <div>No inbound interactions found for this period.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                      gap: '20px',
                      marginBottom: '24px'
                    }}>
                      {currentCards.map((call, i) => (
                        <InboundCard 
                          key={call.execution_id || i} 
                          call={call} 
                          onClick={handleCardClick} 
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                          Showing {currentPage * CARDS_PER_PAGE + 1}-{Math.min((currentPage + 1) * CARDS_PER_PAGE, filteredData.length)} of {filteredData.length}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                            className="nav-btn"
                            style={{ 
                              padding: '8px', borderRadius: '8px', 
                              opacity: currentPage === 0 ? 0.3 : 1,
                              cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="nav-btn"
                            style={{ 
                              padding: '8px', borderRadius: '8px', 
                              opacity: currentPage === totalPages - 1 ? 0.3 : 1,
                              cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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
        .modal-overlay {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
};
