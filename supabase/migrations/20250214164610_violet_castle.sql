/*
  # Remaining Idea Hub Tools Schema

  1. New Tables
    - `business_models`
      - For storing business model data
      - Includes revenue streams, costs, metrics
    
    - `pitch_decks`
      - For storing pitch deck presentations
      - Includes slides and content
    
    - `resource_library`
      - For storing educational resources
      - Includes templates, guides, articles

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Support for public sharing
*/

-- Business Models
CREATE TABLE business_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  revenue_streams jsonb DEFAULT '[]',
  cost_structure jsonb DEFAULT '[]',
  key_metrics jsonb DEFAULT '[]',
  financial_projections jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pitch Decks
CREATE TABLE pitch_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slides jsonb DEFAULT '[]',
  theme text DEFAULT 'default',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resource Library
CREATE TABLE resource_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  type text NOT NULL,
  content_url text NOT NULL,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE business_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;

-- Policies for business_models
CREATE POLICY "Users can manage their own business models"
  ON business_models
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public business models are viewable by everyone"
  ON business_models
  FOR SELECT
  USING (is_public = true);

-- Policies for pitch_decks
CREATE POLICY "Users can manage their own pitch decks"
  ON pitch_decks
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public pitch decks are viewable by everyone"
  ON pitch_decks
  FOR SELECT
  USING (is_public = true);

-- Policies for resource_library
CREATE POLICY "Anyone can view free resources"
  ON resource_library
  FOR SELECT
  USING (NOT is_premium);

CREATE POLICY "Premium users can view all resources"
  ON resource_library
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Indexes
CREATE INDEX business_models_user_id_idx ON business_models(user_id);
CREATE INDEX pitch_decks_user_id_idx ON pitch_decks(user_id);
CREATE INDEX resource_library_category_idx ON resource_library(category);
CREATE INDEX resource_library_type_idx ON resource_library(type);