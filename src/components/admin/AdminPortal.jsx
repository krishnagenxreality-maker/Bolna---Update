import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    organization: '',
    bolnaApiKey: '',
    bolnaAgentId: ''
  });

  const [editingUserId, setEditingUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ userId: '', password: '', organization: '', bolnaApiKey: '', bolnaAgentId: '' });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowAddForm(true);
  };

  const handleOpenEdit = (user) => {
    setFormData({
      userId: user.userId,
      password: user.password,
      organization: user.organization || '',
      bolnaApiKey: user.bolnaApiKey || '',
      bolnaAgentId: user.bolnaAgentId || ''
    });
    setEditingUserId(user.userId);
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowEditForm(true);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/users', formData);
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.put(`http://localhost:5000/api/users/${editingUserId}`, formData);
      setShowEditForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const confirmDeleteUser = async () => {
    const userId = showDeleteConfirm;
    setIsDeleting(userId);
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
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
            <div className="panel-label">
              <div className="label-dot"></div>
              User Management
            </div>
            <button onClick={handleOpenAdd} className="btn-call" style={{ padding: '8px 20px', fontSize: '13px' }}>
              <UserPlus size={16} /> Create User
            </button>
          </div>

          <div className="table-wrap">
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
                    <td className="td-phone" style={{ fontSize: '11px' }}>{u.bolnaAgentId || '-'}</td>
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
          </div>
        </div>

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
                <button onClick={() => { setShowAddForm(false); setShowEditForm(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
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
                      onChange={e => setFormData({ ...formData, userId: e.target.value })}
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
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    required
                  />
                </div>

                <div className="config-grid">
                  <div className="field">
                    <label className="field-label">Bolna API Key</label>
                    <input
                      type="text"
                      className="field-input"
                      value={formData.bolnaApiKey}
                      onChange={e => setFormData({ ...formData, bolnaApiKey: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Bolna Agent ID</label>
                    <input
                      type="text"
                      className="field-input"
                      value={formData.bolnaAgentId}
                      onChange={e => setFormData({ ...formData, bolnaAgentId: e.target.value })}
                      required
                    />
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
