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
  'Legal Formation',
  'Establish your business legal entity and obtain necessary registrations.',
  1,
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
    "File formation documents",
    "Obtain EIN",
    "Register for state/local taxes",
    "Get necessary licenses/permits"
  ]'::jsonb,
  ARRAY[
    'Consider future growth plans when choosing structure',
    'Keep copies of all formation documents',
    'Set up a separate business bank account',
    'Consider professional liability insurance'
  ]
),
(
  (SELECT id FROM stage),
  'Financial Setup',
  'Set up financial accounts and systems.',
  2,
  true,
  '1 week',
  '[
    {
      "name": "Accounting Software",
      "url": "https://www.quickbooks.com/",
      "type": "external"
    }
  ]'::jsonb,
  '[
    {
      "title": "Financial Setup Guide",
      "url": "https://www.sba.gov/business-guide/launch-your-business/open-business-bank-account",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Open business bank account",
    "Set up accounting software",
    "Establish payroll system",
    "Create expense policies",
    "Set up payment processing"
  ]'::jsonb,
  ARRAY[
    'Keep business and personal finances separate',
    'Set up automated bookkeeping',
    'Plan for taxes from day one',
    'Maintain organized financial records'
  ]
),
(
  (SELECT id FROM stage),
  'Team Structure',
  'Define organizational structure and roles.',
  3,
  true,
  '1 week',
  '[
    {
      "name": "Org Chart Tool",
      "url": "https://www.lucidchart.com/",
      "type": "external"
    }
  ]'::jsonb,
  '[
    {
      "title": "Team Structure Guide",
      "url": "https://www.atlassian.com/work-management/organizational-structure",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Define organizational structure",
    "Create role descriptions",
    "Establish reporting lines",
    "Document team policies",
    "Plan hiring timeline"
  ]'::jsonb,
  ARRAY[
    'Keep structure flexible for growth',
    'Define clear responsibilities',
    'Document processes early',
    'Plan for key hires'
  ]
);

-- Insert steps for Planning & Development stage
WITH stage AS (
  SELECT id FROM company_stages WHERE name = 'Planning & Development'
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
  'Product Strategy',
  'Define your product strategy and roadmap.',
  1,
  true,
  '2-3 weeks',
  '[
    {
      "name": "Product Roadmap",
      "url": "/idea-hub/canvas",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Product Strategy Guide",
      "url": "https://www.productplan.com/learn/product-strategy-framework/",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Define product vision",
    "Create feature roadmap",
    "Set development milestones",
    "Plan MVP scope",
    "Define success metrics"
  ]'::jsonb,
  ARRAY[
    'Focus on core features first',
    'Get early user feedback',
    'Plan for scalability',
    'Document technical decisions'
  ]
),
(
  (SELECT id FROM stage),
  'Market Analysis',
  'Research and analyze your target market.',
  2,
  true,
  '2-3 weeks',
  '[
    {
      "name": "Market Research Tool",
      "url": "/idea-hub/market-research",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Market Analysis Guide",
      "url": "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Define target market",
    "Analyze competition",
    "Identify market trends",
    "Assess market size",
    "Document findings"
  ]'::jsonb,
  ARRAY[
    'Use both primary and secondary research',
    'Focus on specific market segments',
    'Keep analysis updated regularly',
    'Look for market gaps'
  ]
);

-- Insert steps for Pre-launch stage
WITH stage AS (
  SELECT id FROM company_stages WHERE name = 'Pre-launch'
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
  'Marketing Preparation',
  'Prepare marketing materials and launch strategy.',
  1,
  true,
  '2-3 weeks',
  '[
    {
      "name": "Marketing Plan",
      "url": "/idea-hub/market-research",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Launch Marketing Guide",
      "url": "https://blog.hubspot.com/marketing/product-launch-checklist",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Create marketing plan",
    "Develop brand assets",
    "Set up analytics",
    "Plan launch campaign",
    "Prepare PR materials"
  ]'::jsonb,
  ARRAY[
    'Focus on target audience',
    'Test messaging early',
    'Set measurable goals',
    'Plan multi-channel approach'
  ]
),
(
  (SELECT id FROM stage),
  'Technical Setup',
  'Set up technical infrastructure and tools.',
  2,
  true,
  '1-2 weeks',
  '[
    {
      "name": "Infrastructure Setup",
      "url": "/company/settings",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Technical Setup Guide",
      "url": "https://www.digitalocean.com/community/tutorials",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Set up development environment",
    "Configure production infrastructure",
    "Implement monitoring",
    "Set up backup systems",
    "Document technical processes"
  ]'::jsonb,
  ARRAY[
    'Automate where possible',
    'Plan for scalability',
    'Implement security best practices',
    'Document everything'
  ]
);

-- Insert steps for Launch/Post Launch stage
WITH stage AS (
  SELECT id FROM company_stages WHERE name = 'Launch/Post Launch'
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
  'Launch Execution',
  'Execute launch plan and monitor results.',
  1,
  true,
  '1-2 weeks',
  '[
    {
      "name": "Analytics Dashboard",
      "url": "/company/dashboard",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Launch Playbook",
      "url": "https://www.productplan.com/learn/product-launch-checklist/",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Execute marketing campaign",
    "Monitor metrics",
    "Gather feedback",
    "Address issues quickly",
    "Document learnings"
  ]'::jsonb,
  ARRAY[
    'Monitor all channels closely',
    'Respond to feedback quickly',
    'Document everything',
    'Be ready to pivot if needed'
  ]
),
(
  (SELECT id FROM stage),
  'Growth & Optimization',
  'Scale operations and optimize based on data.',
  2,
  true,
  'Ongoing',
  '[
    {
      "name": "Growth Analytics",
      "url": "/company/dashboard",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Growth Strategy Guide",
      "url": "https://www.growthmarketingpro.com/growth-marketing-strategy/",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Analyze metrics",
    "Optimize processes",
    "Scale infrastructure",
    "Expand team",
    "Plan next phase"
  ]'::jsonb,
  ARRAY[
    'Focus on sustainable growth',
    'Keep monitoring metrics',
    'Maintain documentation',
    'Plan for long-term'
  ]
);