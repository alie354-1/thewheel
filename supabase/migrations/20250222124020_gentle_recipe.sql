-- Drop existing policies first
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their own ideas" ON ideas;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create ideas table if it doesn't exist
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'exploring', 'validated', 'archived')),
  
  -- Core concept
  problem_statement text,
  solution_concept text,
  target_audience text,
  unique_value text,
  
  -- Market insights
  market_size text,
  competitors jsonb DEFAULT '[]',
  market_trends text[],
  
  -- Business model
  revenue_streams jsonb DEFAULT '[]',
  cost_structure jsonb DEFAULT '[]',
  key_metrics text[],
  channels text[],
  
  -- Validation
  assumptions text[],
  validation_steps jsonb DEFAULT '[]',
  feedback_collected jsonb DEFAULT '[]',
  pivot_notes text[],
  
  -- AI insights
  ai_feedback jsonb DEFAULT '{
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": [],
    "suggestions": [],
    "market_insights": [],
    "validation_tips": []
  }',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Create separate policies for each operation type
CREATE POLICY "Users can view their own ideas"
  ON ideas
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create ideas"
  ON ideas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas"
  ON ideas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
  ON ideas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at);