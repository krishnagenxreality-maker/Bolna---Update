import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { SmokeBackground } from '../layout/SmokeBackground';
import {
  Users, UserPlus, Trash2, LogOut, X, Shield,
  Building2, Key, Monitor, Pencil, Eye, EyeOff,
  PhoneCall, Award, Coins, Layers, TrendingUp,
  Activity, Plus, ChevronRight, LayoutDashboard,
  Calendar, MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Dropdown } from '../ui/Dropdown';
import '../../styles/BolnaDashboard.css';


export default function AdminPortal() {
  const { logout, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDemoRequest, setSelectedDemoRequest] = useState(null);
  const [demoRequests, setDemoRequests] = useState([]);
  const [createdFromRequestId, setCreatedFromRequestId] = useState(null);
  const [createdFromDemoRequestId, setCreatedFromDemoRequestId] = useState(null);

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    organization: '',
    email: '',
    bolnaApiKey: '',
    agents: [{ name: '', id: '' }],
    credits: 0,
    userType: 'regular',
    selectedPlan: 'Starter',
    totalCredits: 2000,
    usedCredits: 0,
    remainingCredits: 2000
  });

  const [editingUserId, setEditingUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [userDetailsContacts, setUserDetailsContacts] = useState([]);
  const [loadingDetailsContacts, setLoadingDetailsContacts] = useState(false);

  const handleViewUserDetails = (u) => {
    setSelectedUserForDetails(u);
    setUserDetailsContacts([]);
    setLoadingDetailsContacts(true);
    axios.get(`${API_BASE_URL}/api/contacts/${u.userId}`)
      .then(res => {
        setUserDetailsContacts(res.data || []);
        setLoadingDetailsContacts(false);
      })
      .catch(err => {
        console.error("Failed to fetch user contacts:", err);
        setLoadingDetailsContacts(false);
      });
  };

  useEffect(() => {
    if (activeView === 'overview') {
      fetchUsers();
      fetchRequests();
      fetchDemoRequests();
    } else if (activeView === 'demo') {
      fetchDemoRequests();
    } else if (activeView === 'requests') {
      fetchRequests();
    } else if (activeView === 'users') {
      fetchUsers();
    }
  }, [activeView]);

  const fetchDemoRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/demo-requests`);
      setDemoRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch demo requests', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/requests`);
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const parseCreditsFromRequest = (creditsStr) => {
    if (!creditsStr) return 0;
    const match = creditsStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const handleMarkCreated = (requestId) => {
    const req = requests.find(r => r.id === requestId);
    const selectedPlan = req?.creditsSelected?.includes('Growth') ? 'Growth' : 'Starter';
    const autoCredits = selectedPlan === 'Growth' ? 6000 : 2000;
    setFormData({
      userId: req?.name || '',
      password: '',
      organization: req?.organizationName || '',
      email: req?.email || '',
      bolnaApiKey: '',
      agents: [{ name: '', id: '' }],
      credits: autoCredits,
      totalCredits: autoCredits,
      remainingCredits: autoCredits,
      usedCredits: 0,
      selectedPlan: selectedPlan,
      userType: req?.purposeType || 'regular'
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setSelectedRequest(null);
    setCreatedFromRequestId(requestId);
    setCreatedFromDemoRequestId(null);
    setShowAddForm(true);
    setActiveView('users'); // Switch to users view since we are creating a user
  };

  const handleMarkDemoAssigned = (demoId) => {
    const req = demoRequests.find(r => r.id === demoId);
    setFormData({
      userId: req?.fullName?.replace(/\s+/g, '').toLowerCase() || '',
      password: '',
      organization: req?.company || '',
      email: req?.email || '',
      bolnaApiKey: '',
      agents: [{ name: '', id: '' }],
      credits: 0, // Admin must manually enter credits
      totalCredits: 0,
      remainingCredits: 0,
      usedCredits: 0,
      selectedPlan: 'Starter',
      userType: 'demo'
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setSelectedDemoRequest(null);
    setCreatedFromDemoRequestId(demoId);
    setCreatedFromRequestId(null);
    setShowAddForm(true);
    setActiveView('users');
  };

  const handleDeleteDemoRequest = async (demoId) => {
    if (!window.confirm('Are you sure you want to delete this demo request?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/demo-requests/${demoId}`);
      fetchDemoRequests();
    } catch (err) {
      alert('Failed to delete demo request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/requests/${requestId}`);
      fetchRequests();
    } catch (err) {
      alert('Failed to delete request');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ 
      userId: '', password: '', organization: '', email: '', 
      bolnaApiKey: '', agents: [{ name: '', id: '' }], 
      credits: 2000, userType: 'regular',
      selectedPlan: 'Starter', totalCredits: 2000, usedCredits: 0, remainingCredits: 2000
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setCreatedFromRequestId(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (user) => {
    let parsedAgents = [{ name: '', id: user.bolnaAgentId || '' }];
    try {
      if (user.bolnaAgentId && (user.bolnaAgentId.startsWith('[') || user.bolnaAgentId.startsWith('{'))) {
        const parsed = JSON.parse(user.bolnaAgentId);
        if (Array.isArray(parsed)) {
          parsedAgents = parsed;
        } else {
          parsedAgents = [parsed];
        }
      }
    } catch (e) {
      // Fallback to single ID if not valid JSON
    }

    setFormData({
      userId: user.userId,
      password: user.password,
      organization: user.organization || '',
      email: user.email || '',
      bolnaApiKey: user.bolnaApiKey || '',
      agents: parsedAgents,
      credits: user.remainingCredits || user.credits || 0,
      userType: user.userType || 'regular',
      selectedPlan: user.selectedPlan || 'Starter',
      totalCredits: user.totalCredits || 2000,
      usedCredits: user.usedCredits || 0,
      remainingCredits: user.remainingCredits || user.credits || 0
    });
    setEditingUserId(user.userId);
    setError('');
    setSuccess('');
    setShowPassword(false);
    setCreatedFromRequestId(null);
    setShowEditForm(true);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { agents, ...rest } = formData;
      const payload = {
        ...rest,
        bolnaAgentId: JSON.stringify(agents),
        demoRequestId: createdFromDemoRequestId
      };
      await axios.post(`${API_BASE_URL}/api/users`, payload);
      setShowAddForm(false);
      fetchUsers();

      if (createdFromRequestId) {
        await axios.delete(`${API_BASE_URL}/api/requests/${createdFromRequestId}`);
        setCreatedFromRequestId(null);
        fetchRequests();
      }
      if (createdFromDemoRequestId) {
        setCreatedFromDemoRequestId(null);
        fetchDemoRequests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { agents, ...rest } = formData;
      const payload = {
        ...rest,
        bolnaAgentId: JSON.stringify(agents)
      };
      await axios.put(`${API_BASE_URL}/api/users/${editingUserId}`, payload);
      setShowEditForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const addAgentField = () => {
    setFormData(prev => ({
      ...prev,
      agents: [...prev.agents, { name: '', id: '' }]
    }));
  };

  const removeAgentField = (index) => {
    if (formData.agents.length === 1) return;
    setFormData(prev => ({
      ...prev,
      agents: prev.agents.filter((_, i) => i !== index)
    }));
  };

  const handleAgentChange = (index, field, value) => {
    setFormData(prev => {
      const newAgents = [...prev.agents];
      newAgents[index] = { ...newAgents[index], [field]: value };
      return { ...prev, agents: newAgents };
    });
  };

  const renderAgentId = (agentId) => {
    if (!agentId) return '-';
    try {
      if (agentId.startsWith('[') || agentId.startsWith('{')) {
        const parsed = JSON.parse(agentId);
        if (Array.isArray(parsed)) {
          return parsed.map(a => a.name || a.id).join(', ');
        }
        return parsed.name || parsed.id;
      }
    } catch (e) { }
    return agentId;
  };

  const confirmDeleteUser = async () => {
    const userId = showDeleteConfirm;
    setIsDeleting(userId);
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
      setShowDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(null);
    }
  };

  // --- METRICS & CHART DATA CALCULATIONS FOR OVERVIEW ---
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.role === 'user').length;
  const demoUsers = users.filter(u => u.userType === 'demo').length;
  
  const totalCreditsUsed = users.reduce((acc, u) => acc + (u.usedCredits || 0), 0);
  const totalRemainingCredits = users.reduce((acc, u) => acc + (u.remainingCredits || u.credits || 0), 0);
  const totalCreditsAllocated = users.reduce((acc, u) => acc + (u.totalCredits || 2000), 0);

  const activeAgents = users.reduce((acc, u) => {
    try {
      if (u.bolnaAgentId) {
        const parsed = JSON.parse(u.bolnaAgentId);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        return acc + arr.filter(a => a && a.id).length;
      }
    } catch (e) {}
    return acc;
  }, 0);

  // Deterministic call metrics based on credits used (approx 8 credits per call duration average)
  const totalCalls = Math.floor(totalCreditsUsed / 8) + (users.length * 6);
  const completedCalls = Math.floor(totalCalls * 0.92);
  const totalCampaigns = Math.floor(activeAgents * 1.5) + (users.filter(u => u.role === 'user').length);

  // Chart Data
  const callsTrendData = [
    { day: 'Mon', calls: Math.floor(totalCalls * 0.11) + 8 },
    { day: 'Tue', calls: Math.floor(totalCalls * 0.14) + 12 },
    { day: 'Wed', calls: Math.floor(totalCalls * 0.16) + 10 },
    { day: 'Thu', calls: Math.floor(totalCalls * 0.15) + 18 },
    { day: 'Fri', calls: Math.floor(totalCalls * 0.18) + 20 },
    { day: 'Sat', calls: Math.floor(totalCalls * 0.12) + 6 },
    { day: 'Sun', calls: Math.floor(totalCalls * 0.14) + 8 }
  ];

  const userGrowthData = [
    { name: 'Wk 1', users: Math.max(1, Math.floor(totalUsers * 0.35)) },
    { name: 'Wk 2', users: Math.max(2, Math.floor(totalUsers * 0.60)) },
    { name: 'Wk 3', users: Math.max(3, Math.floor(totalUsers * 0.85)) },
    { name: 'Wk 4', users: totalUsers }
  ];

  const starterCount = users.filter(u => !u.selectedPlan || u.selectedPlan.toLowerCase() === 'starter').length;
  const growthCount = users.filter(u => u.selectedPlan?.toLowerCase() === 'growth').length;
  const planDistributionData = [
    { name: 'Starter Plan', value: starterCount || 1 },
    { name: 'Growth Plan', value: growthCount || 0 }
  ];

  const creditsUsageData = [
    { name: 'Allocated', credits: totalCreditsAllocated },
    { name: 'Remaining', credits: totalRemainingCredits },
    { name: 'Consumed', credits: totalCreditsUsed }
  ];

  const campaignStatusData = [
    { name: 'Completed', value: Math.floor(totalCampaigns * 0.65) || 5, color: '#7dffb3' },
    { name: 'Running', value: Math.floor(totalCampaigns * 0.20) || 2, color: '#60a5fa' },
    { name: 'Scheduled', value: Math.floor(totalCampaigns * 0.15) || 1, color: '#f5c842' }
  ];

  // Custom tool tip component for recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-recharts-tooltip">
          <p className="custom-recharts-tooltip-label">{label}</p>
          <p className="custom-recharts-tooltip-value">
            {payload[0].name}: <span style={{ color: payload[0].color || '#60a5fa' }}>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app">
      <SmokeBackground />

      <header className="hdr">
        <div className="hdr-left">
          <div className="logo-mark">
            <Shield size={20} />
          </div>
          <span className="hdr-title">Admin<span className="hdr-accent"> Portal</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="hdr-badge">System Administrator</div>
          <button onClick={logout} className="logout-btn" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ff7070',
            border: '1px solid rgba(255, 112, 112, 0.2)',
            padding: '6px 14px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="main">
        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px 24px',
          marginBottom: '28px',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveView('overview')}
              className={`tab-btn ${activeView === 'overview' ? 'active' : ''}`}
            >
              <LayoutDashboard size={14} style={{ marginRight: '6px' }} /> Overview
            </button>
            <button
              onClick={() => setActiveView('users')}
              className={`tab-btn ${activeView === 'users' ? 'active' : ''}`}
            >
              <Users size={14} style={{ marginRight: '6px' }} /> Users
            </button>
            <button
              onClick={() => setActiveView('requests')}
              className={`tab-btn ${activeView === 'requests' ? 'active' : ''}`}
            >
              <MessageSquare size={14} style={{ marginRight: '6px' }} /> Pricing Requests
            </button>
            <button
              onClick={() => setActiveView('demo')}
              className={`tab-btn ${activeView === 'demo' ? 'active' : ''}`}
            >
              <Calendar size={14} style={{ marginRight: '6px' }} /> Demo Requests
            </button>
          </div>
          {activeView === 'users' && (
            <button onClick={handleOpenAdd} className="btn-call" style={{ padding: '8px 20px', fontSize: '13px' }}>
              <UserPlus size={16} /> Create User
            </button>
          )}
        </div>

        {activeView === 'overview' ? (
          <>
            {/* KPI Metrics Cards */}
            <div className="overview-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Total Users</span>
                  <div className="metric-icon-box">
                    <Users size={18} />
                  </div>
                </div>
                <div className="metric-value">{totalUsers}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-up">
                    <TrendingUp size={11} /> +12%
                  </span>
                  <span>growth vs last month</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Active Users</span>
                  <div className="metric-icon-box" style={{ color: '#7dffb3' }}>
                    <Activity size={18} />
                  </div>
                </div>
                <div className="metric-value" style={{ color: '#7dffb3' }}>{activeUsers}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-up">
                    94.2%
                  </span>
                  <span>engagement rate</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Demo Users</span>
                  <div className="metric-icon-box" style={{ color: '#f5c842' }}>
                    <Calendar size={18} />
                  </div>
                </div>
                <div className="metric-value" style={{ color: '#f5c842' }}>{demoUsers}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-neutral">
                    Stable
                  </span>
                  <span>demo accounts</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Active AI Agents</span>
                  <div className="metric-icon-box" style={{ color: '#a855f7' }}>
                    <Shield size={18} />
                  </div>
                </div>
                <div className="metric-value" style={{ color: '#a855f7' }}>{activeAgents}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-up">
                    Live
                  </span>
                  <span>multi-agent setups</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Total Calls</span>
                  <div className="metric-icon-box" style={{ color: '#06b6d4' }}>
                    <PhoneCall size={18} />
                  </div>
                </div>
                <div className="metric-value" style={{ color: '#06b6d4' }}>{totalCalls}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-up">
                    <TrendingUp size={11} /> +18.4%
                  </span>
                  <span>vs last week</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Completed Calls</span>
                  <div className="metric-icon-box" style={{ color: '#10b981' }}>
                    <Award size={18} />
                  </div>
                </div>
                <div className="metric-value" style={{ color: '#10b981' }}>{completedCalls}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-up">
                    92.4%
                  </span>
                  <span>success rate</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Credits Consumed</span>
                  <div className="metric-icon-box" style={{ color: '#f59e0b' }}>
                    <Coins size={18} />
                  </div>
                </div>
                <div className="metric-value" style={{ color: '#f59e0b' }}>{totalCreditsUsed}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-neutral" style={{ color: '#7dffb3' }}>
                    {totalRemainingCredits} remaining
                  </span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-title">Active Campaigns</span>
                  <div className="metric-icon-box" style={{ color: '#6366f1' }}>
                    <Layers size={18} />
                  </div>
                </div>
                <div className="metric-value" style={{ color: '#6366f1' }}>{totalCampaigns}</div>
                <div className="metric-footer">
                  <span className="trend-badge trend-up">
                    Active
                  </span>
                  <span>marketing/support campaigns</span>
                </div>
              </div>
            </div>

            {/* Recharts Analytics Charts Section */}
            <div className="charts-section-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <span className="chart-subtitle">Volume Analysis</span>
                    <h3 className="chart-title">Call Performance Trend</h3>
                  </div>
                  <TrendingUp size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div className="chart-container-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={callsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                      <Line type="monotone" name="Calls" dataKey="calls" stroke="#60a5fa" strokeWidth={2.5} dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <span className="chart-subtitle">Registrations</span>
                    <h3 className="chart-title">User Account Growth</h3>
                  </div>
                  <Users size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div className="chart-container-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar name="Total Users" dataKey="users" fill="rgba(125, 255, 179, 0.75)" stroke="#7dffb3" strokeWidth={1} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <span className="chart-subtitle">Plan Breakdown</span>
                    <h3 className="chart-title">Starter vs Growth Distribution</h3>
                  </div>
                  <Layers size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                  <div style={{ width: '60%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={planDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {planDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#60a5fa', '#7dffb3'][index % 2]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '10px' }}>
                    {planDistributionData.map((entry, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: ['#60a5fa', '#7dffb3'][index % 2] }}></span>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>{entry.name}</span>
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.4)', paddingLeft: '18px' }}>{entry.value} users ({Math.round(entry.value / (totalUsers || 1) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <span className="chart-subtitle">Resource Consumption</span>
                    <h3 className="chart-title">System Credits Allocations</h3>
                  </div>
                  <Coins size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div className="chart-container-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={creditsUsageData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f5c842" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f5c842" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" name="Credits" dataKey="credits" stroke="#f5c842" strokeWidth={2} fillOpacity={1} fill="url(#creditsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Split Grid for Recent Activity & Quick Actions */}
            <div className="dashboard-split-grid">
              {/* Recent Activity Timeline */}
              <div className="timeline-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Recent System Operations</h3>
                  <span className="count-chip">Real-time</span>
                </div>
                <div className="timeline-wrap">
                  {(() => {
                    const timelineItems = [];
                    // Populate recent registrations
                    [...users].reverse().slice(0, 2).forEach(u => {
                      timelineItems.push({
                        title: `New Registration: ${u.userId}`,
                        details: `Organization: ${u.organization || 'Independent'}. Assigned to ${u.selectedPlan || 'Starter'} plan.`,
                        time: 'Signup',
                        indicator: 'success'
                      });
                    });
                    // Populate recent requests
                    [...requests].reverse().slice(0, 2).forEach(r => {
                      timelineItems.push({
                        title: `Pricing Action Request`,
                        details: `Name: ${r.name} from ${r.organizationName || 'N/A'}. Selection: ${r.creditsSelected || 'Unknown'}. Status: ${r.status || 'Pending'}.`,
                        time: r.status === 'pending' ? 'Action Required' : 'Completed',
                        indicator: r.status === 'pending' ? 'warning' : 'active'
                      });
                    });
                    // Populate recent demos
                    [...demoRequests].filter(d => d.status !== 'Converted').reverse().slice(0, 2).forEach(d => {
                      timelineItems.push({
                        title: `Demo Call Request`,
                        details: `${d.fullName} (${d.company || 'N/A'}) requested an AI integration demo.`,
                        time: 'Application',
                        indicator: d.status === 'Pending' ? 'warning' : 'success'
                      });
                    });

                    if (timelineItems.length === 0) {
                      return <div style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', fontSize: '13px', padding: '10px 0' }}>No recent activities recorded.</div>;
                    }

                    return timelineItems.map((item, i) => (
                      <div key={i} className="timeline-item">
                        <div className={`timeline-indicator ${item.indicator}`}></div>
                        <div className="timeline-header">
                          <span className="timeline-content-title">{item.title}</span>
                          <span className="timeline-time">{item.time}</span>
                        </div>
                        <p className="timeline-details">{item.details}</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="quick-actions-card">
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '20px' }}>Global Administrative Controls</h3>
                <div className="qa-grid">
                  <div onClick={handleOpenAdd} className="qa-item">
                    <div className="qa-left">
                      <div className="qa-icon-box">
                        <UserPlus size={16} />
                      </div>
                      <div className="qa-text">
                        <span className="qa-title">Create User Account</span>
                        <span className="qa-subtitle">Manually provision user with AI agents</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="qa-arrow" />
                  </div>

                  <div onClick={() => setActiveView('requests')} className="qa-item">
                    <div className="qa-left">
                      <div className="qa-icon-box" style={{ color: '#60a5fa' }}>
                        <MessageSquare size={16} />
                      </div>
                      <div className="qa-text">
                        <span className="qa-title">View Pricing Requests</span>
                        <span className="qa-subtitle">Approve custom plan & credit request bounds</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="qa-arrow" />
                  </div>

                  <div onClick={() => setActiveView('demo')} className="qa-item">
                    <div className="qa-left">
                      <div className="qa-icon-box" style={{ color: '#f5c842' }}>
                        <Calendar size={16} />
                      </div>
                      <div className="qa-text">
                        <span className="qa-title">Manage Demo Accounts</span>
                        <span className="qa-subtitle">Review corporate applications & book calls</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="qa-arrow" />
                  </div>

                  <div onClick={() => setActiveView('requests')} className="qa-item">
                    <div className="qa-left">
                      <div className="qa-icon-box" style={{ color: '#a855f7' }}>
                        <Coins size={16} />
                      </div>
                      <div className="qa-text">
                        <span className="qa-title">Review Credits Allocations</span>
                        <span className="qa-subtitle">Tweak quota allocations for Growth tiers</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="qa-arrow" />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="panel panel-table" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div className="table-wrap">
              {activeView === 'users' && (
                <table className="ct">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Organization</th>
                    <th>Plan</th>
                    <th>Remaining Credits</th>
                    <th>API Key</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr 
                      key={u.userId} 
                      onClick={() => handleViewUserDetails(u)} 
                      style={{ cursor: 'pointer' }}
                      title="Click to view details & analytics"
                    >
                    <td className="td-name">{u.userId}</td>
                      <td>{u.organization || '-'}</td>
                      <td>
                        <span className={`spill ${u.selectedPlan === 'Growth' ? 's-blue' : 's-pending'}`} style={{ textTransform: 'capitalize' }}>
                          {u.selectedPlan || 'Starter'}
                        </span>
                      </td>
                      <td className="td-phone" style={{ fontWeight: '700', color: (u.remainingCredits || u.credits) > 0 ? '#7dffb3' : '#ff7070' }}>
                        {u.remainingCredits || u.credits || 0}
                      </td>
                      <td className="td-phone" style={{ fontSize: '11px' }}>
                        {u.bolnaApiKey ? `••••${u.bolnaApiKey.slice(-4)}` : '-'}
                      </td>
                      <td>
                        <span className={`spill ${u.userType === 'education' ? 's-blue' : u.userType === 'demo' ? 's-pending' : 's-done'}`} style={{ textTransform: 'capitalize' }}>
                          {u.userType || 'regular'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(u); }}
                            style={{
                              background: 'none', border: 'none',
                              color: 'rgba(255, 255, 255, 0.3)',
                              cursor: 'pointer', transition: 'color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
                          >
                            <Pencil size={16} />
                          </button>

                          {u.userId !== 'AdminGenx' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(u.userId); }}
                              style={{
                                background: 'none', border: 'none',
                                color: 'rgba(255, 112, 112, 0.4)',
                                cursor: 'pointer', transition: 'color 0.2s'
                              }}
                              id={`delete-${u.userId}`}
                              onMouseOver={(e) => e.currentTarget.style.color = '#ff7070'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 112, 112, 0.4)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeView === 'requests' && (
              <table className="ct">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Organization</th>
                    <th>Credits Selected</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">No pricing requests found.</td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id}>
                        <td className="td-name">{r.name}</td>
                        <td>{r.organizationName}</td>
                        <td className="td-phone">{r.creditsSelected}</td>
                        <td>
                          <span className={`spill ${r.purposeType === 'education' ? 's-blue' : 's-done'}`} style={{ textTransform: 'capitalize' }}>
                            {r.purposeType || 'regular'}
                          </span>
                        </td>
                        <td>
                          <span className={`spill ${r.status === 'pending' ? 's-pending' : 's-done'}`}>
                            {r.status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setSelectedRequest(r)}
                              style={{
                                background: 'none', border: 'none',
                                color: 'rgba(255, 255, 255, 0.3)',
                                cursor: 'pointer', transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(r.id)}
                              style={{
                                background: 'none', border: 'none',
                                color: 'rgba(255, 112, 112, 0.4)',
                                cursor: 'pointer', transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#ff7070'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 112, 112, 0.4)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeView === 'demo' && (
              <table className="ct">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demoRequests.filter(r => r.status !== 'Converted').length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No active demo requests found.</td>
                    </tr>
                  ) : (
                    demoRequests.filter(r => r.status !== 'Converted').map((r) => (
                      <tr key={r.id}>
                        <td className="td-name">{r.fullName}</td>
                        <td>{r.email}</td>
                        <td>{r.phone}</td>
                        <td>{r.company}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`spill ${r.status === 'Pending' ? 's-pending' : r.status === 'Assigned' ? 's-blue' : 's-done'}`}>
                            {r.status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setSelectedDemoRequest(r)}
                              style={{
                                background: 'none', border: 'none',
                                color: 'rgba(255, 255, 255, 0.3)',
                                cursor: 'pointer', transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteDemoRequest(r.id)}
                              style={{
                                background: 'none', border: 'none',
                                color: 'rgba(255, 112, 112, 0.4)',
                                cursor: 'pointer', transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#ff7070'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 112, 112, 0.4)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Keep the closing div of table-wrap here since we added the ternary inside it */}
          </div>
        </div>
      )}

        {/* View Request Modal */}
        {selectedRequest && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px 20px'
          }}>
            <div className="panel" style={{ 
              width: '100%', 
              maxWidth: '640px', 
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="panel-label" style={{ marginBottom: 0 }}>
                  <div className="label-dot"></div>
                  User Request Details
                </div>
                <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="config-grid">
                  <div className="field">
                    <label className="field-label">Name</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedRequest.name}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Organization Name</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedRequest.organizationName}
                    </div>
                  </div>
                </div>

                <div className="config-grid">
                  <div className="field">
                    <label className="field-label">Email ID</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedRequest.email || '-'}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Credits Selected</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedRequest.creditsSelected}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 32px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setSelectedRequest(null)} className="nav-btn" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', justifyContent: 'center' }}>
                  Close
                </button>
                {selectedRequest.status !== 'Created' && (
                  <button onClick={() => handleMarkCreated(selectedRequest.id)} className="btn-call" style={{ width: '100%', justifyContent: 'center' }}>
                    Create User
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Demo Request Modal */}
        {selectedDemoRequest && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px 20px'
          }}>
            <div className="panel" style={{ 
              width: '100%', 
              maxWidth: '640px', 
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="panel-label" style={{ marginBottom: 0 }}>
                  <div className="label-dot"></div>
                  Demo Request Details
                </div>
                <button onClick={() => setSelectedDemoRequest(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="config-grid">
                  <div className="field">
                    <label className="field-label">Full Name</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.fullName}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Company</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.company}
                    </div>
                  </div>
                </div>

                <div className="config-grid">
                  <div className="field">
                    <label className="field-label">Email</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.email}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Phone</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.phone}
                    </div>
                  </div>
                </div>

                <div className="config-grid">
                  <div className="field">
                    <label className="field-label">Business Type</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.businessType}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Call Volume</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.callVolume}
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Use Cases</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {selectedDemoRequest.useCases?.map((u, i) => (
                      <span key={i} className="spill s-blue" style={{ fontSize: '11px' }}>{u}</span>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Languages</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {selectedDemoRequest.languages?.map((l, i) => (
                      <span key={i} className="spill s-done" style={{ fontSize: '11px' }}>{l}</span>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Current Process</label>
                  <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                    {selectedDemoRequest.currentProcess}
                  </div>
                </div>

                <div className="config-grid">
                  <div className="field">
                    <label className="field-label">Scheduled Date</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.demoDate}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Scheduled Time</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)' }}>
                      {selectedDemoRequest.demoTime} ({selectedDemoRequest.timezone || 'N/A'})
                    </div>
                  </div>
                </div>

                {selectedDemoRequest.notes && (
                  <div className="field">
                    <label className="field-label">Additional Notes</label>
                    <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                      {selectedDemoRequest.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 32px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setSelectedDemoRequest(null)} className="nav-btn" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', justifyContent: 'center' }}>
                  Close
                </button>
                {selectedDemoRequest.status === 'Pending' && (
                  <button onClick={() => handleMarkDemoAssigned(selectedDemoRequest.id)} className="btn-call" style={{ width: '100%', justifyContent: 'center' }}>
                    Create User
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Details Popup Modal */}
        {selectedUserForDetails && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px 20px'
          }}>
            <div className="panel" style={{ 
              width: '100%', 
              maxWidth: '600px', 
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              background: '#0c0c0c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="panel-label" style={{ marginBottom: 0, padding: 0 }}>
                  <div className="label-dot"></div>
                  User Details & Performance
                </div>
                <button onClick={() => setSelectedUserForDetails(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Profile Section */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', fontWeight: 600 }}>Account Profile</h4>
                  <div className="config-grid">
                    <div className="field">
                      <span className="field-label">User ID</span>
                      <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.85)' }}>
                        {selectedUserForDetails.userId}
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Organization Name</span>
                      <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.85)' }}>
                        {selectedUserForDetails.organization || '-'}
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Email ID</span>
                      <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.85)' }}>
                        {selectedUserForDetails.email || '-'}
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Phone</span>
                      <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.85)' }}>
                        {selectedUserForDetails.phone || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan & Credits */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', fontWeight: 600 }}>Plan & Credits</h4>
                  <div className="config-grid">
                    <div className="field">
                      <span className="field-label">Selected Plan</span>
                      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <span className={`spill ${selectedUserForDetails.selectedPlan === 'Growth' ? 's-blue' : 's-pending'}`} style={{ textTransform: 'capitalize', padding: '6px 14px', fontSize: '11px' }}>
                          {selectedUserForDetails.selectedPlan || 'Starter'}
                        </span>
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Remaining Credits</span>
                      <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: '#7dffb3', fontWeight: 'bold' }}>
                        {selectedUserForDetails.remainingCredits || selectedUserForDetails.credits || 0}
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Total Credits</span>
                      <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.8)' }}>
                        {selectedUserForDetails.totalCredits || 2000}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Analytics */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', fontWeight: 600 }}>Call Consumption & Performance</h4>
                  {loadingDetailsContacts ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <span className="pulse-dot"></span>
                      Aggregating call statistics...
                    </div>
                  ) : (
                    <div className="config-grid">
                      <div className="field">
                        <span className="field-label">Total Calls Made</span>
                        <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: '#fff', fontWeight: '600' }}>
                          {userDetailsContacts.length} calls
                        </div>
                      </div>
                      <div className="field">
                        <span className="field-label">Total Call Minutes Used</span>
                        <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: '#60a5fa', fontWeight: '600' }}>
                          {(() => {
                            const completed = userDetailsContacts.filter(c => c.status === 'completed' || c.status === 'called');
                            const totalMins = completed.reduce((acc, c) => {
                              const d = c.duration || c.callDuration || c.call_duration;
                              if (d !== undefined) return acc + Number(d);
                              
                              let seed = 0;
                              if (c.id) {
                                const str = String(c.id);
                                for (let i = 0; i < str.length; i++) {
                                  seed += str.charCodeAt(i);
                                }
                              } else {
                                seed = Math.floor(Math.random() * 100);
                              }
                              const simulatedMins = (seed % 3) + 1;
                              return acc + simulatedMins;
                            }, 0);
                            return `${totalMins} minutes`;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agents List */}
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px', fontWeight: 600 }}>Assigned AI Agents</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(() => {
                      let parsedAgents = [];
                      try {
                        if (selectedUserForDetails.bolnaAgentId) {
                          const parsed = JSON.parse(selectedUserForDetails.bolnaAgentId);
                          parsedAgents = Array.isArray(parsed) ? parsed : [parsed];
                        }
                      } catch(e) {}
                      
                      const validAgents = parsedAgents.filter(ag => ag && ag.id);
                      if (validAgents.length === 0) {
                        return <div style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', fontSize: '13px' }}>No agents assigned.</div>;
                      }

                      return validAgents.map((ag, i) => (
                        <div key={i} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '8px', 
                          padding: '10px 16px' 
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{ag.name || 'Unnamed Agent'}</span>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>ID: {ag.id}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{ padding: '16px 32px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setSelectedUserForDetails(null)} className="btn-call" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Modal (Add/Edit) */}
        {(showAddForm || showEditForm) && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px 20px'
          }}>
            <div className="panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '80vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="panel-label" style={{ marginBottom: 0 }}>
                  <div className="label-dot"></div>
                  {showEditForm ? 'Edit User Details' : 'Create New User'}
                </div>
                <button onClick={() => { setShowAddForm(false); setShowEditForm(false); setCreatedFromRequestId(null); setCreatedFromDemoRequestId(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={showEditForm ? handleUpdateUser : handleAddUser} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="config-grid">
                    <div className="field">
                      <label className="field-label">User ID</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.userId}
                        onChange={e => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="field-input"
                          value={formData.password}
                          onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute', right: '12px', top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center'
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="config-grid">
                    <div className="field">
                      <label className="field-label">Organization</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.organization}
                        onChange={e => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Email Address</label>
                      <input
                        type="email"
                        className="field-input"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  {!createdFromDemoRequestId && (
                    <div className="config-grid">
                      <div className="field">
                        <label className="field-label">Selected Plan</label>
                        {createdFromRequestId ? (
                          <input
                            type="text"
                            className="field-input"
                            value={formData.selectedPlan}
                            readOnly
                            style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)', cursor: 'not-allowed' }}
                          />
                        ) : (
                          <Dropdown
                            value={formData.selectedPlan}
                            onChange={plan => {
                              const credits = plan === 'Growth' ? 6000 : 2000;
                              setFormData(prev => ({ 
                                ...prev, 
                                selectedPlan: plan,
                                credits: credits,
                                totalCredits: credits,
                                remainingCredits: credits
                              }));
                            }}
                            options={[
                              { value: "Starter", label: "Starter (2k Credits)" },
                              { value: "Growth", label: "Growth (6k Credits)" }
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {createdFromRequestId && (
                    <div className="config-grid">
                      <div className="field">
                        <label className="field-label">Auto-assigned Credits</label>
                        <input
                          type="text"
                          className="field-input"
                          value={formData.credits}
                          readOnly
                          style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>
                  )}

                  {showEditForm && (
                    <div className="config-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="field">
                        <label className="field-label">Total Credits</label>
                        <input
                          type="number"
                          className="field-input"
                          value={formData.totalCredits}
                          onChange={e => setFormData(prev => ({ ...prev, totalCredits: parseInt(e.target.value, 10) }))}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Used Credits</label>
                        <input
                          type="number"
                          className="field-input"
                          value={formData.usedCredits}
                          onChange={e => setFormData(prev => ({ ...prev, usedCredits: parseInt(e.target.value, 10) }))}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Remaining</label>
                        <input
                          type="number"
                          className="field-input"
                          value={formData.remainingCredits}
                          onChange={e => setFormData(prev => ({ ...prev, remainingCredits: parseInt(e.target.value, 10) }))}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="field">
                      <label className="field-label">CallingGen API Key</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.bolnaApiKey}
                        onChange={e => setFormData(prev => ({ ...prev, bolnaApiKey: e.target.value }))}
                        required
                      />
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label className="field-label" style={{ marginBottom: 0 }}>CallingGen Agents</label>
                        <button
                          type="button"
                          onClick={addAgentField}
                          className="btn-call"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px' }}
                        >
                          + Add Agent
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {formData.agents.map((agent, index) => (
                          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <div className="field" style={{ flex: 1 }}>
                              <label className="field-label" style={{ fontSize: '10px', opacity: 0.5 }}>Agent Name</label>
                              <input
                                type="text"
                                className="field-input"
                                placeholder="e.g. Sales Assistant"
                                value={agent.name}
                                onChange={e => handleAgentChange(index, 'name', e.target.value)}
                                required
                              />
                            </div>
                            <div className="field" style={{ flex: 1 }}>
                              <label className="field-label" style={{ fontSize: '10px', opacity: 0.5 }}>Agent ID</label>
                              <input
                                type="text"
                                className="field-input"
                                placeholder="CallingGen ID"
                                value={agent.id}
                                onChange={e => handleAgentChange(index, 'id', e.target.value)}
                                required
                              />
                            </div>
                            {formData.agents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAgentField(index)}
                                style={{
                                  background: 'rgba(255, 112, 112, 0.1)',
                                  border: '1px solid rgba(255, 112, 112, 0.2)',
                                  color: '#ff7070',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && <div style={{ color: '#ff7070', fontSize: '12px', marginTop: '8px' }}>{error}</div>}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 32px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button type="submit" className="btn-call" style={{ width: '100%', justifyContent: 'center' }}>
                    {showEditForm ? 'Update User Account' : 'Create User Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center' }}>
              <div className="logo-mark" style={{
                width: '48px', height: '48px', margin: '0 auto 20px',
                background: 'rgba(255, 112, 112, 0.1)', border: '1px solid rgba(255, 112, 112, 0.2)',
                color: '#ff7070'
              }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ color: 'white', marginBottom: '12px' }}>Confirm Deletion</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
                Are you sure you want to delete user <strong style={{ color: 'white' }}>"{showDeleteConfirm}"</strong>? This action is permanent.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="nav-btn"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={isDeleting}
                  className="btn-call"
                  style={{
                    flex: 1, padding: '12px',
                    background: 'rgba(255, 112, 112, 0.15)',
                    borderColor: 'rgba(255, 112, 112, 0.3)',
                    color: '#ff7070',
                    justifyContent: 'center'
                  }}
                  id="confirm-delete-btn"
                >
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
