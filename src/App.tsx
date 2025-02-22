import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Directory from './pages/Directory';
import AdminPanel from './pages/AdminPanel';
import CompanySetup from './pages/company/CompanySetup';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanySettings from './pages/company/CompanySettings';
import IdeaHub from './pages/IdeaHub';
import IdeaRefinement from './pages/idea-hub/IdeaRefinement';
import MarketValidation from './pages/idea-hub/MarketValidation';
import BusinessGenerator from './pages/idea-hub/BusinessGenerator';
import AIDiscussion from './pages/idea-hub/AIDiscussion';
import IdeaCanvas from './pages/idea-hub/IdeaCanvas';
import MarketResearch from './pages/idea-hub/MarketResearch';
import BusinessModel from './pages/idea-hub/BusinessModel';
import PitchDeck from './pages/idea-hub/PitchDeck';
import CofounderBot from './pages/idea-hub/CofounderBot';
import Community from './pages/Community';
import CommunityPage from './pages/community/CommunityPage';
import Post from './pages/community/Post';
import NewPost from './pages/community/NewPost';
import Messages from './pages/Messages';
import Layout from './components/Layout';
import TaskCreation from './components/TaskCreation';
import GoogleCallback from './pages/auth/GoogleCallback';

function PrivateRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { user, isAdmin, isSuperAdmin } = useAuthStore();

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/dashboard" />;

  return children;
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
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
          <Route path="community/:slug" element={<CommunityPage />} />
          <Route path="community/post/:id" element={<Post />} />
          <Route path="community/new-post" element={<NewPost />} />
          <Route path="idea-hub" element={<IdeaHub />} />
          <Route path="idea-hub/refinement" element={<IdeaRefinement />} />
          <Route path="idea-hub/market-validation" element={<MarketValidation />} />
          <Route path="idea-hub/business-generator" element={<BusinessGenerator />} />
          <Route path="idea-hub/ai-discussion" element={<AIDiscussion />} />
          <Route path="idea-hub/canvas" element={<IdeaCanvas />} />
          <Route path="idea-hub/market-research" element={<MarketResearch />} />
          <Route path="idea-hub/business-model" element={<BusinessModel />} />
          <Route path="idea-hub/pitch-deck" element={<PitchDeck />} />
          <Route path="idea-hub/cofounder-bot" element={<CofounderBot />} />
          <Route path="tasks/new" element={<TaskCreation />} />
          <Route path="tasks/new/company" element={<TaskCreation isCompanyView={true} />} />
          <Route path="company">
            <Route path="setup" element={<CompanySetup />} />
            <Route path="dashboard" element={<CompanyDashboard />} />
            <Route path="settings" element={<CompanySettings />} />
          </Route>
          <Route path="admin" element={
            <PrivateRoute adminOnly>
              <AdminPanel />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </div>
  );
}