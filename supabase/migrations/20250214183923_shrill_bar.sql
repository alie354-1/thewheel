/*
  # Add Company Recommendations System

  1. New Tables
    - `company_recommendations`
      - Stores personalized recommendations for companies
    - `recommendation_templates`
      - Stores predefined recommendations based on company stages/types
  
  2. Changes
    - Add recommendation tracking to companies table
    
  3. Security
    - Enable RLS
    - Add policies for recommendation access
*/

-- Create recommendation templates table
CREATE TABLE recommendation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  company_stage text[],
  business_model text[],
  company_size text[],
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company recommendations table
CREATE TABLE company_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  template_id uuid REFERENCES recommendation_templates(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  priority integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add recommendation tracking to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_recommendation_at timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS recommendation_preferences jsonb DEFAULT '{"categories": ["all"], "frequency": "daily"}';

-- Enable RLS
ALTER TABLE recommendation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies for recommendation_templates
CREATE POLICY "Anyone can view recommendation templates"
  ON recommendation_templates
  FOR SELECT
  USING (true);

-- Policies for company_recommendations
CREATE POLICY "Companies can view their recommendations"
  ON company_recommendations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_recommendations.company_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update their recommendations"
  ON company_recommendations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_recommendations.company_id
      AND owner_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_recommendation_templates_stage ON recommendation_templates USING gin(company_stage);
CREATE INDEX idx_recommendation_templates_model ON recommendation_templates USING gin(business_model);
CREATE INDEX idx_company_recommendations_company_id ON company_recommendations(company_id);
CREATE INDEX idx_company_recommendations_status ON company_recommendations(status);

-- Helper function to generate recommendations
CREATE OR REPLACE FUNCTION generate_company_recommendations(company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_record companies%ROWTYPE;
BEGIN
  -- Get company details
  SELECT * INTO company_record
  FROM companies
  WHERE id = company_id;

  -- Insert recommendations based on templates
  INSERT INTO company_recommendations (
    company_id,
    template_id,
    title,
    description,
    category,
    priority
  )
  SELECT
    company_id,
    rt.id,
    rt.title,
    rt.description,
    rt.category,
    rt.priority
  FROM recommendation_templates rt
  WHERE
    company_record.stage = ANY(rt.company_stage)
    AND company_record.business_model = ANY(rt.business_model)
    AND company_record.size = ANY(rt.company_size)
    AND NOT EXISTS (
      SELECT 1
      FROM company_recommendations cr
      WHERE cr.company_id = company_id
      AND cr.template_id = rt.id
      AND cr.status != 'dismissed'
    );

  -- Update last recommendation timestamp
  UPDATE companies
  SET last_recommendation_at = now()
  WHERE id = company_id;
END;
$$;