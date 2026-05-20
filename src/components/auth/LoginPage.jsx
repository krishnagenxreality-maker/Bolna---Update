import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SmokeBackground } from '../layout/SmokeBackground';
import { LogIn, User, Lock, AlertCircle, Shield, ArrowLeft, Home, KeyRound, CheckCircle, Timer } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import '../../styles/BolnaDashboard.css';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForceLogout, setShowForceLogout] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || -1;

  // Forgot Password State Flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter details, 2 = Verify OTP, 3 = Success
  const [forgotUserIdOrEmail, setForgotUserIdOrEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resolvedUserId, setResolvedUserId] = useState('');

  // Countdown timer for OTP expiry
  React.useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      setForgotError('OTP verification code has expired. Please request a new one.');
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(userId, password, false);
    
    if (result.success) {
      handleLoginSuccess(result);
    } else {
      if (result.sessionActive) {
        setShowForceLogout(true);
      }
      setError(result.message);
      setIsLoading(false);
    }
  };

  const handleForceLogoutLogin = async () => {
    setError('');
    setIsLoading(true);
    const result = await login(userId, password, true);
    if (result.success) {
      handleLoginSuccess(result);
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (result) => {
    if (result.userType === 'education') {
      logout();
      setError('Education portal is in development');
      setIsLoading(false);
      return;
    }

    if (result.isFirstLogin && result.role === 'user') {
      navigate('/set-password');
    } else {
      if (result.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setIsForgotPasswordLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password/request`, {
        userIdOrEmail: forgotUserIdOrEmail
      });

      if (res.data.success) {
        setForgotSuccess('Verification code sent successfully!');
        setMaskedEmail(res.data.emailMasked);
        setResolvedUserId(res.data.userId);
        setForgotStep(2);
        setTimeLeft(600); // 10 minutes countdown
        setTimerActive(true);
      } else {
        setForgotError(res.data.message || 'Failed to send verification code');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleForgotVerify = async () => {
    setForgotError('');
    setForgotSuccess('');
    setIsForgotPasswordLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password/verify`, {
        userId: resolvedUserId,
        otp: forgotOtp
      });

      if (res.data.success) {
        setOtpVerified(true);
        setForgotSuccess('OTP verified successfully! You can now click Change Password.');
      } else {
        setForgotError(res.data.message || 'Invalid OTP');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!otpVerified) return;
    setForgotError('');
    setForgotSuccess('');
    setIsForgotPasswordLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
        userId: resolvedUserId,
        otp: forgotOtp,
        newPassword: forgotNewPassword
      });

      if (res.data.success) {
        setForgotSuccess('Password updated successfully! Redirecting to login...');
        setForgotStep(3);
        setTimerActive(false);
        setTimeout(() => {
          setIsForgotPassword(false);
          setForgotStep(1);
          setForgotUserIdOrEmail('');
          setForgotNewPassword('');
          setForgotOtp('');
          setOtpVerified(false);
          setForgotSuccess('');
          setForgotError('');
        }, 2500);
      } else {
        setForgotError(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setIsForgotPasswordLoading(false);
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
              onClick={() => navigate(from)} 
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

          {!isForgotPassword ? (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                    <Lock size={12} /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '11px',
                      fontFamily: 'Outfit',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      padding: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#10B981'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ marginTop: '8px' }}
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

              {showForceLogout && (
                <button
                  type="button"
                  onClick={handleForceLogoutLogin}
                  className="btn-call"
                  style={{ 
                    width: '100%', 
                    marginTop: '0px',
                    justifyContent: 'center',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ff7070',
                    border: '1px solid rgba(255, 112, 112, 0.2)',
                  }}
                >
                  Logout Other Devices & Sign In
                </button>
              )}
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              {forgotStep === 1 && (
                <form onSubmit={handleForgotRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="field">
                    <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={12} /> User ID or Email
                    </label>
                    <input
                      type="text"
                      className="field-input"
                      value={forgotUserIdOrEmail}
                      onChange={(e) => setForgotUserIdOrEmail(e.target.value)}
                      placeholder="Enter user id or registered email"
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={12} /> New Password
                    </label>
                    <input
                      type="password"
                      className="field-input"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {forgotError && (
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
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isForgotPasswordLoading}
                    className="btn-call"
                    style={{ 
                      width: '100%', 
                      marginTop: '10px',
                      justifyContent: 'center'
                    }}
                  >
                    {isForgotPasswordLoading ? (
                      <>
                        <div className="pulse-dot"></div>
                        Requesting OTP...
                      </>
                    ) : (
                      <>
                        <KeyRound size={18} />
                        Verify Credentials
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '13px',
                      fontFamily: 'Outfit',
                      cursor: 'pointer',
                      textAlign: 'center',
                      marginTop: '5px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                  >
                    Back to Sign In
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.65)',
                    lineHeight: '1.4'
                  }}>
                    A 6-digit verification OTP has been sent to the email address: 
                    <strong style={{ color: '#10B981', display: 'block', marginTop: '4px', fontSize: '14px' }}>{maskedEmail}</strong>
                  </div>

                  <div className="field">
                    <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <KeyRound size={12} /> Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      className="field-input"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      disabled={otpVerified || timeLeft === 0}
                      style={{
                        letterSpacing: '12px',
                        textAlign: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: otpVerified ? '#10B981' : 'white'
                      }}
                      required
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: timeLeft < 120 ? '#EF4444' : 'rgba(255, 255, 255, 0.5)'
                  }}>
                    <Timer size={14} className={timeLeft < 120 && timeLeft > 0 ? 'pulse-icon' : ''} />
                    <span>Time remaining: {formatTime(timeLeft)}</span>
                  </div>

                  {forgotError && (
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
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="spill s-success" style={{ 
                      width: '100%', 
                      padding: '10px', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <CheckCircle size={14} />
                      <span>{forgotSuccess}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleForgotVerify}
                      disabled={isForgotPasswordLoading || otpVerified || timeLeft === 0 || forgotOtp.length !== 6}
                      className="btn-call"
                      style={{ 
                        flex: 1,
                        justifyContent: 'center',
                        background: otpVerified ? 'rgba(16, 185, 129, 0.1)' : '',
                        color: otpVerified ? '#10B981' : '',
                        border: otpVerified ? '1px solid rgba(16, 185, 129, 0.2)' : ''
                      }}
                    >
                      {isForgotPasswordLoading ? 'Verifying...' : otpVerified ? 'Verified' : 'Verify OTP'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleForgotReset}
                      disabled={isForgotPasswordLoading || !otpVerified}
                      className="btn-call"
                      style={{ 
                        flex: 1,
                        justifyContent: 'center',
                        boxShadow: otpVerified ? '0 0 15px rgba(16, 185, 129, 0.4)' : '',
                        background: otpVerified ? '#10B981' : 'rgba(255,255,255,0.05)',
                        color: otpVerified ? 'white' : 'rgba(255,255,255,0.3)',
                        border: otpVerified ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      Change Password
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setOtpVerified(false);
                      setForgotOtp('');
                      setForgotError('');
                      setForgotSuccess('');
                      setTimerActive(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '13px',
                      fontFamily: 'Outfit',
                      cursor: 'pointer',
                      textAlign: 'center',
                      marginTop: '5px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                  >
                    Change ID / Password
                  </button>
                </div>
              )}

              {forgotStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0', textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                  }}>
                    <CheckCircle size={36} />
                  </div>
                  <h3 style={{ fontSize: '18px', color: 'white', fontFamily: 'Outfit', margin: 0 }}>Password Updated!</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.5', margin: 0 }}>
                    Your password has been successfully reset. A confirmation email has been dispatched to your registered address.
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic', margin: 0 }}>
                    Redirecting to login portal...
                  </p>
                </div>
              )}
            </div>
          )}

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
