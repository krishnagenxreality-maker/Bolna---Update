import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SmokeBackground } from '../layout/SmokeBackground';
import { Lock, AlertCircle, Shield, KeyRound } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LegalModal from '../common/LegalModal';
import '../../styles/BolnaDashboard.css';

export default function SetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState('terms');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const openLegal = (type) => {
    setLegalType(type);
    setLegalOpen(true);
  };

  // If no user is logged in or user is not a first-time login user, redirect
  if (!user || !user.isFirstLogin) {
    return <Navigate to="/login" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!consentChecked) {
      setError('You must agree to the terms and consent policy to proceed.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/set-password/${user.userId}`, {
        password: newPassword
      });

      if (response.data.success) {
        // Password updated successfully
        // We log out the user so they can log in with their new password
        // as per the requirement "Update the user's password in the database... Redirect user to normal login flow"
        logout();
        navigate('/login', { state: { message: 'Password set successfully. Please log in with your new password.' } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <SmokeBackground />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 10,
        padding: '20px'
      }}>
        <div className="panel" style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <div className="logo-mark" style={{ 
              width: '56px', height: '56px', 
              margin: '0 auto 16px',
              borderRadius: '12px'
            }}>
              <KeyRound size={28} />
            </div>
            <h1 className="hdr-title" style={{ fontSize: '24px', marginBottom: '8px' }}>
              Set New<span className="hdr-accent"> Password</span>
            </h1>
            <p style={{ 
              fontSize: '13px', 
              color: 'rgba(255, 255, 255, 0.35)',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Please set a new password for your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div className="field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={12} /> New Password
              </label>
              <input
                type="password"
                className="field-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={12} /> Confirm Password
              </label>
              <input
                type="password"
                className="field-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="legal-consent"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                style={{
                  marginTop: '4px',
                  cursor: 'pointer',
                  accentColor: '#fff',
                  width: '16px',
                  height: '16px',
                  flexShrink: 0
                }}
              />
              <label htmlFor="legal-consent" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.5', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', userSelect: 'none' }}>
                I agree to the{' '}
                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal('terms'); }} style={{ color: '#fff', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Terms & Conditions</span>,{' '}
                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal('privacy'); }} style={{ color: '#fff', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Privacy Policy</span>,{' '}
                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal('refund'); }} style={{ color: '#fff', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Refund Policy</span>, and{' '}
                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal('consent'); }} style={{ color: '#fff', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>AI Communication Consent</span>.
              </label>
            </div>

            {error && (
              <div className="spill s-failed" style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '8px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !consentChecked}
              className="btn-call"
              style={{ 
                width: '100%', 
                marginTop: '10px',
                justifyContent: 'center',
                opacity: (isLoading || !consentChecked) ? 0.5 : 1,
                cursor: (isLoading || !consentChecked) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <div className="pulse-dot"></div>
                  Setting Password...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Set Password
                </>
              )}
            </button>
          </form>

          <LegalModal
            isOpen={legalOpen}
            onClose={() => setLegalOpen(false)}
            docType={legalType}
          />

          <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <button 
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px',
                fontFamily: 'Outfit',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Cancel and Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
