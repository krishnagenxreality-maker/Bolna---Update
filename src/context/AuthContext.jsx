import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bolna_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [deviceSession, setDeviceSession] = useState(() => {
    return localStorage.getItem('bolna_device_session');
  });

  const login = async (userId, password, forceLogout = false) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, { userId, password, forceLogout });
      if (response.data.success) {
        const userData = response.data.user;
        const sessionToken = response.data.deviceSession;
        
        setUser(userData);
        setDeviceSession(sessionToken);
        
        localStorage.setItem('bolna_user', JSON.stringify(userData));
        if (sessionToken) {
          localStorage.setItem('bolna_device_session', sessionToken);
        }
        
        return { 
          success: true, 
          role: userData.role, 
          isFirstLogin: response.data.isFirstLogin,
          userType: response.data.userType,
          deviceSession: sessionToken
        };
      }
    } catch (error) {
      if (error.response?.data?.sessionActive) {
        return { 
          success: false, 
          message: error.response.data.message, 
          sessionActive: true 
        };
      }
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    if (user?.userId) {
      try {
        await axios.post(`${API_BASE_URL}/api/logout`, { userId: user.userId });
      } catch (err) { }
    }
    setUser(null);
    setDeviceSession(null);
    localStorage.removeItem('bolna_user');
    localStorage.removeItem('bolna_device_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, deviceSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
