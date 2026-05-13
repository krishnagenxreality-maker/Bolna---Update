import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import './DatePicker.css';

export const DatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const [viewDate, setViewDate] = useState(currentDate);

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setCurrentDate(new Date(y, m - 1, d));
      if (!isOpen) {
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !e.target.closest('.cal-popup')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updateCoords = () => {
        const rect = containerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    }
  }, [isOpen]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    // Header
    daysOfWeek.forEach(day => {
      days.push(<div key={`h-${day}`} className="cal-dow">{day}</div>);
    });

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`e-${i}`} className="cal-cell empty"></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = value && currentDate.getDate() === i && currentDate.getMonth() === month && currentDate.getFullYear() === year;
      const isToday = new Date().getDate() === i && new Date().getMonth() === month && new Date().getFullYear() === year;

      days.push(
        <div 
          key={`d-${i}`} 
          className={`cal-cell ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleDateClick(i); }}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="custom-datepicker" ref={containerRef}>
      <div 
        className={`datepicker-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="datepicker-label-wrap">
          <CalendarDays size={14} className="datepicker-icon" />
          <span className="datepicker-value">
            {value || "Select Date"}
          </span>
        </div>
        <ChevronDown size={14} className={`datepicker-caret ${isOpen ? 'rotated' : ''}`} />
      </div>
      
       {isOpen && createPortal(
        <div 
          className="cal-popup"
          style={{
            position: 'absolute',
            top: `${coords.top + 8}px`,
            left: `${coords.left + coords.width - 260}px`, // Align to right like original CSS
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cal-header">
            <button className="cal-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
            <div className="cal-month-title">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button className="cal-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
          </div>
          <div className="cal-grid">
            {renderCalendarDays()}
          </div>
          <div className="cal-footer">
            <button 
              className="cal-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <button 
              className="cal-action-btn highlight"
              onClick={(e) => {
                e.stopPropagation();
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                onChange(`${y}-${m}-${d}`);
                setIsOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
