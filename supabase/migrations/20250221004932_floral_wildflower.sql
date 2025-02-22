-- Insert more tool categories

-- Security
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Auth0', 'Identity and authentication platform.', 'Security', 'auth0.com', 'per-user',
  ARRAY['Single sign-on', 'Multi-factor authentication', 'Social login', 'User management'],
  ARRAY['AWS', 'Azure', 'Google Cloud', 'Heroku'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.8
),
('1Password', 'Password management for teams.', 'Security', '1password.com', 'per-user',
  ARRAY['Password management', 'Secure sharing', 'Access control', 'Activity logs'],
  ARRAY['Slack', 'Azure AD', 'Okta', 'Google Workspace'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.7
);

-- Equity Management
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Carta', 'Equity management and valuation platform.', 'Equity Management', 'carta.com', 'subscription',
  ARRAY['Cap table management', '409A valuations', 'Stock option management', 'Board management'],
  ARRAY['DocuSign', 'QuickBooks', 'Xero', 'ADP'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.6
),
('Pulley', 'Cap table and equity management platform.', 'Equity Management', 'pulley.com', 'subscription',
  ARRAY['Cap table management', 'Option grants', 'Scenario modeling', 'Compliance'],
  ARRAY['DocuSign', 'Gusto', 'Rippling', 'Mercury'],
  ARRAY['Early-stage'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.5
);

-- Crowdfunding
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Kickstarter', 'Crowdfunding platform for creative projects.', 'Crowdfunding', 'kickstarter.com', 'percentage',
  ARRAY['Project funding', 'Backer management', 'Campaign analytics', 'Reward fulfillment'],
  ARRAY['Stripe', 'PayPal', 'Shopify', 'Mailchimp'],
  ARRAY['Early-stage'], ARRAY['1-10'], ARRAY['B2C', 'Product'], ARRAY['Consumer Products', 'Creative', 'Technology'],
  4.4
),
('WeFunder', 'Equity crowdfunding platform.', 'Crowdfunding', 'wefunder.com', 'percentage',
  ARRAY['Equity fundraising', 'Investor management', 'Due diligence', 'Compliance'],
  ARRAY['DocuSign', 'Stripe', 'Banking services'],
  ARRAY['Early-stage'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'Consumer Products'],
  4.5
);

-- M&A
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('DealRoom', 'M&A lifecycle management platform.', 'M&A', 'dealroom.net', 'subscription',
  ARRAY['Due diligence', 'Document management', 'Project management', 'Integration planning'],
  ARRAY['DocuSign', 'Google Workspace', 'Microsoft 365'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B'], ARRAY['Professional Services', 'Technology'],
  4.3
),
('FirmRoom', 'Virtual data room and M&A platform.', 'M&A', 'firmroom.com', 'subscription',
  ARRAY['Data room', 'Document security', 'Deal management', 'Reporting'],
  ARRAY['DocuSign', 'Microsoft 365', 'Google Workspace'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B'], ARRAY['Professional Services', 'Financial Services'],
  4.2
);

-- Business Planning
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('LivePlan', 'Business planning and financial forecasting software.', 'Business Planning', 'liveplan.com', 'subscription',
  ARRAY['Business plan builder', 'Financial forecasting', 'Performance tracking', 'Pitch builder'],
  ARRAY['QuickBooks', 'Xero', 'Excel'],
  ARRAY['Early-stage'], ARRAY['1-10'], ARRAY['B2B', 'B2C'], ARRAY['Professional Services', 'Technology'],
  4.4
),
('Enloop', 'Automated business plan writing software.', 'Business Planning', 'enloop.com', 'subscription',
  ARRAY['Business plan writing', 'Financial projections', 'Performance score', 'Text sync'],
  ARRAY['Excel', 'PDF export'],
  ARRAY['Early-stage'], ARRAY['1-10'], ARRAY['B2B', 'B2C'], ARRAY['Professional Services', 'Small Business'],
  4.2
);

-- Performance Metrics
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Databox', 'Business analytics and KPI dashboard platform.', 'Performance Metrics', 'databox.com', 'subscription',
  ARRAY['KPI dashboards', 'Performance tracking', 'Goal management', 'Alerts'],
  ARRAY['Google Analytics', 'Salesforce', 'HubSpot', 'QuickBooks'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Marketing'],
  4.5
),
('Geckoboard', 'Real-time business dashboard software.', 'Performance Metrics', 'geckoboard.com', 'subscription',
  ARRAY['TV dashboards', 'Data visualization', 'Custom metrics', 'Integrations'],
  ARRAY['Salesforce', 'Google Analytics', 'Stripe', 'Zendesk'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'E-commerce'],
  4.4
);

-- Continue with more categories in subsequent migrations...