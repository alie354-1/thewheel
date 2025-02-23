-- Add settings column to profiles if it doesn't exist
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
  'openai', jsonb_build_object(
    'api_key', '',
    'model', 'gpt-4'
  ),
  'cloud_storage', jsonb_build_object()
);

-- Create index on settings column
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON profiles USING gin(settings);

-- Update RLS policies to allow users to manage their own settings
DROP POLICY IF EXISTS "Users can view their own settings" ON profiles;
DROP POLICY IF EXISTS "Users can update their own settings" ON profiles;

CREATE POLICY "Users can view their own settings"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own settings"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update existing profiles to have default settings if null
UPDATE profiles 
SET settings = jsonb_build_object(
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
  'openai', jsonb_build_object(
    'api_key', '',
    'model', 'gpt-4'
  ),
  'cloud_storage', jsonb_build_object()
)
WHERE settings IS NULL;