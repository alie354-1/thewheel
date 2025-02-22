import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCw, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

interface FeatureGroup {
  name: string;
  description: string;
  features: {
    key: string;
    name: string;
    description: string;
  }[];
}

const featureGroups: FeatureGroup[] = [
  {
    name: 'Idea Hub',
    description: 'Features for ideation and validation',
    features: [
      { key: 'ideaRefinement', name: 'Idea Refinement', description: 'AI-powered idea exploration and refinement' },
      { key: 'marketValidation', name: 'Market Validation', description: 'Market research and validation tools' },
      { key: 'businessModel', name: 'Business Model', description: 'Business model development tools' },
      { key: 'pitchDeck', name: 'Pitch Deck', description: 'Pitch deck creation and management' },
      { key: 'aiDiscussion', name: 'AI Discussion', description: 'AI co-founder discussions' },
      { key: 'ideaCanvas', name: 'Idea Canvas', description: 'Visual idea mapping tool' },
      { key: 'marketResearch', name: 'Market Research', description: 'Market analysis tools' }
    ]
  },
  {
    name: 'Community',
    description: 'Community engagement features',
    features: [
      { key: 'communityDiscussions', name: 'Discussions', description: 'Community forums and discussions' },
      { key: 'communityEvents', name: 'Events', description: 'Community events management' },
      { key: 'communityResources', name: 'Resources', description: 'Shared community resources' },
      { key: 'communityMentoring', name: 'Mentoring', description: 'Mentorship connections' }
    ]
  },
  {
    name: 'Company',
    description: 'Core company management features',
    features: [
      { key: 'companySetup', name: 'Company Setup', description: 'Initial company setup process' },
      { key: 'companyDashboard', name: 'Dashboard', description: 'Company overview and metrics' },
      { key: 'companyDocuments', name: 'Documents', description: 'Document management' },
      { key: 'companyTeam', name: 'Team', description: 'Team management' },
      { key: 'companyProgress', name: 'Progress', description: 'Company progress tracking' }
    ]
  },
  {
    name: 'AI Features',
    description: 'AI-powered capabilities',
    features: [
      { key: 'aiCofounder', name: 'AI Co-founder', description: 'AI-powered startup guidance' },
      { key: 'aiTaskGeneration', name: 'Task Generation', description: 'AI task recommendations' },
      { key: 'aiStrategicAnalysis', name: 'Strategic Analysis', description: 'AI business analysis' }
    ]
  },
  {
    name: 'Tools',
    description: 'Platform tools and integrations',
    features: [
      { key: 'toolRecommendations', name: 'Recommendations', description: 'Tool recommendations' },
      { key: 'toolIntegrations', name: 'Integrations', description: 'Third-party integrations' },
      { key: 'toolMarketplace', name: 'Marketplace', description: 'Tool marketplace' }
    ]
  },
  {
    name: 'Directory',
    description: 'Platform directories',
    features: [
      { key: 'userDirectory', name: 'User Directory', description: 'User search and profiles' },
      { key: 'companyDirectory', name: 'Company Directory', description: 'Company listings' },
      { key: 'mentorDirectory', name: 'Mentor Directory', description: 'Mentor network' }
    ]
  },
  {
    name: 'Messaging',
    description: 'Communication features',
    features: [
      { key: 'directMessages', name: 'Direct Messages', description: 'One-on-one messaging' },
      { key: 'groupChats', name: 'Group Chats', description: 'Group messaging' },
      { key: 'notifications', name: 'Notifications', description: 'System notifications' }
    ]
  }
];

export default function FeatureFlagsSettings() {
  const { isSuperAdmin, setFeatureFlags } = useAuthStore();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(featureGroups[0].name);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('role', 'superadmin')
        .single();

      if (error) throw error;

      if (profile?.settings?.feature_flags) {
        setFlags(profile.settings.feature_flags);
      }
    } catch (error: any) {
      console.error('Error loading feature flags:', error);
      setError('Failed to load feature flags');
    }
  };

  const handleSave = async () => {
    if (!isSuperAdmin) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('settings')
        .eq('role', 'superadmin')
        .single();

      if (profileError) throw profileError;

      const settings = {
        ...profile?.settings,
        feature_flags: flags
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ settings })
        .eq('role', 'superadmin');

      if (updateError) throw updateError;

      setFeatureFlags(flags);
      setSuccess('Feature flags updated successfully!');
    } catch (error: any) {
      console.error('Error saving feature flags:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlag = (key: string) => {
    setFlags(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Feature Flags
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 rounded-md">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {featureGroups.map((group) => (
            <button
              key={group.name}
              onClick={() => setActiveTab(group.name)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === group.name
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {group.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      {featureGroups.map((group) => (
        <div
          key={group.name}
          className={activeTab === group.name ? 'block' : 'hidden'}
        >
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
            <p className="text-sm text-gray-500">{group.description}</p>
          </div>

          <div className="space-y-4">
            {group.features.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="text-sm font-medium text-gray-900">{feature.name}</h5>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
                <button
                  onClick={() => toggleFlag(feature.key)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    flags[feature.key] ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      flags[feature.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}