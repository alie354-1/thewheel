-- Add setup_progress column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS setup_progress jsonb DEFAULT jsonb_build_object(
  'current_step', 'basic',
  'completed_steps', ARRAY[]::text[],
  'form_data', '{}'::jsonb
);

-- Create index for setup_progress
CREATE INDEX IF NOT EXISTS idx_profiles_setup_progress ON profiles USING gin(setup_progress);

-- Update existing profiles to have default setup_progress
UPDATE profiles 
SET setup_progress = jsonb_build_object(
  'current_step', 'basic',
  'completed_steps', ARRAY[]::text[],
  'form_data', '{}'::jsonb
)
WHERE setup_progress IS NULL;