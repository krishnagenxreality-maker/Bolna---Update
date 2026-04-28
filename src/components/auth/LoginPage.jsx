import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SmokeBackground } from '../layout/SmokeBackground';
import { LogIn, User, Lock, AlertCircle, Shield, ArrowLeft, Home } from 'lucide-react';
import '../../styles/BolnaDashboard.css';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(userId, password);
    
    if (!result.success) {
      setError(result.message);
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
          {/* Navigation Buttons */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            right: '20px', 
            display: 'flex', 
            justifyContent: 'space-between',
            pointerEvents: 'none'
          }}>
            <button 
              onClick={() => navigate(-1)} 
              title="Back"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255,255,255,0.2)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontFamily: 'Outfit',
                pointerEvents: 'auto',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button 
              onClick={() => navigate('/')} 
              title="Home"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255,255,255,0.2)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontFamily: 'Outfit',
                pointerEvents: 'auto',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
            >
              <Home size={16} /> Home
            </button>
          </div>

          <div style={{ marginBottom: '32px', marginTop: '10px' }}>
            <div className="logo-mark" style={{ 
              width: '56px', height: '56px', 
              margin: '0 auto 16px',
              borderRadius: '12px'
            }}>
              <Shield size={28} />
            </div>
            <h1 className="hdr-title" style={{ fontSize: '24px', marginBottom: '8px' }}>
              Calling<span className="hdr-accent"> Gen</span>
            </h1>
            <p style={{ 
              fontSize: '13px', 
              color: 'rgba(255, 255, 255, 0.35)',
              fontFamily: 'Outfit, sans-serif'
            }}>
              Enter your credentials to access the portal
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div className="field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={12} /> User ID
              </label>
              <input
                type="text"
                className="field-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User id"
                required
              />
            </div>

            <div className="field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={12} /> Password
              </label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
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
              disabled={isLoading}
              className="btn-call"
              style={{ 
                width: '100%', 
                marginTop: '10px',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <>
                  <div className="pulse-dot"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <div className="hdr-badge" style={{ display: 'inline-block' }}>
              Secure Access Only
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
