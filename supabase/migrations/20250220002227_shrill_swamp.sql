-- Drop existing policies first
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view stages" ON company_stages;
  DROP POLICY IF EXISTS "Anyone can view steps" ON company_stage_steps;
  DROP POLICY IF EXISTS "Companies can view their progress" ON company_progress;
  DROP POLICY IF EXISTS "Companies can update their progress" ON company_progress;
  DROP POLICY IF EXISTS "Anyone can view public suggestions" ON company_step_suggestions;
  DROP POLICY IF EXISTS "Users can manage their suggestions" ON company_step_suggestions;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create company progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES company_stages(id) ON DELETE CASCADE,
  step_id uuid REFERENCES company_stage_steps(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  notes text,
  attachments jsonb DEFAULT '[]',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, stage_id, step_id)
);

-- Create company step suggestions table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_step_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid REFERENCES company_stage_steps(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_step_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view stages"
  ON company_stages
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view steps"
  ON company_stage_steps
  FOR SELECT
  USING (true);

CREATE POLICY "Companies can view their progress"
  ON company_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_progress.company_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM company_members
          WHERE company_id = companies.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Companies can update their progress"
  ON company_progress
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_progress.company_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM company_members
          WHERE company_id = companies.id
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin')
        )
      )
    )
  );

CREATE POLICY "Anyone can view public suggestions"
  ON company_step_suggestions
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can manage their suggestions"
  ON company_step_suggestions
  FOR ALL
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_progress_company ON company_progress(company_id);
CREATE INDEX IF NOT EXISTS idx_company_progress_stage ON company_progress(stage_id);
CREATE INDEX IF NOT EXISTS idx_company_progress_step ON company_progress(step_id);
CREATE INDEX IF NOT EXISTS idx_company_progress_status ON company_progress(status);
CREATE INDEX IF NOT EXISTS idx_company_step_suggestions_step ON company_step_suggestions(step_id);
CREATE INDEX IF NOT EXISTS idx_company_step_suggestions_user ON company_step_suggestions(user_id);