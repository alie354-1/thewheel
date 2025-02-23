-- Add settings column to profiles if it doesn't exist
DO $$ BEGIN
  -- Add settings column with default value
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

  -- Create index on settings column if it doesn't exist
  CREATE INDEX IF NOT EXISTS idx_profiles_settings ON profiles USING gin(settings);
EXCEPTION
  WHEN duplicate_column THEN 
    -- Column already exists, update default value for new rows
    ALTER TABLE profiles 
    ALTER COLUMN settings SET DEFAULT jsonb_build_object(
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
END $$;

-- Update existing rows that have null settings
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