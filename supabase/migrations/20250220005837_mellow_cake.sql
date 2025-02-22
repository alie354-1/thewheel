-- First, clear existing data to avoid duplicates
TRUNCATE company_stages CASCADE;

-- Insert company stages
INSERT INTO company_stages (name, description, order_index, required, estimated_duration) VALUES
('Company Setup', 'Essential steps to establish your business legally and operationally', 1, true, '4-8 weeks'),
('Planning & Development', 'Define and build your product or service offering', 2, true, '8-16 weeks'),
('Pre-launch', 'Prepare for market entry and initial customer acquisition', 3, true, '4-8 weeks'),
('Launch/Post Launch', 'Execute launch and establish growth operations', 4, true, 'Ongoing');

-- Insert steps for Company Setup stage
WITH stage AS (
  SELECT id FROM company_stages WHERE name = 'Company Setup'
)
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
  (SELECT id FROM stage),
  'Choose a Domain Name',
  'Establishes online presence, builds credibility, essential for website and email.',
  1,
  true,
  '1-2 days',
  '[]'::jsonb,
  '[
    {
      "title": "Domain Name Guide",
      "url": "https://www.namecheap.com/domains/domain-name-search/",
      "type": "tool"
    }
  ]'::jsonb,
  '[
    "Brainstorm names aligned with brand/product",
    "Check availability on registrar sites",
    "Register chosen domain"
  ]'::jsonb,
  ARRAY[
    'Prioritize relevant, memorable names',
    'Consider SEO impact',
    'Use free domain generators',
    'Look for registrar discounts'
  ]
),
(
  (SELECT id FROM stage),
  'Set Up Business Email',
  'Professionalism, credibility, separates personal and business communication.',
  2,
  true,
  '1 day',
  '[]'::jsonb,
  '[
    {
      "title": "Google Workspace",
      "url": "https://workspace.google.com/",
      "type": "tool"
    }
  ]'::jsonb,
  '[
    "Link domain to email provider",
    "Create accounts for team",
    "Set up email signatures"
  ]'::jsonb,
  ARRAY[
    'Choose provider with features you need',
    'Consider storage and calendar needs',
    'Set up professional signatures'
  ]
),
(
  (SELECT id FROM stage),
  'Incorporate the Business',
  'Protects personal assets, provides legal legitimacy, required for certain financing and partnerships.',
  3,
  true,
  '1-2 weeks',
  '[
    {
      "name": "Legal Templates",
      "url": "https://www.legalzoom.com/",
      "type": "external"
    }
  ]'::jsonb,
  '[
    {
      "title": "Business Structure Guide",
      "url": "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Choose business structure (LLC, S-Corp, etc.)",
    "File paperwork with state",
    "Obtain EIN",
    "Set up registered agent"
  ]'::jsonb,
  ARRAY[
    'Research structures carefully',
    'Consider future growth plans',
    'Use online legal services for simple cases',
    'Consult attorney if needed'
  ]
);