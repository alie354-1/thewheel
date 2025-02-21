import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function GoogleCallback() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    // Post message back to opener window
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'oauth_callback',
        provider: 'google',
        code,
        error
      }, window.location.origin);
    }

    // Close window after a short delay to ensure message is sent
    setTimeout(() => window.close(), 1000);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">
              Completing authentication...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This window will close automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}