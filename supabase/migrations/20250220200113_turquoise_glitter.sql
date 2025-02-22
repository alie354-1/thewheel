-- Drop remote policy check constraint and column
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_remote_policy_check;

ALTER TABLE companies
DROP COLUMN IF EXISTS remote_policy;

-- Update company setup form fields
UPDATE companies
SET 
  industries = COALESCE(industries, '{}'),
  social_links = COALESCE(social_links, '{
    "linkedin": null,
    "twitter": null,
    "github": null,
    "facebook": null,
    "website": null
  }'),
  tech_stack = COALESCE(tech_stack, '{
    "frontend": [],
    "backend": [],
    "infrastructure": [],
    "tools": []
  }');