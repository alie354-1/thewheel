import React, { useState } from 'react';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { UserCircle, Save, Camera, Plus, Minus } from 'lucide-react';
import OpenAISettings from '../components/admin/OpenAISettings';
import AppCredentialsSettings from '../components/admin/AppCredentialsSettings';
import FeatureFlagsSettings from '../components/admin/FeatureFlagsSettings';
import UserManagement from '../components/admin/UserManagement';

export default function Profile() {
  const { profile, setProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(!profile?.full_name);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    is_public: profile?.is_public || false,
    allows_messages: profile?.allows_messages || false,
    avatar_url: profile?.avatar_url || '',
    professional_background: profile?.professional_background || '',
    social_links: profile?.social_links || {
      linkedin: '',
      twitter: '',
      github: '',
      website: ''
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setIsLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <UserCircle className="h-6 w-6" />
          {isEditing ? 'Complete Your Profile' : 'Profile Settings'}
        </h1>

        <div className="mt-6">
          <div className="bg-white shadow rounded-lg">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`${
                    activeTab === 'basic'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Basic Info
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('integrations')}
                  className={`${
                    activeTab === 'integrations'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Integrations
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`${
                    activeTab === 'features'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Features
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'basic' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                      {formData.avatar_url ? (
                        <img
                          src={formData.avatar_url}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-full w-full p-4 text-gray-400" />
                      )}
                    </div>
                    {isEditing && (
                      <label
                        htmlFor="avatar"
                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photo
                        <input
                          type="file"
                          id="avatar"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="professional_background" className="block text-sm font-medium text-gray-700">
                        Professional Background
                      </label>
                      <textarea
                        id="professional_background"
                        name="professional_background"
                        rows={4}
                        value={formData.professional_background}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Social Links</h3>
                      <div className="space-y-2">
                        <input
                          type="url"
                          placeholder="LinkedIn URL"
                          value={formData.social_links.linkedin}
                          onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <input
                          type="url"
                          placeholder="Twitter URL"
                          value={formData.social_links.twitter}
                          onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <input
                          type="url"
                          placeholder="GitHub URL"
                          value={formData.social_links.github}
                          onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <input
                          type="url"
                          placeholder="Personal Website"
                          value={formData.social_links.website}
                          onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_public"
                        name="is_public"
                        checked={formData.is_public}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                        Make my profile public
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allows_messages"
                        name="allows_messages"
                        checked={formData.allows_messages}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="allows_messages" className="ml-2 block text-sm text-gray-900">
                        Allow other users to message me
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'users' && (
                <UserManagement />
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <OpenAISettings />
                  <AppCredentialsSettings />
                </div>
              )}

              {activeTab === 'features' && (
                <FeatureFlagsSettings />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}