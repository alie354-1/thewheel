/*
  # Idea Hub Schema

  1. New Tables
    - `idea_canvases`
      - For storing business model canvases
      - Includes sections for problem, solution, value prop, etc.
    
    - `market_research`
      - For storing market analysis data
      - Includes market insights and competitor analysis
    
    - `ai_discussions`
      - For storing chat history with AI co-founder
      - Includes message history and context

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Support for sharing/collaboration later
*/

-- Idea Canvases
CREATE TABLE idea_canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  sections jsonb NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Market Research
CREATE TABLE market_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  insights jsonb,
  competitors jsonb,
  notes text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Discussions
CREATE TABLE ai_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  messages jsonb NOT NULL,
  context jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE idea_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_discussions ENABLE ROW LEVEL SECURITY;

-- Policies for idea_canvases
CREATE POLICY "Users can manage their own canvases"
  ON idea_canvases
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public canvases are viewable by everyone"
  ON idea_canvases
  FOR SELECT
  USING (is_public = true);

-- Policies for market_research
CREATE POLICY "Users can manage their own research"
  ON market_research
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public research is viewable by everyone"
  ON market_research
  FOR SELECT
  USING (is_public = true);

-- Policies for ai_discussions
CREATE POLICY "Users can manage their own discussions"
  ON ai_discussions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public discussions are viewable by everyone"
  ON ai_discussions
  FOR SELECT
  USING (is_public = true);

-- Indexes
CREATE INDEX idea_canvases_user_id_idx ON idea_canvases(user_id);
CREATE INDEX market_research_user_id_idx ON market_research(user_id);
CREATE INDEX ai_discussions_user_id_idx ON ai_discussions(user_id);