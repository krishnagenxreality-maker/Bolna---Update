import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Phone, Calendar as CalendarIcon, 
  Upload, FileText, CheckCircle, AlertCircle, Users, Activity
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { Dropdown } from '../../ui/Dropdown';
import { makeCall } from '../../../services/api';
import './StudentsManager.css';

export default function StudentsManager() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoverStats, setHoverStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [availableAgents, setAvailableAgents] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [xlsxReady, setXlsxReady] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [message, setMessage] = useState(null);

  // Load XLSX from CDN
  useEffect(() => {
    if (window.XLSX) { setXlsxReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => setXlsxReady(true);
    document.head.appendChild(s);
  }, []);

  // Init Data
  useEffect(() => {
    const init = async () => {
      if (user?.userId) {
        try {
          // 1. Fetch Students
          const res = await axios.get(`${API_BASE_URL}/api/education/students/${user.userId}`);
          if (res.data.success) setStudents(res.data.students);

          // 2. Fetch Agents Config
          const configRes = await axios.get(`${API_BASE_URL}/api/user-config/${user.userId}`);
          if (configRes.data.bolnaApiKey) setApiKey(configRes.data.bolnaApiKey);
          
          if (configRes.data.bolnaAgentId) {
            const raw = configRes.data.bolnaAgentId;
            try {
              const parsed = typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{')) ? JSON.parse(raw) : [{name: 'Default', id: raw}];
              const agents = Array.isArray(parsed) ? parsed : [parsed];
              setAvailableAgents(agents);
              if (agents.length > 0) setAgentId(`${agents[0].name}::${agents[0].id}`);
            } catch (e) {
              setAvailableAgents([{name: 'Default', id: raw}]);
              setAgentId(`Default::${raw}`);
            }
          }
        } catch (err) {
          console.error("Failed to init students manager", err);
        }
      }
    };
    init();
  }, [user]);

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const fetchDailyStats = async (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/education/daily-stats/${user.userId}/${dateStr}`);
      if (res.data.success) setHoverStats(res.data.stats);
    } catch (err) {
      setHoverStats(null);
    }
  };

  useEffect(() => {
    if (hoveredDate) fetchDailyStats(hoveredDate);
    else setHoverStats(null);
  }, [hoveredDate]);

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!xlsxReady) {
      setMessage({ type: 'error', text: "Excel library is still loading. Please try again in a few seconds." });
      return;
    }

    console.log("File selected:", file.name, file.type);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const wb = window.XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "" });

        console.log("Raw rows from file:", rows.slice(0, 2));

        if (rows.length === 0) {
          setMessage({ type: 'error', text: "The uploaded file is empty." });
          return;
        }

        const mapped = rows.map(r => {
          // Normalize keys to lowercase for easier matching
          const normalizedRow = {};
          Object.keys(r).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = r[key];
          });

          return {
            name: normalizedRow['name'] || normalizedRow['student name'] || normalizedRow['student_name'] || normalizedRow['fullname'] || normalizedRow['full name'] || normalizedRow['student'],
            parentName: normalizedRow['parent name'] || normalizedRow['parent_name'] || normalizedRow['guardian'] || normalizedRow['father name'] || normalizedRow['mother name'] || normalizedRow['parent'] || normalizedRow['guardian name'],
            phone: String(normalizedRow['phone number'] || normalizedRow['phone_number'] || normalizedRow['phone'] || normalizedRow['contact'] || normalizedRow['mobile'] || normalizedRow['parent phone'] || normalizedRow['parent contact'] || normalizedRow['phone_no']).replace(/\D/g, '')
          };
        }).filter(s => s.name && s.phone);

        console.log("Mapped students:", mapped.length);

        if (mapped.length > 0) {
          const res = await axios.post(`${API_BASE_URL}/api/education/students/${user.userId}`, { students: mapped });
          if (res.data.success) {
            const fetchRes = await axios.get(`${API_BASE_URL}/api/education/students/${user.userId}`);
            setStudents(fetchRes.data.students);
            setMessage({ type: 'success', text: `Successfully uploaded ${mapped.length} students.` });
          }
        } else {
          setMessage({ type: 'error', text: "No valid student data found. Please ensure 'Name' and 'Phone' columns are present." });
        }
      } catch (err) {
        console.error("File upload error:", err);
        setMessage({ type: 'error', text: "Failed to parse file. Please ensure it's a valid Excel or CSV file." });
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setMessage({ type: 'error', text: "Failed to read file." });
    };
    reader.readAsArrayBuffer(file);
    // Reset input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  // Make Call
  const triggerCalls = async () => {
    if (!agentId || !apiKey || students.length === 0) {
      alert("Please ensure agent is selected and student data is uploaded.");
      return;
    }
    
    setIsCalling(true);
    const actualAgentId = agentId.includes('::') ? agentId.split('::')[1] : agentId;
    
    try {
      for (const s of students) {
        try {
          await makeCall(apiKey, actualAgentId, s.parent_phone, s.name);
          // Deduct credit
          await axios.post(`${API_BASE_URL}/api/user-credits/deduct/${user.userId}`);
        } catch (e) {
          console.error(`Failed to call ${s.parent_phone}`, e);
        }
      }
      setMessage({ type: 'success', text: "Calls triggered for students." });
    } catch (err) {
      setMessage({ type: 'error', text: "Something went wrong during calling." });
    } finally {
      setIsCalling(false);
    }
  };

  const renderCalendar = () => {
    const cells = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0,0,0,0);

    daysOfWeek.forEach(d => cells.push(<div key={d} className="cal-dow">{d}</div>));

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="cal-cell empty"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const cellDate = new Date(year, month, i);
      cellDate.setHours(0,0,0,0);
      const isFuture = cellDate.getTime() > today.getTime();
      const isToday = cellDate.getTime() === today.getTime();

      cells.push(
        <div 
          key={i} 
          className={`cal-cell ${isFuture ? 'disabled' : 'clickable'} ${isToday ? 'today' : ''}`}
          onMouseEnter={() => !isFuture && setHoveredDate(i)}
          onMouseLeave={() => setHoveredDate(null)}
          onClick={() => !isFuture && console.log("Date clicked", cellDate)}
        >
          {i}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="students-manager">
      <div className="sm-content">
        {/* Left Side: Actions + Insights + List */}
        <div className="sm-side-panel">
          <div className="sm-top-actions">
            <div className="agent-select-wrap">
              <span className="field-label" style={{ marginBottom: '8px', display: 'block' }}>Select Agent</span>
              <Dropdown 
                value={agentId} 
                onChange={setAgentId} 
                options={availableAgents.map(a => ({ label: a.name, value: `${a.name}::${a.id}` }))}
              />
            </div>

            <div className="upload-wrap">
              <input 
                type="file" 
                id="student-upload" 
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
              <label htmlFor="student-upload" className="btn-upload">
                <Upload size={18} /> Upload Student Excel
              </label>
            </div>
          </div>

          <div className="panel-label">
            <div className="label-dot"></div>
            Daily Insights
          </div>
          <div className="insights-wrapper">
            {hoveredDate ? (
              <div className="stats-detail fade-in">
                <div className="stat-date">{year}-{String(month + 1).padStart(2, '0')}-{String(hoveredDate).padStart(2, '0')}</div>
                {hoverStats ? (
                  <div className="stats-grid-compact">
                    <div className="stat-item">
                      <span>Total Calls</span>
                      <strong>{hoverStats.totalCalls}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Present</span>
                      <strong className="sn-green">{hoverStats.present}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Absentees</span>
                      <strong className="sn-red">{hoverStats.absent}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Calls Made</span>
                      <strong>{hoverStats.callsMade}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="loading-stats">Fetching data...</div>
                )}
              </div>
            ) : (
              <div className="stats-empty">
                <CalendarIcon size={32} style={{ opacity: 0.1, marginBottom: '12px' }} />
                <p>Hover over a date to see call and attendance details</p>
              </div>
            )}
          </div>

          <div className="students-summary">
            <div className="panel-label">
              <div className="label-dot"></div>
              Students List ({students.length})
            </div>
            <div className="students-list-mini">
              {students.slice(0, 5).map((s, i) => (
                <div key={i} className="student-mini-row">
                  <span>{s.student_name}</span>
                  <span className="phone">{s.parent_phone}</span>
                </div>
              ))}
              {students.length > 5 && <div className="more-students">+{students.length - 5} more...</div>}
              {students.length === 0 && <div className="no-students">No student data uploaded</div>}
            </div>
          </div>

          <div className="side-call-action">
            <button 
              className="btn-call side-btn" 
              onClick={triggerCalls} 
              disabled={isCalling || students.length === 0}
              style={{ width: '100%' }}
            >
              {isCalling ? (
                <><div className="pulse-dot"></div> Processing...</>
              ) : (
                <><Phone size={16} /> Make Call</>
              )}
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <div className="calendar-container panel">
          <div className="cal-header">
            <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
            <h2 className="cal-title">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
          </div>
          <div className="cal-grid">
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`msg-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="msg-close">×</button>
        </div>
      )}

    </div>
  );
}
