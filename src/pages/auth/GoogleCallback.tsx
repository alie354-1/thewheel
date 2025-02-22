import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    // Handle popup window case
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'oauth_callback',
        provider: 'google',
        code,
        error
      }, window.location.origin);

      // Close popup after a short delay to ensure message is sent
      setTimeout(() => window.close(), 1000);
    } else {
      // Handle direct navigation case
      if (error) {
        setError(error);
      } else if (code) {
        // Redirect to dashboard if we have a code
        navigate('/dashboard');
      } else {
        setError('No authorization code received');
      }
    }
  }, [location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Connecting Google Account
                  </h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">
              {window.opener ? 'Completing authentication...' : 'Redirecting...'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {window.opener ? 'This window will close automatically.' : 'Please wait...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}