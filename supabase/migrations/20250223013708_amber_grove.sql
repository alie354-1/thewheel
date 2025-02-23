/*
  # Update ideas table schema

  1. New Columns
    - solution_concept (text) - For storing the solution description
    - target_market (text) - For storing target market information
    - market_insights (jsonb) - For storing market validation data
    - status (text) - For tracking idea progress

  2. Changes
    - Adds new columns to ideas table
    - Adds constraints and defaults
    - Updates existing data if needed

  3. Security
    - Maintains existing RLS policies
*/

-- Add new columns to ideas table if they don't exist
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS solution_concept text,
ADD COLUMN IF NOT EXISTS target_market text,
ADD COLUMN IF NOT EXISTS market_insights jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft'
  CHECK (status IN ('draft', 'exploring', 'validated', 'archived'));

-- Add index for status column
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

-- Update any existing rows to have default values
UPDATE ideas 
SET 
  solution_concept = COALESCE(solution_concept, ''),
  target_market = COALESCE(target_market, ''),
  market_insights = COALESCE(market_insights, '{}'::jsonb),
  status = COALESCE(status, 'draft');

-- Add not null constraints after setting defaults
ALTER TABLE ideas
ALTER COLUMN solution_concept SET DEFAULT '',
ALTER COLUMN target_market SET DEFAULT '';