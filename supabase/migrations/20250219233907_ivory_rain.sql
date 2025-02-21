-- Alter ideas table to add brainstorming fields
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS raw_idea text,
ADD COLUMN IF NOT EXISTS inspiration_source text,
ADD COLUMN IF NOT EXISTS initial_thoughts text[],
ADD COLUMN IF NOT EXISTS market_opportunities text[],
ADD COLUMN IF NOT EXISTS potential_challenges text[],
ADD COLUMN IF NOT EXISTS brainstorm_notes jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ai_brainstorm_feedback jsonb DEFAULT '{
  "refined_concepts": [],
  "market_insights": [],
  "unique_angles": [],
  "potential_pivots": [],
  "similar_successes": [],
  "considerations": []
}';

-- Update stage check constraint to include brainstorm
ALTER TABLE ideas 
DROP CONSTRAINT IF EXISTS ideas_stage_check;

ALTER TABLE ideas
ADD CONSTRAINT ideas_stage_check 
CHECK (stage IN ('brainstorm', 'concept', 'validation', 'planning', 'execution'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ideas_brainstorm_feedback ON ideas USING gin(ai_brainstorm_feedback);