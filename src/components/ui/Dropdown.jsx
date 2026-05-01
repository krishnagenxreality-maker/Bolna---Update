import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Dropdown.css';

export const Dropdown = ({ value, onChange, options, placeholder = "Select...", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`custom-dropdown ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="dropdown-value">
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <ChevronDown size={14} className="dropdown-caret" />
      </div>

      {isOpen && !disabled && (
        <div className="dropdown-menu">
          {options.map((opt, i) => (
            <div
              key={opt.value + i}
              className={`dropdown-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
