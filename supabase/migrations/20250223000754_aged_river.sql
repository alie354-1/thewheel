-- Add settings column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Create index on settings column
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON profiles USING gin(settings);

-- Update existing profiles to have empty settings if null
UPDATE profiles 
SET settings = '{}'::jsonb 
WHERE settings IS NULL;