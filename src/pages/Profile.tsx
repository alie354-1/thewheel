import React, { useState } from 'react';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { UserCircle, Save, Camera, Plus, Minus } from 'lucide-react';
import CloudStorageSettings from '../components/CloudStorageSettings';

export default function Profile() {
  const { profile, setProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(!profile?.full_name);
  const [isLoading, setIsLoading] = useState(false);
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

  const [dashboardLayout, setDashboardLayout] = useState(profile?.dashboard_layout || {
    widgets: [
      // Core Widgets
      { id: 'tasks', name: 'Tasks', enabled: true, position: [0, 0], size: [6, 4], category: 'core' },
      { id: 'standup', name: 'Standup History', enabled: true, position: [6, 0], size: [6, 4], category: 'core' },
      { id: 'activities', name: 'Recent Activities', enabled: true, position: [0, 6], size: [6, 4], category: 'core' },
      { id: 'updates', name: 'Updates', enabled: true, position: [6, 6], size: [6, 4], category: 'core' },
      
      // Idea Hub Widgets
      { id: 'idea_canvas', name: 'Idea Canvas', enabled: false, position: [0, 8], size: [6, 4], category: 'idea-hub' },
      { id: 'market_research', name: 'Market Research', enabled: false, position: [6, 8], size: [6, 4], category: 'idea-hub' },
      { id: 'business_model', name: 'Business Model', enabled: false, position: [0, 12], size: [6, 4], category: 'idea-hub' },
      { id: 'pitch_deck', name: 'Pitch Deck', enabled: false, position: [6, 12], size: [6, 4], category: 'idea-hub' },
      { id: 'resources', name: 'Resource Library', enabled: true, position: [0, 4], size: [12, 2], category: 'idea-hub' },
      
      // Community Widgets
      { id: 'community_feed', name: 'Community Feed', enabled: false, position: [0, 16], size: [6, 4], category: 'community' },
      { id: 'community_events', name: 'Upcoming Events', enabled: false, position: [6, 16], size: [6, 4], category: 'community' },
      
      // Company Widgets
      { id: 'company_metrics', name: 'Company Metrics', enabled: false, position: [0, 20], size: [6, 4], category: 'company' },
      { id: 'team_updates', name: 'Team Updates', enabled: false, position: [6, 20], size: [6, 4], category: 'company' },
      { id: 'documents', name: 'Documents', enabled: false, position: [0, 24], size: [12, 4], category: 'company' }
    ]
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
          dashboard_layout: dashboardLayout,
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

  const toggleWidget = (widgetId: string) => {
    setDashboardLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget => 
        widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
      )
    }));
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
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              {/* Avatar Upload */}
              <div className="px-6 py-5">
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
                        disabled={!isEditing}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <div className="mt-4 space-y-4">
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
                      disabled={!isEditing}
                      required
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
                      disabled={!isEditing}
                      placeholder="Tell us about your professional experience..."
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Social Links</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="linkedin" className="block text-sm text-gray-500">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      id="linkedin"
                      value={formData.social_links.linkedin}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label htmlFor="twitter" className="block text-sm text-gray-500">
                      Twitter
                    </label>
                    <input
                      type="url"
                      id="twitter"
                      value={formData.social_links.twitter}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={!isEditing}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label htmlFor="github" className="block text-sm text-gray-500">
                      GitHub
                    </label>
                    <input
                      type="url"
                      id="github"
                      value={formData.social_links.github}
                      onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={!isEditing}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm text-gray-500">
                      Personal Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      value={formData.social_links.website}
                      onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={!isEditing}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_public"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      disabled={!isEditing}
                    />
                    <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                      Make profile public
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
                      disabled={!isEditing}
                    />
                    <label htmlFor="allows_messages" className="ml-2 block text-sm text-gray-900">
                      Allow other users to send me messages
                    </label>
                  </div>
                </div>
              </div>

              {/* Cloud Storage Section */}
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cloud Storage</h3>
                <CloudStorageSettings />
              </div>

              {/* Dashboard Layout Section */}
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Dashboard Layout</h3>
                <div className="mt-4 space-y-6">
                  {/* Core Widgets */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Core Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {dashboardLayout.widgets
                        .filter(widget => widget.category === 'core')
                        .map(widget => (
                          <button
                            key={widget.id}
                            type="button"
                            onClick={() => toggleWidget(widget.id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                              widget.enabled
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {widget.enabled ? (
                              <Minus className="h-4 w-4 mr-1" />
                            ) : (
                              <Plus className="h-4 w-4 mr-1" />
                            )}
                            {widget.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Idea Hub Widgets */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Idea Hub</h4>
                    <div className="flex flex-wrap gap-2">
                      {dashboardLayout.widgets
                        .filter(widget => widget.category === 'idea-hub')
                        .map(widget => (
                          <button
                            key={widget.id}
                            type="button"
                            onClick={() => toggleWidget(widget.id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                              widget.enabled
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {widget.enabled ? (
                              <Minus className="h-4 w-4 mr-1" />
                            ) : (
                              <Plus className="h-4 w-4 mr-1" />
                            )}
                            {widget.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Community Widgets */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Community</h4>
                    <div className="flex flex-wrap gap-2">
                      {dashboardLayout.widgets
                        .filter(widget => widget.category === 'community')
                        .map(widget => (
                          <button
                            key={widget.id}
                            type="button"
                            onClick={() => toggleWidget(widget.id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                              widget.enabled
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {widget.enabled ? (
                              <Minus className="h-4 w-4 mr-1" />
                            ) : (
                              <Plus className="h-4 w-4 mr-1" />
                            )}
                            {widget.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Company Widgets */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Company</h4>
                    <div className="flex flex-wrap gap-2">
                      {dashboardLayout.widgets
                        .filter(widget => widget.category === 'company')
                        .map(widget => (
                          <button
                            key={widget.id}
                            type="button"
                            onClick={() => toggleWidget(widget.id)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                              widget.enabled
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {widget.enabled ? (
                              <Minus className="h-4 w-4 mr-1" />
                            ) : (
                              <Plus className="h-4 w-4 mr-1" />
                            )}
                            {widget.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    Select which widgets you want to see on your dashboard. Changes will be applied after saving.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="px-6 py-5">
                <div className="flex justify-end space-x-3">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
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
                          setDashboardLayout(profile?.dashboard_layout || {
                            widgets: defaultWidgets
                          });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}