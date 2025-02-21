import React, { useState, useEffect } from 'react';
import { CloudCog, GithubIcon, Check, AlertCircle } from 'lucide-react';
import { getCloudCredentials, initializeGoogleDrive, CloudProvider } from '../lib/cloud-storage';

interface CloudStorageSettingsProps {
  companyId?: string;
  onComplete?: () => void;
}

export default function CloudStorageSettings({ companyId, onComplete }: CloudStorageSettingsProps) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const googleCreds = await getCloudCredentials('google');
      setGoogleConnected(!!googleCreds);
    } catch (error: any) {
      console.error('Error checking cloud connections:', error);
      setError('Failed to check cloud storage connections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: CloudProvider) => {
    try {
      setError('');
      setSuccess('');
      const credentials = await initializeGoogleDrive();
      if (credentials) {
        setGoogleConnected(true);
        setSuccess('Successfully connected to Google Drive!');
        onComplete?.();
      }
    } catch (error: any) {
      console.error(`Error connecting to ${provider}:`, error);
      setError(error.message || `Failed to connect to ${provider}`);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Checking cloud storage connections...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <CloudCog className="h-5 w-5 mr-2" />
          Cloud Storage Setup
        </h3>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="px-6 py-4 bg-green-50">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-5 space-y-6">
        {/* Google Drive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <GithubIcon className="h-8 w-8 text-gray-400" />
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Google Drive</h4>
              <p className="text-sm text-gray-500">
                Connect to access your documents and slides
              </p>
            </div>
          </div>
          {googleConnected ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Check className="h-4 w-4 mr-1" />
              Connected
            </span>
          ) : (
            <button
              onClick={() => handleConnect('google')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Connect
            </button>
          )}
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-900">Why connect cloud storage?</h5>
          <ul className="mt-2 text-sm text-gray-500 space-y-1">
            <li>• Access and edit your documents directly in the platform</li>
            <li>• Automatically sync pitch decks with Google Slides</li>
            <li>• Collaborate with team members in real-time</li>
            <li>• Keep all your startup documents organized in one place</li>
          </ul>
        </div>
      </div>
    </div>
  );
}