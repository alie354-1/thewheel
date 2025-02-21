-- Create company stages table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS company_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    order_index integer NOT NULL,
    required boolean DEFAULT false,
    estimated_duration text,
    resources jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Create company stage steps table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS company_stage_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id uuid REFERENCES company_stages(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    order_index integer NOT NULL,
    required boolean DEFAULT false,
    estimated_duration text,
    tools jsonb DEFAULT '[]',
    resources jsonb DEFAULT '[]',
    checklist jsonb DEFAULT '[]',
    tips text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Create company progress table if it doesn't exist
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Create company step suggestions table if it doesn't exist
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Enable RLS if not already enabled
DO $$ BEGIN
  ALTER TABLE company_stages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE company_stage_steps ENABLE ROW LEVEL SECURITY;
  ALTER TABLE company_progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE company_step_suggestions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- Drop existing policies to prevent conflicts
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

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_company_stages_order ON company_stages(order_index);
  CREATE INDEX IF NOT EXISTS idx_company_stage_steps_stage ON company_stage_steps(stage_id);
  CREATE INDEX IF NOT EXISTS idx_company_stage_steps_order ON company_stage_steps(order_index);
  CREATE INDEX IF NOT EXISTS idx_company_progress_company ON company_progress(company_id);
  CREATE INDEX IF NOT EXISTS idx_company_progress_stage ON company_progress(stage_id);
  CREATE INDEX IF NOT EXISTS idx_company_progress_step ON company_progress(step_id);
  CREATE INDEX IF NOT EXISTS idx_company_progress_status ON company_progress(status);
  CREATE INDEX IF NOT EXISTS idx_company_step_suggestions_step ON company_step_suggestions(step_id);
  CREATE INDEX IF NOT EXISTS idx_company_step_suggestions_user ON company_step_suggestions(user_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Insert initial stages and steps if they don't exist
DO $$ 
DECLARE
  stage_id uuid;
BEGIN
  -- Only insert if no stages exist
  IF NOT EXISTS (SELECT 1 FROM company_stages) THEN
    -- Insert stages
    INSERT INTO company_stages (name, description, order_index, required, estimated_duration) VALUES
    ('Ideation & Planning', 'Define your business concept and initial strategy', 1, true, '2-4 weeks'),
    ('Legal & Structure', 'Set up the legal foundation for your business', 2, true, '1-2 weeks'),
    ('Financial Setup', 'Establish financial systems and controls', 3, true, '1-2 weeks'),
    ('Brand & Identity', 'Create your brand identity and online presence', 4, false, '2-3 weeks'),
    ('Product Development', 'Build and validate your minimum viable product', 5, false, '4-12 weeks'),
    ('Market Entry', 'Prepare for and execute market entry', 6, false, '4-8 weeks'),
    ('Growth & Scale', 'Scale operations and grow your customer base', 7, false, 'Ongoing');

    -- Get Ideation & Planning stage ID
    SELECT id INTO stage_id FROM company_stages WHERE name = 'Ideation & Planning';

    -- Insert steps for Ideation & Planning stage
    INSERT INTO company_stage_steps (
      stage_id,
      name,
      description,
      order_index,
      required,
      estimated_duration,
      tools,
      resources,
      checklist,
      tips
    ) VALUES
    (
      stage_id,
      'Business Model Canvas',
      'Create a comprehensive business model canvas to visualize your business concept',
      1,
      true,
      '3-5 days',
      '[
        {
          "name": "Business Model Canvas Tool",
          "url": "/idea-hub/canvas",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "Business Model Canvas Guide",
          "url": "https://www.strategyzer.com/canvas/business-model-canvas",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Define value proposition",
        "Identify customer segments",
        "Map out revenue streams",
        "List key resources and activities",
        "Outline cost structure"
      ]'::jsonb,
      ARRAY[
        'Focus on solving real customer problems',
        'Validate assumptions with potential customers',
        'Keep it simple and clear',
        'Review and update regularly'
      ]
    ),
    (
      stage_id,
      'Market Research',
      'Conduct thorough market research to validate your business idea',
      2,
      true,
      '5-7 days',
      '[
        {
          "name": "Market Research Tool",
          "url": "/idea-hub/market-research",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "Market Research Guide",
          "url": "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Define target market size",
        "Analyze competitors",
        "Identify market trends",
        "Document customer needs",
        "Validate pricing strategy"
      ]'::jsonb,
      ARRAY[
        'Use both primary and secondary research',
        'Focus on quantifiable data',
        'Document your findings',
        'Look for market gaps and opportunities'
      ]
    );
  END IF;
END $$;