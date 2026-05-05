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
import EducationPortalPage from './components/education/EducationPortalPage';
import EducationDashboardLanding from './components/education/EducationDashboardLanding';
import EducationDashboard from './components/education/dashboard/EducationDashboard';
import StudentsManager from './components/education/students/StudentsManager';
import StudentAttendance from './components/education/students/StudentAttendance';
import { EducationLayout } from './components/education/layout/EducationLayout';

const ProtectedRoute = ({ children, role, skipFirstLoginCheck }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  // If user is first login, redirect to set-password unless already there
  if (user.isFirstLogin && user.role === 'user' && !skipFirstLoginCheck) {
    return <Navigate to="/set-password" />;
  }
  
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to={user.userType === 'education' ? '/education-dashboard' : '/dashboard'} />;
  }
  
  // If user is regular and on education dashboard or vice versa
  const currentPath = window.location.pathname;
  if (user.role === 'user') {
    if (user.userType === 'education' && currentPath === '/dashboard') return <Navigate to="/education-dashboard" />;
    if (user.userType !== 'education' && currentPath === '/education-dashboard') return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/education-portal" element={<EducationPortalPage />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/admin' : (user.userType === 'education' ? '/education-dashboard' : '/dashboard')} />} />
      
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
        path="/education-dashboard" 
        element={
          <ProtectedRoute role="user">
            <EducationDashboardLanding />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/education/dashboard" 
        element={
          <ProtectedRoute role="user">
            <EducationLayout>
              <EducationDashboard />
            </EducationLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/education/students" 
        element={
          <ProtectedRoute role="user">
            <EducationLayout>
              <StudentsManager />
            </EducationLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/education/attendance" 
        element={
          <ProtectedRoute role="user">
            <EducationLayout>
              <StudentAttendance />
            </EducationLayout>
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
