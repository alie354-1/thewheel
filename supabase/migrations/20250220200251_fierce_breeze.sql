-- Drop existing tools table if it exists
DROP TABLE IF EXISTS tools CASCADE;

-- Create tools table
CREATE TABLE tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  url text NOT NULL,
  pricing_model text,
  features text[],
  integrations text[],
  company_stages text[],
  company_sizes text[],
  business_models text[],
  industries text[],
  rating numeric CHECK (rating >= 0 AND rating <= 5),
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing tools
CREATE POLICY "Anyone can view tools"
  ON tools
  FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_company_stages ON tools USING gin(company_stages);
CREATE INDEX IF NOT EXISTS idx_tools_company_sizes ON tools USING gin(company_sizes);
CREATE INDEX IF NOT EXISTS idx_tools_business_models ON tools USING gin(business_models);
CREATE INDEX IF NOT EXISTS idx_tools_industries ON tools USING gin(industries);

-- Insert some initial tools
INSERT INTO tools (
  name,
  description,
  category,
  url,
  pricing_model,
  features,
  integrations,
  company_stages,
  company_sizes,
  business_models,
  industries,
  rating
) VALUES
(
  'QuickBooks Online',
  'Cloud-based accounting software for small businesses',
  'Finance',
  'https://quickbooks.intuit.com',
  'subscription',
  ARRAY['Invoicing', 'Expense tracking', 'Financial reporting', 'Payroll', 'Tax preparation'],
  ARRAY['PayPal', 'Square', 'Stripe', 'Bill.com'],
  ARRAY['Company Setup', 'Planning & Development', 'Pre-launch', 'Launch/Post Launch'],
  ARRAY['1-10', '11-50', '51-200'],
  ARRAY['B2B', 'B2C', 'SaaS', 'Service'],
  ARRAY['SaaS', 'E-commerce', 'Professional Services', 'Retail'],
  4.5
),
(
  'Stripe',
  'Online payment processing platform',
  'Finance',
  'https://stripe.com',
  'per-transaction',
  ARRAY['Payment processing', 'Subscription billing', 'Invoicing', 'Fraud prevention'],
  ARRAY['QuickBooks', 'Xero', 'Shopify', 'WooCommerce'],
  ARRAY['Pre-launch', 'Launch/Post Launch'],
  ARRAY['1-10', '11-50', '51-200', '201-500', '501+'],
  ARRAY['B2B', 'B2C', 'SaaS', 'E-commerce', 'Marketplace'],
  ARRAY['SaaS', 'E-commerce', 'FinTech', 'Marketplace'],
  4.8
),
(
  'HubSpot',
  'All-in-one marketing, sales, and CRM platform',
  'Marketing',
  'https://hubspot.com',
  'freemium',
  ARRAY['CRM', 'Email marketing', 'Content management', 'Analytics', 'Lead generation'],
  ARRAY['Salesforce', 'Gmail', 'Slack', 'Zoom'],
  ARRAY['Pre-launch', 'Launch/Post Launch'],
  ARRAY['1-10', '11-50', '51-200', '201-500'],
  ARRAY['B2B', 'B2C', 'SaaS'],
  ARRAY['SaaS', 'Technology', 'Professional Services', 'Marketing'],
  4.6
),
(
  'Notion',
  'All-in-one workspace for notes, docs, and collaboration',
  'Productivity',
  'https://notion.so',
  'freemium',
  ARRAY['Document management', 'Project management', 'Wiki', 'Task tracking'],
  ARRAY['Slack', 'Google Drive', 'Trello', 'GitHub'],
  ARRAY['Company Setup', 'Planning & Development', 'Pre-launch', 'Launch/Post Launch'],
  ARRAY['1-10', '11-50', '51-200', '201-500'],
  ARRAY['B2B', 'B2C', 'SaaS', 'Service'],
  ARRAY['SaaS', 'Technology', 'Professional Services', 'Education'],
  4.7
),
(
  'GitHub',
  'Version control and collaboration platform',
  'Development',
  'https://github.com',
  'freemium',
  ARRAY['Version control', 'Issue tracking', 'Project management', 'CI/CD', 'Code review'],
  ARRAY['Slack', 'Jira', 'VS Code', 'CircleCI'],
  ARRAY['Planning & Development', 'Pre-launch', 'Launch/Post Launch'],
  ARRAY['1-10', '11-50', '51-200', '201-500', '501+'],
  ARRAY['B2B', 'SaaS', 'Technology'],
  ARRAY['SaaS', 'Technology', 'Development'],
  4.8
),
(
  'Slack',
  'Business communication and collaboration platform',
  'Communication',
  'https://slack.com',
  'per-user',
  ARRAY['Team messaging', 'File sharing', 'Video calls', 'App integrations'],
  ARRAY['Google Workspace', 'GitHub', 'Jira', 'Zoom'],
  ARRAY['Company Setup', 'Planning & Development', 'Pre-launch', 'Launch/Post Launch'],
  ARRAY['1-10', '11-50', '51-200', '201-500', '501+'],
  ARRAY['B2B', 'B2C', 'SaaS', 'Service'],
  ARRAY['SaaS', 'Technology', 'Professional Services'],
  4.7
);

-- Create function to get recommended tools
CREATE OR REPLACE FUNCTION get_recommended_tools(
  p_stage text,
  p_company_size text DEFAULT NULL,
  p_business_model text DEFAULT NULL,
  p_industries text[] DEFAULT NULL,
  p_limit integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  url text,
  pricing_model text,
  features text[],
  rating numeric,
  match_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH scored_tools AS (
    SELECT 
      t.id,
      t.name,
      t.description,
      t.category,
      t.url,
      t.pricing_model,
      t.features,
      t.rating,
      -- Calculate match score based on various factors
      (
        CASE WHEN p_stage = ANY(t.company_stages) THEN 2.0 ELSE 0.0 END +
        CASE WHEN p_company_size IS NULL OR p_company_size = ANY(t.company_sizes) THEN 1.0 ELSE 0.0 END +
        CASE WHEN p_business_model IS NULL OR p_business_model = ANY(t.business_models) THEN 1.0 ELSE 0.0 END +
        CASE WHEN p_industries IS NULL OR EXISTS (
          SELECT 1 FROM unnest(p_industries) i
          WHERE i = ANY(t.industries)
        ) THEN 1.0 ELSE 0.0 END +
        (t.rating * 0.5)  -- Weight rating at 50%
      ) as match_score
    FROM tools t
    WHERE 
      p_stage = ANY(t.company_stages)
      AND (p_company_size IS NULL OR p_company_size = ANY(t.company_sizes))
      AND (p_business_model IS NULL OR p_business_model = ANY(t.business_models))
      AND (p_industries IS NULL OR EXISTS (
        SELECT 1 FROM unnest(p_industries) i
        WHERE i = ANY(t.industries)
      ))
  )
  SELECT 
    id,
    name,
    description,
    category,
    url,
    pricing_model,
    features,
    rating,
    match_score
  FROM scored_tools
  ORDER BY match_score DESC, rating DESC
  LIMIT p_limit;
END;
$$;