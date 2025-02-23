import React, { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff, AlertCircle, ExternalLink, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const defaultCredentials = {
  google: {
    client_id: '',
    client_secret: '',
    redirect_uri: `${window.location.origin}/auth/google/callback`,
    project_id: '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    javascript_origins: [window.location.origin]
  }
};

export default function AppCredentialsSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [credentials, setCredentials] = useState(defaultCredentials);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_credentials')
        .single();

      if (error) throw error;

      if (data?.value) {
        setCredentials({
          ...defaultCredentials,
          ...data.value,
          google: {
            ...defaultCredentials.google,
            ...(data.value.google || {}),
            redirect_uri: `${window.location.origin}/auth/google/callback`,
            javascript_origins: [window.location.origin]
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading credentials:', error);
      setError('Failed to load existing credentials');
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
          key: 'app_credentials',
          value: credentials,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      setSuccess('Credentials saved successfully!');
    } catch (error: any) {
      console.error('Error saving credentials:', error);
      setError(error.message || 'Failed to save credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          App Credentials
        </h3>
        <button
          onClick={() => setShowSecrets(!showSecrets)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          {showSecrets ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Secrets
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show Secrets
            </>
          )}
        </button>
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

      <div className="space-y-6">
        {/* Google Credentials */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Google OAuth</h4>
          
          {/* Setup Instructions */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Setup Instructions</h5>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
              <li>Go to the <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">Google Cloud Console <ExternalLink className="h-3 w-3 ml-0.5" /></a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the following APIs:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Google Drive API</li>
                  <li>Google Slides API</li>
                </ul>
              </li>
              <li>Go to "OAuth consent screen" and configure:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>User Type: External</li>
                  <li>Add scopes: Google Drive and Google Slides</li>
                  <li>Add test users (your email)</li>
                </ul>
              </li>
              <li>Go to "Credentials" and create an OAuth 2.0 Client ID:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Application type: Web application</li>
                  <li>Name: Your app name</li>
                  <li>Add Authorized JavaScript origins:</li>
                  <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm break-all">
                    {window.location.origin}
                  </div>
                  <li>Add Authorized redirect URI:</li>
                  <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm break-all">
                    {credentials.google.redirect_uri}
                  </div>
                </ul>
              </li>
              <li>Copy the Client ID and Client Secret below</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="google_project_id" className="block text-sm font-medium text-gray-700">
                Project ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="google_project_id"
                value={credentials.google.project_id}
                onChange={(e) => setCredentials({
                  ...credentials,
                  google: { ...credentials.google, project_id: e.target.value }
                })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="your-project-id"
              />
            </div>
            <div>
              <label htmlFor="google_client_id" className="block text-sm font-medium text-gray-700">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type={showSecrets ? "text" : "password"}
                id="google_client_id"
                value={credentials.google.client_id}
                onChange={(e) => setCredentials({
                  ...credentials,
                  google: { ...credentials.google, client_id: e.target.value }
                })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your Google Client ID"
              />
            </div>
            <div>
              <label htmlFor="google_client_secret" className="block text-sm font-medium text-gray-700">
                Client Secret <span className="text-red-500">*</span>
              </label>
              <input
                type={showSecrets ? "text" : "password"}
                id="google_client_secret"
                value={credentials.google.client_secret}
                onChange={(e) => setCredentials({
                  ...credentials,
                  google: { ...credentials.google, client_secret: e.target.value }
                })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your Google Client Secret"
              />
            </div>
            <div>
              <label htmlFor="google_redirect_uri" className="block text-sm font-medium text-gray-700">
                Redirect URI
              </label>
              <input
                type="text"
                id="google_redirect_uri"
                value={credentials.google.redirect_uri}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add this URI to your Google OAuth consent screen
              </p>
            </div>
            <div>
              <label htmlFor="google_javascript_origins" className="block text-sm font-medium text-gray-700">
                JavaScript Origins
              </label>
              <input
                type="text"
                id="google_javascript_origins"
                value={credentials.google.javascript_origins[0]}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add this origin to your Google OAuth consent screen
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Credentials'}
          </button>
        </div>
      </div>
    </div>
  );
}