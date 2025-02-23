import React, { useState, useEffect } from 'react';
import { Bot, Save, AlertCircle, Check, RotateCw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import OpenAI from 'openai';

export default function OpenAISettings() {
  const [settings, setSettings] = useState({
    api_key: '',
    model: 'gpt-4'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'openai')
        .single();

      if (error) throw error;
      if (data?.value) {
        setSettings(data.value);
      }
    } catch (error) {
      console.error('Error loading OpenAI settings:', error);
    }
  };

  const testConnection = async () => {
    if (!settings.api_key) {
      setError('API key is required');
      return;
    }

    setIsTesting(true);
    setError('');
    setSuccess('');

    try {
      const openai = new OpenAI({
        apiKey: settings.api_key,
        dangerouslyAllowBrowser: true
      });
      
      const response = await openai.chat.completions.create({
        model: settings.model,
        messages: [{ role: 'user', content: 'Test connection' }],
      });
      
      if (response.choices[0].message.content) {
        setSuccess('OpenAI connection successful!');
      }
    } catch (error: any) {
      console.error('Error testing OpenAI connection:', error);
      setError(error.message || 'Failed to test OpenAI connection');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!settings.api_key) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'openai',
          value: settings,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      setSuccess('OpenAI settings saved successfully!');
      
      // Reload settings to confirm save
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving OpenAI settings:', error);
      setError(error.message || 'Failed to save OpenAI settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the API key? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'openai',
          value: {
            api_key: '',
            model: settings.model
          },
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setSettings(prev => ({
        ...prev,
        api_key: ''
      }));
      setSuccess('API key deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      setError(error.message || 'Failed to delete API key');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          OpenAI Settings
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

      <div className="space-y-6">
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="password"
              id="api_key"
              value={settings.api_key}
              onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
              className="flex-1 min-w-0 block rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="sk-..."
            />
            {settings.api_key && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
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
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="gpt-4">GPT-4 (Recommended)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={testConnection}
            disabled={isTesting || !settings.api_key}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !settings.api_key}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}