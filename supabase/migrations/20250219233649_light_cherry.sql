-- Create ideas table
CREATE TABLE ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('concept', 'validation', 'planning', 'execution')),
  problem_statement text,
  target_audience text,
  solution text,
  unique_value text,
  market_size text,
  competition text,
  business_model text,
  go_to_market text,
  resources_needed text,
  next_steps text,
  ai_feedback jsonb DEFAULT '{
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": [],
    "suggestions": []
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own ideas"
  ON ideas
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_stage ON ideas(stage);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);