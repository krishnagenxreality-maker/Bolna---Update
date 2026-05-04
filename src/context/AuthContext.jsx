import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bolna_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (userId, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', { userId, password });
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('bolna_user', JSON.stringify(userData));
        return { success: true, role: userData.role, isFirstLogin: response.data.isFirstLogin };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bolna_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
