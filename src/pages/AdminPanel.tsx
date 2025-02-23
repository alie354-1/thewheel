import React, { useState } from 'react';
import { useAuthStore } from '../lib/store';
import { 
  Settings,
  Users,
  MessageSquare,
  Slack,
  Bot,
  CloudCog,
  Key,
  Shield
} from 'lucide-react';
import AppCredentialsSettings from '../components/admin/AppCredentialsSettings';
import FeatureFlagsSettings from '../components/admin/FeatureFlagsSettings';
import UserManagement from '../components/admin/UserManagement';
import OpenAISettings from '../components/admin/OpenAISettings';

export default function AdminPanel() {
  const { profile } = useAuthStore();
  const [activeSection, setActiveSection] = useState('users');

  const sections = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'openai', name: 'OpenAI Settings', icon: Bot },
    { id: 'credentials', name: 'App Credentials', icon: Key },
    { id: 'feature-flags', name: 'Feature Flags', icon: Settings }
  ];

  if (!profile?.role || !['admin', 'superadmin'].includes(profile.role)) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Access Restricted
                </h3>
                <p className="mt-2 text-sm text-yellow-700">
                  You don't have permission to access the admin panel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Panel
          </h1>

          <div className="flex space-x-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeSection === section.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <section.icon className="h-5 w-5 mr-2" />
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'openai' && <OpenAISettings />}
          {activeSection === 'credentials' && <AppCredentialsSettings />}
          {activeSection === 'feature-flags' && <FeatureFlagsSettings />}
        </div>
      </div>
    </div>
  );
}