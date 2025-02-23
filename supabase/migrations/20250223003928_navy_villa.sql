-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;

-- Create policies
CREATE POLICY "Anyone can view app settings"
  ON app_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Insert or update default settings
INSERT INTO app_settings (key, value)
VALUES 
  ('openai', jsonb_build_object(
    'api_key', '',
    'model', 'gpt-4'
  )),
  ('app_credentials', jsonb_build_object(
    'google', jsonb_build_object(
      'client_id', '',
      'client_secret', '',
      'redirect_uri', '',
      'project_id', '',
      'auth_uri', 'https://accounts.google.com/o/oauth2/auth',
      'token_uri', 'https://oauth2.googleapis.com/token',
      'auth_provider_x509_cert_url', 'https://www.googleapis.com/oauth2/v1/certs'
    )
  )),
  ('feature_flags', jsonb_build_object())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

-- Update all users to have admin role
UPDATE profiles
SET role = 'admin'
WHERE role = 'user';

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    full_name,
    is_public,
    allows_messages,
    settings
  ) VALUES (
    new.id,
    new.email,
    'admin',
    new.raw_user_meta_data->>'full_name',
    true,
    true,
    jsonb_build_object(
      'notifications', jsonb_build_object(
        'email', true,
        'push', true
      ),
      'privacy', jsonb_build_object(
        'showProfile', true,
        'allowMessages', true
      )
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;