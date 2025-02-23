-- Update RLS policies to allow all users to access settings
CREATE POLICY "Users can view all settings"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own settings"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update profiles table to include settings fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT jsonb_build_object(
  'notifications', jsonb_build_object(
    'email', true,
    'push', true
  ),
  'privacy', jsonb_build_object(
    'showProfile', true,
    'allowMessages', true
  ),
  'app_credentials', jsonb_build_object(),
  'feature_flags', jsonb_build_object(),
  'openai', jsonb_build_object(),
  'cloud_storage', jsonb_build_object()
);