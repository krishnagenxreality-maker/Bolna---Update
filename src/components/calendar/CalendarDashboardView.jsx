import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, TrendingUp, CheckCircle, XCircle, Users, Award, Star, ListTodo, BarChart, ClipboardList, ArrowRight } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { DatePicker } from '../ui/DatePicker';
import { VisualAnalytics } from './VisualAnalytics';
import './CalendarDashboardView.css';

export const CalendarDashboardView = ({ 
  contacts, 
  agentId, 
  setAgentId, 
  availableAgents, 
  setSearchDate, 
  setActiveView 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilterType, setDateFilterType] = useState('all');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDayClick = (day) => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setSearchDate(`${y}-${m}-${d}`);
    setActiveView('manager');
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const formatDateString = (d) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Agent and Date filtering logic
  const activeContacts = contacts.filter(c => {
    const agentMatch = !agentId || c.agentId === agentId.split('::')[1];
    const dateMatch = dateFilterType === 'all' || 
                      c.date === specificDate || 
                      (c.createdAt && c.createdAt.startsWith(specificDate));
    return agentMatch && dateMatch;
  });

  // Calculate Overall Metrics
  const totalCalls = activeContacts.length;
  const completedCalls = activeContacts.filter(c => c.status === 'completed' || c.status === 'called').length;
  const failedCalls = activeContacts.filter(c => c.status === 'failed').length;
  const successRate = totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : 0;
  
  const interestedLeads = activeContacts.filter(c => 
    (c.leadCategory?.toLowerCase() === 'interested') || 
    (c.classification?.toLowerCase() === 'interested') ||
    (c.response?.toLowerCase().includes('interested') && !c.response?.toLowerCase().includes('not interested'))
  ).length;

  const rescheduledLeads = activeContacts.filter(c => 
    (c.leadCategory?.toLowerCase() === 'reschedule') || 
    (c.classification?.toLowerCase() === 'reschedule') ||
    (c.response?.toLowerCase().includes('reschedule'))
  ).length;

  const notInterestedLeads = activeContacts.filter(c => 
    (c.leadCategory?.toLowerCase() === 'not_interested') || 
    (c.classification?.toLowerCase() === 'not_interested') ||
    (c.response?.toLowerCase().includes('not interested'))
  ).length;

  const totalLeadsCount = interestedLeads + rescheduledLeads + notInterestedLeads;

  const getDayStats = (day) => {
    const dateStr = formatDateString(day);
    const dayContacts = activeContacts.filter(c => c.date === dateStr);
    
    if (dayContacts.length === 0) return null;

    const total = dayContacts.length;
    const completed = dayContacts.filter(c => c.status === 'completed' || c.status === 'called').length;
    const busy = dayContacts.filter(c => c.response?.toLowerCase().includes('busy')).length;
    const interested = dayContacts.filter(c => 
      (c.leadCategory?.toLowerCase() === 'interested') || 
      (c.classification?.toLowerCase() === 'interested') ||
      (c.response?.toLowerCase().includes('interested') && !c.response?.toLowerCase().includes('not interested'))
    ).length;

    const notInterested = dayContacts.filter(c => 
      (c.leadCategory?.toLowerCase() === 'not_interested') || 
      (c.classification?.toLowerCase() === 'not_interested') ||
      (c.response?.toLowerCase().includes('not interested'))
    ).length;

    const rescheduled = dayContacts.filter(c => 
      (c.leadCategory?.toLowerCase() === 'reschedule') || 
      (c.classification?.toLowerCase() === 'reschedule') ||
      (c.response?.toLowerCase().includes('reschedule'))
    ).length;

    return { total, completed, busy, interested, notInterested, rescheduled };
  };

  const renderCells = () => {
    const cells = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    daysOfWeek.forEach(day => {
      cells.push(<div key={`h-${day}`} className="cdv-dow">{day}</div>);
    });

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="cdv-cell empty"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const stats = getDayStats(i);
      const cellDate = new Date(year, month, i);
      cellDate.setHours(0, 0, 0, 0);
      const isToday = cellDate.getTime() === today.getTime();
      const isFuture = cellDate.getTime() > today.getTime();

      cells.push(
        <div 
          key={`d-${i}`} 
          className={`cdv-cell ${stats ? 'has-data' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
          onClick={() => handleDayClick(i)}
        >
          <div className="cdv-cell-header">
            <span className="cdv-day-num">{i}</span>
            {stats && (
              <span className="cdv-call-count">
                <Phone size={10} /> {stats.total}
              </span>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };


  // Quick Navigation items
  const quickNavItems = [
    { id: 'details', label: 'Call Details', icon: <ListTodo size={22} />, color: '#3b82f6' },
    { id: 'responses', label: 'Responses', icon: <BarChart size={22} />, color: '#7dffb3' },
    { id: 'leads', label: 'Leads', icon: <Users size={22} />, color: '#f5c842' },
    { id: 'report', label: 'Report', icon: <ClipboardList size={22} />, color: '#a855f7' }
  ];

  return (
    <div className="calendar-view-enhanced">
      {/* === TOP BAR === */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.02em' }}>Performance Overview</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>Track your calling activity and agent performance in real-time.</p>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="agent-selector-wrapper">
              <span className="field-label" style={{ marginBottom: '10px', display: 'block' }}>Filter by Agent</span>
              <Dropdown
                value={agentId}
                onChange={(val) => setAgentId(val === 'all' ? '' : val)}
                options={[
                  { label: 'All Agents', value: 'all' },
                  ...availableAgents.map(agent => ({
                    label: agent.name,
                    value: `${agent.name}::${agent.id}`
                  }))
                ]}
              />
            </div>
            <div className="date-selector-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ minWidth: '140px' }}>
                <span className="field-label" style={{ marginBottom: '10px', display: 'block' }}>Date Filter</span>
                <Dropdown
                  value={dateFilterType}
                  onChange={(val) => setDateFilterType(val)}
                  options={[
                    { label: 'All Days', value: 'all' },
                    { label: 'Particular Date', value: 'specific' }
                  ]}
                />
              </div>
              {dateFilterType === 'specific' && (
                <div style={{ minWidth: '140px' }}>
                  <DatePicker value={specificDate} onChange={setSpecificDate} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === MAIN 3-COLUMN LAYOUT === */}
      <div className="dashboard-main-grid">
        
        {/* LEFT COLUMN: Metric Cards (4×2) */}
        <div className="metrics-column">
          <div className="metrics-grid-compact">
            <div className="metric-card m-purple">
              <span className="metric-label">Total Calls Made</span>
              <span className="metric-value highlight">{totalCalls}</span>
              <div className="metric-sub">Across selected agent</div>
            </div>
            <div className="metric-card m-green">
              <span className="metric-label">Calls Completed</span>
              <span className="metric-value highlight" style={{ color: '#7dffb3' }}>{completedCalls}</span>
              <div className="metric-sub">Successfully connected</div>
            </div>
            <div className="metric-card m-red">
              <span className="metric-label">Calls Failed</span>
              <span className="metric-value highlight" style={{ color: '#ff7070' }}>{failedCalls}</span>
              <div className="metric-sub">No response or errors</div>
            </div>
            <div className="metric-card m-blue">
              <span className="metric-label">Success Rate</span>
              <span className="metric-value highlight" style={{ color: '#3b82f6' }}>{successRate}%</span>
              <div className="metric-sub">Completion percentage</div>
            </div>
            <div className="metric-card m-blue">
              <span className="metric-label">Total Leads</span>
              <span className="metric-value highlight">{totalLeadsCount}</span>
              <div className="metric-sub">Prospects identified</div>
            </div>
            <div className="metric-card m-green">
              <span className="metric-label">Interested</span>
              <span className="metric-value highlight" style={{ color: '#7dffb3' }}>{interestedLeads}</span>
              <div className="metric-sub">Potential conversions</div>
            </div>
            <div className="metric-card m-yellow">
              <span className="metric-label">Rescheduled</span>
              <span className="metric-value highlight" style={{ color: '#f5c842' }}>{rescheduledLeads}</span>
              <div className="metric-sub">Follow-ups required</div>
            </div>
            <div className="metric-card m-purple">
              <span className="metric-label">Active Agents</span>
              <span className="metric-value highlight">{agentId ? '1' : availableAgents.length}</span>
              <div className="metric-sub">Currently monitored</div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Calendar + CTA Button */}
        <div className="calendar-column">
          <div className="cdv-container">
            <div className="cdv-header">
              <div className="cdv-month-nav">
                <button className="cdv-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                <h2 className="cdv-month-title">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button className="cdv-nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
              </div>
              <button 
                className="cta-start-calling-compact"
                onClick={() => setActiveView('manager')}
              >
                <Phone size={14} />
                Start Calling
              </button>
            </div>

            <div className="cdv-grid">
              {renderCells()}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Navigation + Daily Summary */}
        <div className="quick-nav-column">
          <div className="quick-nav-container">
            <h3 className="quick-nav-title">Quick Navigation</h3>
            <div className="quick-nav-grid">
              {quickNavItems.map((item) => (
                <button
                  key={item.id}
                  className="quick-nav-item"
                  onClick={() => setActiveView(item.id)}
                  style={{ '--nav-accent': item.color }}
                >
                  <div className="quick-nav-icon">{item.icon}</div>
                  <span className="quick-nav-label">{item.label}</span>
                  <ArrowRight size={14} className="quick-nav-arrow" />
                </button>
              ))}
            </div>
          </div>

          {/* Daily Summary */}
          <div className="daily-summary-compact">
            <h3 className="daily-summary-title">Daily Summary</h3>
            <div className="daily-summary-grid">
              <div className="daily-summary-item">
                <span className="daily-summary-value">{totalCalls}</span>
                <span className="daily-summary-label">Calls Made</span>
              </div>
              <div className="daily-summary-item">
                <span className="daily-summary-value" style={{ color: '#7dffb3' }}>{completedCalls}</span>
                <span className="daily-summary-label">Connected</span>
              </div>
              <div className="daily-summary-item">
                <span className="daily-summary-value" style={{ color: '#3b82f6' }}>{totalLeadsCount}</span>
                <span className="daily-summary-label">Responses</span>
              </div>
              <div className="daily-summary-item">
                <span className="daily-summary-value" style={{ color: '#f5c842' }}>{interestedLeads}</span>
                <span className="daily-summary-label">Leads</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === GRAPHS SECTION (compact, expandable) === */}
      <VisualAnalytics contacts={activeContacts} />
    </div>
  );
};
