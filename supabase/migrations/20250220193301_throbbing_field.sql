-- Drop any existing check constraints
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_remote_policy_check;

-- First ensure all required columns exist
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS name text NOT NULL,
ADD COLUMN IF NOT EXISTS industries text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS target_market text,
ADD COLUMN IF NOT EXISTS business_model text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS mission text,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{
  "linkedin": null,
  "twitter": null,
  "github": null,
  "facebook": null,
  "website": null
}',
ADD COLUMN IF NOT EXISTS remote_policy text DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS company_culture text,
ADD COLUMN IF NOT EXISTS tech_stack jsonb DEFAULT '{
  "frontend": [],
  "backend": [],
  "infrastructure": [],
  "tools": []
}';

-- Add remote_policy constraint
ALTER TABLE companies
ADD CONSTRAINT companies_remote_policy_check 
CHECK (remote_policy IN ('remote', 'hybrid', 'office', 'flexible'));

-- Update any existing null values to defaults
UPDATE companies
SET 
  industries = COALESCE(industries, '{}'),
  is_public = COALESCE(is_public, false),
  social_links = COALESCE(social_links, '{
    "linkedin": null,
    "twitter": null,
    "github": null,
    "facebook": null,
    "website": null
  }'),
  remote_policy = COALESCE(remote_policy, 'flexible'),
  tech_stack = COALESCE(tech_stack, '{
    "frontend": [],
    "backend": [],
    "infrastructure": [],
    "tools": []
  }');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_industries ON companies USING gin(industries);
CREATE INDEX IF NOT EXISTS idx_companies_social_links ON companies USING gin(social_links);
CREATE INDEX IF NOT EXISTS idx_companies_tech_stack ON companies USING gin(tech_stack);