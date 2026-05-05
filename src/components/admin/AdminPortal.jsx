import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { SmokeBackground } from '../layout/SmokeBackground';
import {
  Users, UserPlus, Trash2, LogOut, X, Shield,
  Building2, Key, Monitor, Pencil, Eye, EyeOff
} from 'lucide-react';
import '../../styles/BolnaDashboard.css';

export default function AdminPortal() {
  const { logout, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeView, setActiveView] = useState('users');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [createdFromRequestId, setCreatedFromRequestId] = useState(null);

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    organization: '',
    email: '',
    bolnaApiKey: '',
    agents: [{ name: '', id: '' }],
    credits: 0
  });

  const [editingUserId, setEditingUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

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
    setFormData({
      userId: req?.name || '',
      password: '',
      organization: req?.organizationName || '',
      email: req?.email || '',
      bolnaApiKey: '',
      agents: [{ name: '', id: '' }],
      credits: parseCreditsFromRequest(req?.creditsSelected)
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setSelectedRequest(null);
    setCreatedFromRequestId(requestId);
    setShowAddForm(true);
    setActiveView('users'); // Switch to users view since we are creating a user
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
    setFormData({ userId: '', password: '', organization: '', email: '', bolnaApiKey: '', agents: [{ name: '', id: '' }], credits: 0 });
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
      credits: user.credits || 0
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
        bolnaAgentId: JSON.stringify(agents)
      };
      await axios.post(`${API_BASE_URL}/api/users`, payload);
      setShowAddForm(false);
      fetchUsers();

      if (createdFromRequestId) {
        await axios.delete(`${API_BASE_URL}/api/requests/${createdFromRequestId}`);
        setCreatedFromRequestId(null);
        fetchRequests();
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
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-box">
            <div className="stat-num sn-white">{users.length}</div>
            <div className="stat-lbl">Total Users</div>
          </div>
          <div className="stat-box">
            <div className="stat-num sn-blue">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-lbl">Admins</div>
          </div>
          <div className="stat-box">
            <div className="stat-num sn-green">{users.filter(u => u.role === 'user').length}</div>
            <div className="stat-lbl">Regular Users</div>
          </div>
        </div>

        <div className="panel panel-table">
          <div className="panel-head">
            <div className="panel-label" style={{ display: 'flex', gap: '20px', marginBottom: 0, borderBottom: 'none' }}>
              <button
                onClick={() => setActiveView('users')}
                className={`tab-btn ${activeView === 'users' ? 'active' : ''}`}
                style={{ margin: 0 }}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveView('requests')}
                className={`tab-btn ${activeView === 'requests' ? 'active' : ''}`}
                style={{ margin: 0 }}
              >
                New User Requests
              </button>
            </div>
            {activeView === 'users' && (
              <button onClick={handleOpenAdd} className="btn-call" style={{ padding: '8px 20px', fontSize: '13px' }}>
                <UserPlus size={16} /> Create User
              </button>
            )}
          </div>

          <div className="table-wrap">
            {activeView === 'users' ? (
              <table className="ct">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Organization</th>
                    <th>Bolna API Key</th>
                    <th>Bolna Agent ID</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId}>
                      <td className="td-name">{u.userId}</td>
                      <td>{u.organization || '-'}</td>
                      <td className="td-phone" style={{ fontSize: '11px' }}>
                        {u.bolnaApiKey ? `••••${u.bolnaApiKey.slice(-4)}` : '-'}
                      </td>
                      <td className="td-phone" style={{ fontSize: '11px' }}>{renderAgentId(u.bolnaAgentId)}</td>
                      <td>
                        <span className={`spill ${u.role === 'admin' ? 's-calling' : 's-pending'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(u)}
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
                              onClick={() => setShowDeleteConfirm(u.userId)}
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
            ) : (
              <table className="ct">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Organization</th>
                    <th>Credits Selected</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">No requests found.</td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id}>
                        <td className="td-name">{r.name}</td>
                        <td>{r.organizationName}</td>
                        <td className="td-phone">{r.creditsSelected}</td>
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

            {/* Keep the closing div of table-wrap here since we added the ternary inside it */}
          </div>
        </div>

        {/* View Request Modal */}
        {selectedRequest && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="panel" style={{ 
              width: '100%', 
              maxWidth: '540px', 
              padding: '32px',
              maxHeight: '85vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div className="panel-label" style={{ marginBottom: 0 }}>
                  <div className="label-dot"></div>
                  User Request Details
                </div>
                <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                <div className="field">
                  <label className="field-label">Purpose of Using This</label>
                  <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                    {selectedRequest.purpose}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Script Description</label>
                  <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                    {selectedRequest.scriptContent}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Purpose of the Call</label>
                  <div className="field-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                    {selectedRequest.callPurpose || '-'}
                  </div>
                </div>

                <button onClick={() => setSelectedRequest(null)} className="nav-btn" style={{ width: '100%', marginTop: '12px', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', justifyContent: 'center' }}>
                  Close
                </button>
                {selectedRequest.status !== 'Created' && (
                  <button onClick={() => handleMarkCreated(selectedRequest.id)} className="btn-call" style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
                    Create User
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Modal (Add/Edit) */}
        {(showAddForm || showEditForm) && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="panel" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div className="panel-label" style={{ marginBottom: 0 }}>
                  <div className="label-dot"></div>
                  {showEditForm ? 'Edit User Details' : 'Create New User'}
                </div>
                <button onClick={() => { setShowAddForm(false); setShowEditForm(false); setCreatedFromRequestId(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={showEditForm ? handleUpdateUser : handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                <div className="field">
                  <label className="field-label">Organization Name</label>
                  <input
                    type="text"
                    className="field-input"
                    value={formData.organization}
                    onChange={e => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label">Email ID</label>
                  <input
                    type="email"
                    className="field-input"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="field">
                    <label className="field-label">Bolna API Key</label>
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
                      <label className="field-label" style={{ marginBottom: 0 }}>Bolna Agents</label>
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
                          <div style={{ flex: 1 }}>
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
                          <div style={{ flex: 1 }}>
                            <label className="field-label" style={{ fontSize: '10px', opacity: 0.5 }}>Agent ID</label>
                            <input
                              type="text"
                              className="field-input"
                              placeholder="Bolna ID"
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

                <button type="submit" className="btn-call" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}>
                  {showEditForm ? 'Update User Account' : 'Create User Account'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
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
