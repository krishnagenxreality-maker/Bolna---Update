import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import AdminPortal from './components/admin/AdminPortal';
import BolnaDashboard from './BolnaDashboard';
import HomePage from './components/home/HomePage';
import PricingPage from './components/pricing/PricingPage';
import UpgradePricingPage from './components/upgrade/UpgradePricingPage';
import SetPasswordPage from './components/auth/SetPasswordPage';

const ProtectedRoute = ({ children, role, skipFirstLoginCheck }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  // If user is first login, redirect to set-password unless already there
  if (user.isFirstLogin && user.role === 'user' && !skipFirstLoginCheck) {
    return <Navigate to="/set-password" />;
  }
  
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute role="admin">
            <AdminPortal />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute role="user">
            <BolnaDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/upgrade" 
        element={
          <ProtectedRoute role="user">
            <UpgradePricingPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/set-password" 
        element={
          <ProtectedRoute role="user" skipFirstLoginCheck={true}>
            <SetPasswordPage />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
