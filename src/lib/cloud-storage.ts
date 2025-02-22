import { supabase } from './supabase';

// Cloud storage provider types
export type CloudProvider = 'google';
export type CloudScope = 'drive' | 'slides' | 'docs' | 'sheets';

interface CloudCredentials {
  provider: CloudProvider;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scopes: CloudScope[];
}

// Get cloud storage credentials from profile
export async function getCloudCredentials(provider: CloudProvider): Promise<CloudCredentials | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('cloud_storage')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!profile?.cloud_storage?.[provider]) {
    return null;
  }

  return profile.cloud_storage[provider];
}

// Initialize Google Drive client
export async function initializeGoogleDrive(): Promise<CloudCredentials | null> {
  try {
    const credentials = await getCloudCredentials('google');
    if (!credentials) {
      // Get admin settings for OAuth credentials
      const { data: adminSettings } = await supabase
        .from('profiles')
        .select('settings')
        .eq('role', 'superadmin')
        .single();

      if (!adminSettings?.settings?.app_credentials?.google) {
        throw new Error('Google OAuth credentials not configured. Please contact an administrator.');
      }

      const { client_id } = adminSettings.settings.app_credentials.google;

      if (!client_id) {
        throw new Error('Google Client ID not configured. Please contact an administrator.');
      }

      // Open popup for Google OAuth flow
      const scopes = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/presentations'
      ];

      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const params = new URLSearchParams({
        client_id,
        redirect_uri: `${window.location.origin}/auth/google/callback`,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Open popup window with underscores instead of spaces in name
      const popup = window.open(
        authUrl,
        'Google_OAuth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!popup) {
        throw new Error('Failed to open popup window. Please allow popups for this site.');
      }

      // Listen for messages from the popup
      return new Promise((resolve, reject) => {
        let timeoutId: number;
        let checkClosedInterval: number;
        
        const handleMessage = async (event: MessageEvent) => {
          try {
            // Verify origin
            if (event.origin !== window.location.origin) return;

            // Handle the OAuth callback
            if (event.data?.type === 'oauth_callback' && event.data?.provider === 'google') {
              cleanup();

              if (event.data.error) {
                throw new Error(event.data.error);
              }

              if (!event.data.code) {
                throw new Error('No authorization code received');
              }

              const credentials = await handleOAuthCallback('google', event.data.code);
              resolve(credentials);
            }
          } catch (error) {
            cleanup();
            reject(error);
          }
        };

        // Cleanup function to remove listeners and intervals
        const cleanup = () => {
          clearTimeout(timeoutId);
          clearInterval(checkClosedInterval);
          window.removeEventListener('message', handleMessage);
          if (popup && !popup.closed) popup.close();
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed before completing
        checkClosedInterval = window.setInterval(() => {
          if (popup.closed) {
            cleanup();
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);

        // Set a timeout to prevent hanging
        timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error('Authentication timed out'));
        }, 120000); // 2 minutes timeout
      });
    }

    return credentials;
  } catch (error: any) {
    console.error('Error connecting to google:', error);
    throw new Error(error.message || 'Failed to connect to Google. Please try again.');
  }
}

// Save cloud storage credentials
export async function saveCloudCredentials(
  provider: CloudProvider,
  credentials: Omit<CloudCredentials, 'provider'>
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('cloud_storage')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  const cloud_storage = {
    ...profile?.cloud_storage,
    [provider]: {
      provider,
      ...credentials
    }
  };

  await supabase
    .from('profiles')
    .update({ cloud_storage })
    .eq('id', (await supabase.auth.getUser()).data.user?.id);
}

// Handle OAuth callback
export async function handleOAuthCallback(
  provider: CloudProvider,
  code: string
): Promise<CloudCredentials> {
  try {
    // Get admin settings for OAuth credentials
    const { data: adminSettings } = await supabase
      .from('profiles')
      .select('settings')
      .eq('role', 'superadmin')
      .single();

    if (!adminSettings?.settings?.app_credentials?.[provider]) {
      throw new Error(`${provider} OAuth credentials not configured. Please contact an administrator.`);
    }

    const { client_id, client_secret } = adminSettings.settings.app_credentials[provider];

    if (!client_id || !client_secret) {
      throw new Error(`Missing required ${provider} OAuth configuration. Please contact an administrator.`);
    }

    const params = new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Failed to exchange authorization code for tokens');
    }

    const tokens = await tokenResponse.json();

    const credentials: CloudCredentials = {
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      scopes: ['drive', 'slides']
    };

    await saveCloudCredentials(provider, credentials);
    return credentials;
  } catch (error: any) {
    console.error('Error in handleOAuthCallback:', error);
    throw new Error(error.message || 'Failed to complete authentication');
  }
}