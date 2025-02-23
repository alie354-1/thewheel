/*
  # Move App Settings to Admin Panel

  1. New Tables
    - `app_settings` - Global application settings
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for admin access
    - Add policy for public read access

  3. Changes
    - Move app settings from profiles to new table
    - Clean up old settings from profiles table
*/

-- Create app_settings table
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

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

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
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
  ('feature_flags', jsonb_build_object());

-- Clean up old settings from profiles
UPDATE profiles
SET settings = jsonb_build_object(
  'notifications', COALESCE((settings->>'notifications')::jsonb, jsonb_build_object(
    'email', true,
    'push', true
  )),
  'privacy', COALESCE((settings->>'privacy')::jsonb, jsonb_build_object(
    'showProfile', true,
    'allowMessages', true
  ))
);