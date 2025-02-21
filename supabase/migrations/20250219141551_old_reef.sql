-- Add dashboard_layout column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dashboard_layout jsonb DEFAULT '{
  "widgets": [
    { "id": "tasks", "name": "Tasks", "enabled": true, "position": [0, 0], "size": [6, 4] },
    { "id": "standup", "name": "Standup History", "enabled": true, "position": [6, 0], "size": [6, 4] },
    { "id": "resources", "name": "Resources", "enabled": true, "position": [0, 4], "size": [12, 2] },
    { "id": "activities", "name": "Recent Activities", "enabled": true, "position": [0, 6], "size": [6, 4] },
    { "id": "updates", "name": "Updates", "enabled": true, "position": [6, 6], "size": [6, 4] }
  ]
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_dashboard_layout ON profiles USING gin(dashboard_layout);

-- Update existing profiles with default layout
UPDATE profiles
SET dashboard_layout = '{
  "widgets": [
    { "id": "tasks", "name": "Tasks", "enabled": true, "position": [0, 0], "size": [6, 4] },
    { "id": "standup", "name": "Standup History", "enabled": true, "position": [6, 0], "size": [6, 4] },
    { "id": "resources", "name": "Resources", "enabled": true, "position": [0, 4], "size": [12, 2] },
    { "id": "activities", "name": "Recent Activities", "enabled": true, "position": [0, 6], "size": [6, 4] },
    { "id": "updates", "name": "Updates", "enabled": true, "position": [6, 6], "size": [6, 4] }
  ]
}'
WHERE dashboard_layout IS NULL;