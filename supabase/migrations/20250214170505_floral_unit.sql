/*
  # Enhance Profile Schema for Founders

  1. New Fields
    - Professional background
    - Skills and expertise
    - Industry experience
    - Previous startups
    - Education
    - Social links
    - Interests and goals
    - Availability for networking
    - Mentor preferences
    - Investment interests

  2. Changes
    - Add new columns to profiles table
    - Add validation constraints
    - Update existing data
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS professional_background text,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS industry_experience text[],
ADD COLUMN IF NOT EXISTS previous_startups jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS goals text[],
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'part-time',
ADD COLUMN IF NOT EXISTS mentor_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS investment_interests jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{English}',
ADD COLUMN IF NOT EXISTS achievements text[],
ADD COLUMN IF NOT EXISTS looking_for text[];

-- Add constraint for availability_status
ALTER TABLE profiles
ADD CONSTRAINT valid_availability_status 
CHECK (availability_status IN ('full-time', 'part-time', 'weekends', 'evenings', 'not-available'));