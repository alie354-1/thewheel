/*
  # Add interests column to profiles table

  1. New Columns
    - `interests` (text array) - Array of user interests
    - `skills` (text array) - Array of user skills

  2. Changes
    - Add default empty array values
    - Create GIN index for faster array operations
*/

-- Add interests and skills columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING gin(interests);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING gin(skills);

-- Update existing profiles to have empty arrays if null
UPDATE profiles 
SET 
  interests = COALESCE(interests, '{}'),
  skills = COALESCE(skills, '{}')
WHERE interests IS NULL OR skills IS NULL;