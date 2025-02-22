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
  'Competitor Analysis',
  'Research and analyze competitors to understand market positioning and opportunities.',
  1,
  true,
  '1-2 weeks',
  '[
    {
      "name": "Market Research Tool",
      "url": "/idea-hub/market-research",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Competitive Analysis Guide",
      "url": "https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Identify direct and indirect competitors",
    "Analyze their strengths and weaknesses",
    "Document pricing strategies",
    "Review marketing tactics",
    "Identify market gaps"
  ]'::jsonb,
  ARRAY[
    'Focus on key differentiators',
    'Monitor competitor changes regularly',
    'Look for underserved markets',
    'Document findings systematically'
  ]
),
(
  (SELECT id FROM stage),
  'Financial Modeling',
  'Create financial projections and business model.',
  2,
  true,
  '1-2 weeks',
  '[
    {
      "name": "Financial Model Builder",
      "url": "/idea-hub/business-model",
      "type": "internal"
    }
  ]'::jsonb,
  '[
    {
      "title": "Financial Modeling Guide",
      "url": "https://www.score.org/resource/business-plan-financial-projections-template",
      "type": "template"
    }
  ]'::jsonb,
  '[
    "Create revenue projections",
    "Estimate costs and expenses",
    "Build cash flow forecast",
    "Calculate break-even point",
    "Project funding needs"
  ]'::jsonb,
  ARRAY[
    'Be conservative in estimates',
    'Include multiple scenarios',
    'Update regularly with actuals',
    'Consider seasonal factors'
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
  'Beta Testing',
  'Test product with real users to gather feedback and identify issues.',
  1,
  true,
  '2-4 weeks',
  '[
    {
      "name": "Feedback Collection Tool",
      "url": "https://forms.google.com/",
      "type": "external"
    }
  ]'::jsonb,
  '[
    {
      "title": "Beta Testing Guide",
      "url": "https://www.userinterviews.com/blog/beta-testing-guide",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Recruit beta testers",
    "Create feedback channels",
    "Document bugs and issues",
    "Collect user suggestions",
    "Implement critical fixes"
  ]'::jsonb,
  ARRAY[
    'Start with a small group',
    'Define clear objectives',
    'Track all feedback systematically',
    'Prioritize critical issues'
  ]
),
(
  (SELECT id FROM stage),
  'Marketing Preparation',
  'Prepare marketing materials and launch strategy.',
  2,
  true,
  '2-3 weeks',
  '[
    {
      "name": "Marketing Plan Template",
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
    "Create marketing materials",
    "Set up social media accounts",
    "Plan launch campaign",
    "Prepare PR outreach",
    "Set up analytics tracking"
  ]'::jsonb,
  ARRAY[
    'Focus on your target audience',
    'Create compelling content',
    'Plan for multiple channels',
    'Set measurable goals'
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
  'Execute launch plan and monitor initial results.',
  1,
  true,
  '1-2 weeks',
  '[
    {
      "name": "Analytics Dashboard",
      "url": "https://analytics.google.com/",
      "type": "external"
    }
  ]'::jsonb,
  '[
    {
      "title": "Product Launch Playbook",
      "url": "https://www.productplan.com/learn/product-launch-checklist/",
      "type": "article"
    }
  ]'::jsonb,
  '[
    "Execute marketing campaign",
    "Monitor website traffic",
    "Track conversion metrics",
    "Gather customer feedback",
    "Address initial issues quickly"
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
      "url": "/dashboard",
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
    "Analyze customer data",
    "Optimize marketing channels",
    "Improve conversion rates",
    "Scale operations",
    "Build customer relationships"
  ]'::jsonb,
  ARRAY[
    'Focus on sustainable growth',
    'Test and measure everything',
    'Listen to customer feedback',
    'Invest in what works'
  ]
);