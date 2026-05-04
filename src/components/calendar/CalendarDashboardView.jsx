import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
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

  const activeContacts = agentId ? contacts.filter(c => c.agentId === agentId) : contacts;

  const getDayStats = (day) => {
    const dateStr = formatDateString(day);
    const dayContacts = activeContacts.filter(c => c.date === dateStr);
    
    if (dayContacts.length === 0) return null;

    const total = dayContacts.length;
    const completed = dayContacts.filter(c => c.status === 'completed' || c.status === 'called').length;
    const busy = dayContacts.filter(c => c.response?.toLowerCase().includes('busy')).length;
    const interested = dayContacts.filter(c => c.response?.toLowerCase().includes('interested') && !c.response?.toLowerCase().includes('not interested')).length;
    const notInterested = dayContacts.filter(c => c.response?.toLowerCase().includes('not interested')).length;
    const rescheduled = dayContacts.filter(c => c.response?.toLowerCase().includes('reschedule')).length;

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
    <div className="cdv-layout">
      {/* Left side fixed panel */}
      <div className="cdv-side-panel">
        <h3 className="cdv-side-title">Daily Summary</h3>
        {hoveredStats ? (
          <div className="cdv-side-content fade-in">
            <div className="cdv-side-date">{formatDateString(hoveredDate)}</div>
            <div className="cdv-side-grid">
              <div className="cdv-side-item"><span>Total Calls:</span> <strong>{hoveredStats.total}</strong></div>
              <div className="cdv-side-item"><span>Completed:</span> <strong>{hoveredStats.completed}</strong></div>
              <div className="cdv-side-item"><span>Interested:</span> <strong className="txt-green">{hoveredStats.interested}</strong></div>
              <div className="cdv-side-item"><span>Not Interested:</span> <strong className="txt-red">{hoveredStats.notInterested}</strong></div>
              <div className="cdv-side-item"><span>Busy:</span> <strong>{hoveredStats.busy}</strong></div>
              <div className="cdv-side-item"><span>Rescheduled:</span> <strong>{hoveredStats.rescheduled}</strong></div>
            </div>
          </div>
        ) : (
          <div className="cdv-side-empty">
            Hover over a date to view detailed activity.
          </div>
        )}
      </div>

      {/* Right side calendar */}
      <div className="cdv-container">
        <div className="cdv-header">
          <div className="cdv-month-nav">
            <button className="cdv-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
            <h2 className="cdv-month-title">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="cdv-nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
          </div>
          
          <div className="cdv-agent-select">
            <span className="cdv-agent-label">Agent:</span>
            <div style={{ width: '220px' }}>
              {availableAgents.length > 0 ? (
                <Dropdown
                  value={agentId}
                  onChange={(val) => setAgentId(val)}
                  options={availableAgents.map(agent => ({
                    label: agent.name,
                    value: `${agent.name}::${agent.id}`
                  }))}
                />
              ) : (
                <div className="cdv-no-agent">No agents configured</div>
              )}
            </div>
          </div>
        </div>

        <div className="cdv-grid">
          {renderCells()}
        </div>
      </div>
    </div>
  );
};
