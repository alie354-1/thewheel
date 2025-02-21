-- Add cloud_storage column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cloud_storage jsonb DEFAULT '{
  "google": null,
  "microsoft": null
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_cloud_storage ON profiles USING gin(cloud_storage);

-- Update existing profiles with default cloud storage settings
UPDATE profiles
SET cloud_storage = '{
  "google": null,
  "microsoft": null
}'
WHERE cloud_storage IS NULL;