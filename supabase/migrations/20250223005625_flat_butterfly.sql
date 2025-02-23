-- Create ideas table
CREATE TABLE ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  problem_statement text,
  solution text,
  target_market text,
  status text DEFAULT 'draft',
  ai_feedback jsonb DEFAULT '{}',
  market_insights jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create idea_variations table
CREATE TABLE idea_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  differentiator text,
  target_market text,
  revenue_model text,
  liked_aspects text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_variations ENABLE ROW LEVEL SECURITY;

-- Create policies for ideas
CREATE POLICY "Users can manage their own ideas"
  ON ideas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for idea variations
CREATE POLICY "Users can manage their own idea variations"
  ON idea_variations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_variations.idea_id
      AND ideas.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ideas
      WHERE ideas.id = idea_variations.idea_id
      AND ideas.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX ideas_user_id_idx ON ideas(user_id);
CREATE INDEX idea_variations_idea_id_idx ON idea_variations(idea_id);
CREATE INDEX ideas_status_idx ON ideas(status);
CREATE INDEX ideas_created_at_idx ON ideas(created_at);