import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import Directory from './pages/Directory';
import AdminPanel from './pages/AdminPanel';
import CompanySetup from './pages/company/CompanySetup';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanySettings from './pages/company/CompanySettings';
import IdeaHub from './pages/IdeaHub';
import Community from './pages/Community';
import Messages from './pages/Messages';
import Layout from './components/Layout';
import GoogleCallback from './pages/auth/GoogleCallback';

function App() {
  const { user, profile } = useAuthStore();

  // If user is not logged in, show login page
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If user is logged in but hasn't completed profile setup and isn't on the setup page,
  // redirect to setup
  if (!profile?.full_name && window.location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="directory" element={<Directory />} />
          <Route path="messages" element={<Messages />} />
          <Route path="community" element={<Community />} />
          <Route path="idea-hub/*" element={<IdeaHub />} />
          <Route path="company">
            <Route path="setup" element={<CompanySetup />} />
            <Route path="dashboard" element={<CompanyDashboard />} />
            <Route path="settings" element={<CompanySettings />} />
          </Route>
          <Route path="admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuthStore();
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to profile setup if profile is incomplete
  if (!profile?.full_name) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
}

export default App;