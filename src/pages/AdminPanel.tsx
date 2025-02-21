import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Settings, Users, MessageSquare, Slack, Plus, Mail, Key, AlertCircle, Bot, CloudCog } from 'lucide-react';
import OpenAI from 'openai';
import AppCredentialsSettings from '../components/admin/AppCredentialsSettings';

export default function AdminPanel() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [slackSettings, setSlackSettings] = useState<any>({
    workspace_id: '',
    bot_token: ''
  });
  const [openaiSettings, setOpenaiSettings] = useState<any>({
    api_key: '',
    model: 'gpt-4'
  });
  const [communities, setCommunities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSlackSettings();
    fetchOpenAISettings();
    fetchCommunities();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
  };

  const fetchSlackSettings = async () => {
    const { data, error } = await supabase
      .from('slack_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (data) setSlackSettings(data);
  };

  const fetchOpenAISettings = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('settings')
      .eq('role', 'superadmin')
      .limit(1)
      .single();
    
    if (data?.settings?.openai) {
      setOpenaiSettings(data.settings.openai);
    }
  };

  const fetchCommunities = async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setCommunities(data);
  };

  const updateUserRole = async (userId: string, role: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (!error) fetchUsers();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // First create the user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Create profile with role and messaging enabled
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role,
            allows_messages: true,
            is_public: true
          }]);

        if (profileError) throw profileError;

        setSuccess('User created successfully');
        setNewUser({
          email: '',
          password: '',
          role: 'user',
          full_name: ''
        });
        setIsAddingUser(false);
        fetchUsers();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create user');
    }
  };

  const handleSaveSlackSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('slack_settings')
        .upsert([slackSettings]);

      if (error) throw error;
      setSuccess('Slack settings saved successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to save Slack settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOpenAISettings = async () => {
    setIsSaving(true);
    try {
      // Test the API key before saving
      const openai = new OpenAI({
        apiKey: openaiSettings.api_key,
        dangerouslyAllowBrowser: true
      });
      
      const testResponse = await openai.chat.completions.create({
        model: openaiSettings.model,
        messages: [{ role: 'user', content: 'Test connection' }],
      });

      if (!testResponse.choices[0].message.content) {
        throw new Error('Failed to test OpenAI connection');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          settings: {
            openai: openaiSettings
          }
        })
        .eq('role', 'superadmin');

      if (error) throw error;
      setSuccess('OpenAI settings saved successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to save OpenAI settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Admin Panel
        </h1>

        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Users className="h-5 w-5 mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`${
                activeTab === 'credentials'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Key className="h-5 w-5 mr-2" />
              App Credentials
            </button>
            <button
              onClick={() => setActiveTab('slack')}
              className={`${
                activeTab === 'slack'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Slack className="h-5 w-5 mr-2" />
              Slack Settings
            </button>
            <button
              onClick={() => setActiveTab('openai')}
              className={`${
                activeTab === 'openai'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Bot className="h-5 w-5 mr-2" />
              OpenAI Settings
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`${
                activeTab === 'communities'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Communities
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 rounded-md text-green-800">
              {success}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white shadow-sm rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                  <button
                    onClick={() => setIsAddingUser(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                </div>

                {isAddingUser && (
                  <div className="mt-4">
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={newUser.full_name}
                          onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                            className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                            minLength={6}
                            className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          {profile?.role === 'superadmin' && (
                            <option value="superadmin">Super Admin</option>
                          )}
                        </select>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingUser(false);
                            setError('');
                            setSuccess('');
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          disabled={user.id === profile?.id}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          {profile?.role === 'superadmin' && (
                            <option value="superadmin">Super Admin</option>
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.allows_messages ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.allows_messages ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'credentials' && (
            <AppCredentialsSettings />
          )}

          {activeTab === 'slack' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Slack Integration</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="workspace_id" className="block text-sm font-medium text-gray-700">
                    Workspace ID
                  </label>
                  <input
                    type="text"
                    name="workspace_id"
                    id="workspace_id"
                    value={slackSettings.workspace_id}
                    onChange={(e) => setSlackSettings({ ...slackSettings, workspace_id: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="bot_token" className="block text-sm font-medium text-gray-700">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    name="bot_token"
                    id="bot_token"
                    value={slackSettings.bot_token}
                    onChange={(e) => setSlackSettings({ ...slackSettings, bot_token: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSlackSettings}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'openai' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">OpenAI Settings</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="password"
                      name="api_key"
                      id="api_key"
                      value={openaiSettings.api_key}
                      onChange={(e) => setOpenaiSettings({ ...openaiSettings, api_key: e.target.value })}
                      className="flex-1 min-w-0 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="sk-..."
                    />
                    <button
                      onClick={async () => {
                        try {
                          setIsSaving(true);
                          const openai = new OpenAI({
                            apiKey: openaiSettings.api_key,
                            dangerouslyAllowBrowser: true
                          });
                          
                          const response = await openai.chat.completions.create({
                            model: openaiSettings.model,
                            messages: [{ role: 'user', content: 'Test connection' }],
                          });
                          
                          if (response.choices[0].message.content) {
                            setSuccess('OpenAI connection successful!');
                          }
                        } catch (error: any) {
                          setError(error.message || 'Failed to test OpenAI connection');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      Test Connection
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Get your API key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      OpenAI's platform
                    </a>
                  </p>
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    Default Model
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={openaiSettings.model}
                    onChange={(e) => setOpenaiSettings({ ...openaiSettings, model: e.target.value })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="gpt-4">GPT-4 (Recommended)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveOpenAISettings}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'communities' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Communities</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Community
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {communities.map((community) => (
                  <div
                    key={community.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="text-lg font-medium text-gray-900">{community.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">{community.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}