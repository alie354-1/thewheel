import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCw, AlertCircle, Check, Layers, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { FeatureFlags } from '../../lib/store';

interface FeatureGroup {
  name: string;
  description: string;
  features: {
    key: keyof FeatureFlags;
    name: string;
    description: string;
  }[];
}

const featureGroups: FeatureGroup[] = [
  {
    name: 'Navigation',
    description: 'Control visibility of navigation items',
    features: [
      { key: 'ideaHub', name: 'Idea Hub', description: 'AI-powered idea exploration and validation' },
      { key: 'community', name: 'Community', description: 'Community engagement and networking' },
      { key: 'messages', name: 'Messages', description: 'Direct messaging system' },
      { key: 'directory', name: 'Directory', description: 'User and company directory' },
      { key: 'library', name: 'Resource Library', description: 'Knowledge base and resources' },
      { key: 'marketplace', name: 'Marketplace', description: 'Service provider marketplace' },
      { key: 'legalHub', name: 'Legal Hub', description: 'Legal templates and guidance' },
      { key: 'devHub', name: 'Dev Hub', description: 'Development tools and resources' },
      { key: 'utilities', name: 'Utilities', description: 'Helper tools and utilities' },
      { key: 'financeHub', name: 'Finance Hub', description: 'Financial tools and tracking' },
      { key: 'adminPanel', name: 'Admin Panel', description: 'Administrative controls' }
    ]
  },
  {
    name: 'Components',
    description: 'Control visibility of specific components',
    features: [
      { key: 'aiCofounder', name: 'AI Co-founder', description: 'AI-powered guidance and feedback' },
      { key: 'marketResearch', name: 'Market Research', description: 'Market analysis tools' },
      { key: 'pitchDeck', name: 'Pitch Deck', description: 'Presentation builder' },
      { key: 'documentStore', name: 'Document Store', description: 'Document management' },
      { key: 'teamManagement', name: 'Team Management', description: 'Team member controls' }
    ]
  }
];

const defaultFeatureFlags: FeatureFlags = {
  ideaHub: { enabled: true, visible: true },
  community: { enabled: true, visible: true },
  messages: { enabled: true, visible: true },
  directory: { enabled: true, visible: true },
  library: { enabled: false, visible: false },
  marketplace: { enabled: false, visible: false },
  legalHub: { enabled: false, visible: false },
  devHub: { enabled: false, visible: false },
  utilities: { enabled: false, visible: false },
  financeHub: { enabled: false, visible: false },
  adminPanel: { enabled: true, visible: true },
  aiCofounder: { enabled: true, visible: true },
  marketResearch: { enabled: true, visible: true },
  pitchDeck: { enabled: true, visible: true },
  documentStore: { enabled: true, visible: true },
  teamManagement: { enabled: true, visible: true }
};

export default function FeatureFlagsSettings() {
  const { featureFlags, setFeatureFlags } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(featureGroups[0].name);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'feature_flags')
        .single();

      if (error) throw error;
      if (data?.value) {
        // Merge with default flags to ensure all features have proper structure
        const mergedFlags = Object.keys(defaultFeatureFlags).reduce((acc, key) => ({
          ...acc,
          [key]: {
            ...defaultFeatureFlags[key as keyof FeatureFlags],
            ...(data.value[key] || {})
          }
        }), {} as FeatureFlags);
        
        setFeatureFlags(mergedFlags);
      } else {
        // If no flags are set, use defaults
        setFeatureFlags(defaultFeatureFlags);
      }
    } catch (error: any) {
      console.error('Error loading feature flags:', error);
      setError('Failed to load feature flags');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'feature_flags',
          value: featureFlags,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      setSuccess('Feature flags updated successfully!');
    } catch (error: any) {
      console.error('Error saving feature flags:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlag = (key: keyof FeatureFlags, type: 'enabled' | 'visible') => {
    const currentFlags = featureFlags[key] || defaultFeatureFlags[key];
    setFeatureFlags({
      ...featureFlags,
      [key]: {
        ...currentFlags,
        [type]: !currentFlags[type]
      }
    });
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Feature Management
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
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${activeTab === group.name
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {group.name === 'Navigation' ? (
                <Settings className="h-4 w-4 mr-2" />
              ) : (
                <Layers className="h-4 w-4 mr-2" />
              )}
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
            {group.features.map((feature) => {
              const featureState = featureFlags[feature.key] || defaultFeatureFlags[feature.key];
              return (
                <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">{feature.name}</h5>
                    <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Visibility toggle */}
                    <button
                      onClick={() => toggleFlag(feature.key, 'visible')}
                      className="p-1 rounded-full hover:bg-gray-200"
                      title={featureState.visible ? 'Hide from navigation' : 'Show in navigation'}
                    >
                      {featureState.visible ? (
                        <Eye className="h-5 w-5 text-gray-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Enabled/disabled toggle */}
                    <button
                      onClick={() => toggleFlag(feature.key, 'enabled')}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        featureState.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          featureState.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
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