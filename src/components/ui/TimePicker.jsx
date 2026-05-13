import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown } from 'lucide-react';
import './TimePicker.css';

export const TimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [pickingMode, setPickingMode] = useState('hours'); // 'hours' or 'minutes'

  const [hour, setHour] = useState(value ? parseInt(value.split(':')[0]) : 12);
  const [minute, setMinute] = useState(value ? parseInt(value.split(':')[1]) : 0);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(parseInt(h));
      setMinute(parseInt(m));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !e.target.closest('.time-popup')) {
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

  const handleTimeSelect = (h, m) => {
    const formattedH = String(h).padStart(2, '0');
    const formattedM = String(m).padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
  };

  const renderClockNumbers = () => {
    const numbers = pickingMode === 'hours' 
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] 
      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    
    return numbers.map((num, i) => {
      const angle = (i * 30) - 90;
      const x = 85 * Math.cos(angle * (Math.PI / 180));
      const y = 85 * Math.sin(angle * (Math.PI / 180));
      
      let isSelected = false;
      if (pickingMode === 'hours') {
        isSelected = (hour === num) || (hour === 0 && num === 12) || (hour === 12 && num === 12) || (hour > 12 && hour - 12 === num);
      } else {
        isSelected = minute === num;
      }

      return (
        <div 
          key={num}
          className={`clock-number ${isSelected ? 'selected' : ''}`}
          style={{ transform: `translate(${x}px, ${y}px)` }}
          onClick={(e) => {
            e.stopPropagation();
            if (pickingMode === 'hours') {
              // Simple 12h toggle for now, can be expanded to 24h
              setHour(num);
              handleTimeSelect(num, minute);
              setPickingMode('minutes');
            } else {
              setMinute(num);
              handleTimeSelect(hour, num);
            }
          }}
        >
          {num}
        </div>
      );
    });
  };

  const getHandRotation = () => {
    if (pickingMode === 'hours') {
      return (hour % 12) * 30;
    }
    return minute * 6;
  };

  return (
    <div className="custom-timepicker" ref={containerRef}>
      <div 
        className={`timepicker-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => {
          setIsOpen(!isOpen);
          setPickingMode('hours');
        }}
      >
        <div className="timepicker-label-wrap">
          <Clock size={14} className="timepicker-icon" />
          <span className="timepicker-value">
            {value || "Select Time"}
          </span>
        </div>
        <ChevronDown size={14} className={`timepicker-caret ${isOpen ? 'rotated' : ''}`} />
      </div>

      {isOpen && createPortal(
        <div 
          className="time-popup clock-style"
          style={{
            position: 'absolute',
            top: `${coords.top + 8}px`,
            left: `${coords.left + coords.width - 260}px`,
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="clock-header">
            <div className="clock-time-display">
              <span 
                className={pickingMode === 'hours' ? 'active' : ''} 
                onClick={() => setPickingMode('hours')}
              >
                {String(hour).padStart(2, '0')}
              </span>
              <span className="separator">:</span>
              <span 
                className={pickingMode === 'minutes' ? 'active' : ''} 
                onClick={() => setPickingMode('minutes')}
              >
                {String(minute).padStart(2, '0')}
              </span>
            </div>
            <div className="clock-ampm-toggle">
               <button 
                className={hour < 12 ? 'active' : ''} 
                onClick={() => {
                  if (hour >= 12) {
                    const newHour = hour - 12;
                    setHour(newHour);
                    handleTimeSelect(newHour, minute);
                  }
                }}
               >AM</button>
               <button 
                className={hour >= 12 ? 'active' : ''} 
                onClick={() => {
                  if (hour < 12) {
                    const newHour = hour + 12;
                    setHour(newHour);
                    handleTimeSelect(newHour, minute);
                  }
                }}
               >PM</button>
            </div>
          </div>

          <div className="clock-face-container">
            <div className="clock-face">
              <div className="clock-center-dot"></div>
              <div 
                className="clock-hand" 
                style={{ transform: `rotate(${getHandRotation()}deg)` }}
              >
                <div className="clock-hand-tip"></div>
              </div>
              {renderClockNumbers()}
            </div>
          </div>

          <div className="time-picker-footer">
            <button className="time-done-btn" onClick={() => setIsOpen(false)}>Set Time</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
