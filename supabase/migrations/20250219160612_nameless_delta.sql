-- Create oauth_tokens table
CREATE TABLE oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'microsoft')),
  access_token text NOT NULL,
  refresh_token text,
  token_type text,
  expires_at timestamptz NOT NULL,
  scopes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tokens"
  ON oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tokens"
  ON oauth_tokens
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_oauth_tokens_user_provider ON oauth_tokens(user_id, provider);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Create function to refresh expired tokens
CREATE OR REPLACE FUNCTION refresh_oauth_token(token_id uuid)
RETURNS oauth_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token oauth_tokens;
  refreshed_token jsonb;
BEGIN
  -- Get the token
  SELECT * INTO token
  FROM oauth_tokens
  WHERE id = token_id;

  IF token.refresh_token IS NULL THEN
    RAISE EXCEPTION 'No refresh token available';
  END IF;

  -- Refresh the token based on provider
  IF token.provider = 'google' THEN
    -- Call Google's token endpoint
    refreshed_token := http_post(
      'https://oauth2.googleapis.com/token',
      jsonb_build_object(
        'client_id', current_setting('app.settings.google_client_id'),
        'client_secret', current_setting('app.settings.google_client_secret'),
        'refresh_token', token.refresh_token,
        'grant_type', 'refresh_token'
      )
    );
  ELSIF token.provider = 'microsoft' THEN
    -- Call Microsoft's token endpoint
    refreshed_token := http_post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      jsonb_build_object(
        'client_id', current_setting('app.settings.microsoft_client_id'),
        'client_secret', current_setting('app.settings.microsoft_client_secret'),
        'refresh_token', token.refresh_token,
        'grant_type', 'refresh_token'
      )
    );
  END IF;

  -- Update the token
  UPDATE oauth_tokens
  SET
    access_token = refreshed_token->>'access_token',
    expires_at = now() + ((refreshed_token->>'expires_in')::int * interval '1 second'),
    updated_at = now()
  WHERE id = token_id
  RETURNING * INTO token;

  RETURN token;
END;
$$;

-- Create function to get valid token
CREATE OR REPLACE FUNCTION get_valid_oauth_token(user_id uuid, provider text)
RETURNS oauth_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token oauth_tokens;
BEGIN
  -- Get the token
  SELECT * INTO token
  FROM oauth_tokens
  WHERE oauth_tokens.user_id = get_valid_oauth_token.user_id
  AND oauth_tokens.provider = get_valid_oauth_token.provider;

  -- If no token found, return null
  IF token IS NULL THEN
    RETURN NULL;
  END IF;

  -- If token is expired and we have a refresh token, refresh it
  IF token.expires_at <= now() AND token.refresh_token IS NOT NULL THEN
    token := refresh_oauth_token(token.id);
  END IF;

  RETURN token;
END;
$$;

-- Create function to save oauth token
CREATE OR REPLACE FUNCTION save_oauth_token(
  user_id uuid,
  provider text,
  access_token text,
  refresh_token text,
  token_type text,
  expires_in int,
  scopes text[]
)
RETURNS oauth_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token oauth_tokens;
BEGIN
  -- Insert or update the token
  INSERT INTO oauth_tokens (
    user_id,
    provider,
    access_token,
    refresh_token,
    token_type,
    expires_at,
    scopes
  )
  VALUES (
    user_id,
    provider,
    access_token,
    refresh_token,
    token_type,
    now() + (expires_in * interval '1 second'),
    scopes
  )
  ON CONFLICT (user_id, provider)
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
    token_type = EXCLUDED.token_type,
    expires_at = EXCLUDED.expires_at,
    scopes = EXCLUDED.scopes,
    updated_at = now()
  RETURNING * INTO token;

  RETURN token;
END;
$$;