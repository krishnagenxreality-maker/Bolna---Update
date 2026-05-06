import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, TrendingUp, CheckCircle, XCircle, Users, Award, Star } from 'lucide-react';
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
  const [hoveredDate, setHoveredDate] = useState(null);
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
          className={`cdv-cell ${stats ? 'has-data' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'disabled' : ''} ${hoveredDate === i ? 'hovered' : ''}`}
          onClick={() => !isFuture && handleDayClick(i)}
          onMouseEnter={() => !isFuture && setHoveredDate(i)}
          onMouseLeave={() => setHoveredDate(null)}
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

  const hoveredStats = hoveredDate ? getDayStats(hoveredDate) : null;

  return (
    <div className="calendar-view-enhanced">
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

        <div className="engagement-banner" style={{ marginBottom: '32px' }}>
          <div className="motivational-tag">
            <Award size={15} />
            <span>You are one of the top users using the platform</span>
          </div>
          <div className="motivational-tag blue">
            <TrendingUp size={15} />
            <span>Great job! Your engagement is increasing</span>
          </div>
          <div className="motivational-tag">
            <Star size={15} />
            <span>High performance this week</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <button 
            className="cta-start-calling"
            onClick={() => setActiveView('manager')}
          >
            Click here to start your calling right now
            <Phone size={20} />
          </button>
        </div>

        <div className="metrics-grid">
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

        <VisualAnalytics contacts={activeContacts} />
      </div>

      <div className="cdv-layout" style={{ marginTop: '20px', gap: '32px' }}>
        <div className="cdv-side-panel" style={{ height: 'auto', minWidth: '300px' }}>
          <h3 className="cdv-side-title">Daily Summary</h3>
          {hoveredStats ? (
            <div className="cdv-side-content fade-in">
              <div className="cdv-side-date">{formatDateString(hoveredDate)}</div>
              <div className="cdv-side-grid" style={{ gap: '16px' }}>
                <div className="cdv-side-item"><span>Total Calls:</span> <strong>{hoveredStats.total}</strong></div>
                <div className="cdv-side-item"><span>Completed:</span> <strong>{hoveredStats.completed}</strong></div>
                <div className="cdv-side-item"><span>Interested:</span> <strong className="txt-green">{hoveredStats.interested}</strong></div>
                <div className="cdv-side-item"><span>Not Interested:</span> <strong className="txt-red">{hoveredStats.notInterested}</strong></div>
                <div className="cdv-side-item"><span>Busy:</span> <strong>{hoveredStats.busy}</strong></div>
                <div className="cdv-side-item"><span>Rescheduled:</span> <strong>{hoveredStats.rescheduled}</strong></div>
              </div>
            </div>
          ) : (
            <div className="cdv-side-empty" style={{ padding: '40px 20px' }}>
              Hover over a date to view detailed activity.
            </div>
          )}
        </div>

        <div className="cdv-container" style={{ flex: 1 }}>
          <div className="cdv-header" style={{ marginBottom: '24px' }}>
            <div className="cdv-month-nav">
              <button className="cdv-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
              <h2 className="cdv-month-title">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button className="cdv-nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="cdv-grid">
            {renderCells()}
          </div>
        </div>
      </div>
    </div>
  );
};
