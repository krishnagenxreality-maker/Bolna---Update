import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, AlertCircle, Calendar as CalendarIcon, 
  Users, Phone, Save, ChevronLeft, ChevronRight, UserCheck, UserMinus
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { Dropdown } from '../../ui/Dropdown';
import { makeCall } from '../../../services/api';
import './StudentAttendance.css';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'present' | 'absent' }
  const [agentId, setAgentId] = useState('');
  const [availableAgents, setAvailableAgents] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [message, setMessage] = useState(null);

  // Stats
  const totalStudents = students.length;
  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;

  // Load Data
  useEffect(() => {
    const init = async () => {
      if (!user?.userId) return;
      try {
        // 1. Fetch Students
        const res = await axios.get(`${API_BASE_URL}/api/education/students/${user.userId}`);
        if (res.data.success) {
          setStudents(res.data.students);
        }

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
        console.error("Failed to init attendance", err);
      }
    };
    init();
  }, [user]);

  // Load attendance when date changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.userId || !selectedDate) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/education/attendance/${user.userId}/${selectedDate}`);
        if (res.data.success) {
          const mapping = {};
          res.data.attendance.forEach(a => {
            mapping[a.student_id] = a.status;
          });
          setAttendance(mapping);
        }
      } catch (err) {
        console.error("Failed to fetch attendance", err);
      }
    };
    fetchAttendance();
  }, [selectedDate, user]);

  const toggleAttendance = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(attendance).length === 0) {
      alert("Please mark attendance for at least one student.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = Object.entries(attendance)
        .filter(([_, status]) => status !== null)
        .map(([id, status]) => ({ student_id: id, status }));
      
      const res = await axios.post(`${API_BASE_URL}/api/education/attendance/${user.userId}`, {
        date: selectedDate,
        attendance: payload
      });
      
      if (res.data.success) {
        setMessage({ type: 'success', text: `Attendance for ${selectedDate} saved successfully.` });
      }
    } catch (err) {
      console.error("Submit error", err);
      setMessage({ type: 'error', text: "Failed to save attendance." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerAbsenteeCalls = async () => {
    const absentees = students.filter(s => attendance[s.id] === 'absent');
    if (absentees.length === 0) {
      alert("No students marked as absent for this date.");
      return;
    }
    if (!agentId || !apiKey) {
      alert("Please select an agent and ensure API key is configured.");
      return;
    }

    setIsCalling(true);
    const actualAgentId = agentId.includes('::') ? agentId.split('::')[1] : agentId;

    try {
      for (const s of absentees) {
        try {
          await makeCall(apiKey, actualAgentId, s.parent_phone);
          await axios.post(`${API_BASE_URL}/api/user-credits/deduct/${user.userId}`);
        } catch (e) {
          console.error(`Failed to call ${s.parent_phone}`, e);
        }
      }
      setMessage({ type: 'success', text: `Calls triggered for ${absentees.length} absentees.` });
    } catch (err) {
      setMessage({ type: 'error', text: "Failed to trigger calls." });
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="student-attendance">
      <div className="att-top-bar">
        <div className="date-picker-wrap">
          <CalendarIcon size={18} className="icon-fade" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="att-date-input"
          />
        </div>
        
        <div className="att-summary-cards">
          <div className="att-stat-card">
            <Users size={16} className="sn-blue" />
            <div className="stat-content">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{totalStudents}</span>
            </div>
          </div>
          <div className="att-stat-card">
            <UserCheck size={16} className="sn-green" />
            <div className="stat-content">
              <span className="stat-label">Present</span>
              <span className="stat-value sn-green">{presentCount}</span>
            </div>
          </div>
          <div className="att-stat-card">
            <UserMinus size={16} className="sn-red" />
            <div className="stat-content">
              <span className="stat-label">Absent</span>
              <span className="stat-value sn-red">{absentCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="att-content-grid">
        <div className="att-list-panel panel">
          <div className="panel-header">
            <h3>Attendance List</h3>
            <span className="date-sub">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div className="att-students-list">
            {students.length === 0 ? (
              <div className="empty-state">No students found. Upload students in the Students tab.</div>
            ) : (
              students.map(s => (
                <div key={s.id} className="att-student-row">
                  <div className="student-info">
                    <span className="st-name">{s.student_name}</span>
                    <span className="st-parent">{s.parent_name} • {s.parent_phone}</span>
                  </div>
                  <div className="att-toggles">
                    <button 
                      className={`toggle-btn present ${attendance[s.id] === 'present' ? 'active' : ''}`}
                      onClick={() => toggleAttendance(s.id, 'present')}
                    >
                      Present
                    </button>
                    <button 
                      className={`toggle-btn absent ${attendance[s.id] === 'absent' ? 'active' : ''}`}
                      onClick={() => toggleAttendance(s.id, 'absent')}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="att-actions">
            <button 
              className="btn-primary" 
              onClick={handleSubmit} 
              disabled={isSubmitting || students.length === 0}
            >
              {isSubmitting ? 'Saving...' : <><Save size={18} /> Submit Attendance</>}
            </button>
          </div>
        </div>

        <div className="att-calling-panel panel">
          <div className="panel-header">
            <h3>Call Absentees</h3>
            <p className="panel-desc">Automate parent calls for students marked as absent today.</p>
          </div>

          <div className="calling-actions">
            <div className="field-group">
              <label>Select Calling Agent</label>
              <Dropdown 
                value={agentId} 
                onChange={setAgentId} 
                options={availableAgents.map(a => ({ label: a.name, value: `${a.name}::${a.id}` }))}
              />
            </div>

            <div className="absentee-call-wrap">
              <div className="absent-preview">
                <span className="preview-label">Target Students:</span>
                <span className="preview-count sn-red">{absentCount} Absentees</span>
              </div>
              <button 
                className="btn-call large" 
                onClick={triggerAbsenteeCalls}
                disabled={isCalling || absentCount === 0}
              >
                {isCalling ? (
                  <><div className="pulse-dot"></div> Calling...</>
                ) : (
                  <><Phone size={18} /> Make Calls for Absentees</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

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
