-- Insert remaining tool categories

-- HR Management
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('BambooHR', 'Leading HR management software for small to medium-sized businesses.', 'HR Management', 'bamboohr.com', 'per-user',
  ARRAY['Employee database', 'Time tracking', 'Performance management', 'Onboarding'],
  ARRAY['Slack', 'Google Workspace', 'ADP', 'Greenhouse'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.7
),
('Gusto', 'HR platform with focus on payroll and benefits.', 'HR Management', 'gusto.com', 'per-user',
  ARRAY['Payroll', 'Benefits administration', 'Time tracking', 'HR compliance'],
  ARRAY['QuickBooks', 'Xero', 'TSheets', 'When I Work'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.8
);

-- Accounting Software
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Xero', 'Cloud-based accounting software for small businesses.', 'Accounting', 'xero.com', 'subscription',
  ARRAY['Invoicing', 'Bank reconciliation', 'Expense claims', 'Financial reporting'],
  ARRAY['PayPal', 'Stripe', 'Square', 'Bill.com'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Professional Services', 'E-commerce'],
  4.6
),
('FreshBooks', 'Accounting software focused on small businesses and freelancers.', 'Accounting', 'freshbooks.com', 'subscription',
  ARRAY['Time tracking', 'Expense tracking', 'Project accounting', 'Client portal'],
  ARRAY['PayPal', 'Stripe', 'G Suite', 'Zapier'],
  ARRAY['Early-stage'], ARRAY['1-10'], ARRAY['B2B', 'Service'], ARRAY['Professional Services', 'Creative'],
  4.5
);

-- Customer Support
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Zendesk', 'Customer service and engagement platform.', 'Customer Support', 'zendesk.com', 'per-user',
  ARRAY['Help desk', 'Live chat', 'Knowledge base', 'Customer portal'],
  ARRAY['Salesforce', 'Slack', 'Jira', 'HubSpot'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'E-commerce'],
  4.7
),
('Intercom', 'Customer messaging platform.', 'Customer Support', 'intercom.com', 'per-user',
  ARRAY['Live chat', 'Chatbots', 'Help center', 'Customer engagement'],
  ARRAY['Slack', 'Salesforce', 'HubSpot', 'Zapier'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.8
);

-- Analytics
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Mixpanel', 'Product analytics platform.', 'Analytics', 'mixpanel.com', 'usage-based',
  ARRAY['User analytics', 'Funnel analysis', 'Retention tracking', 'A/B testing'],
  ARRAY['Segment', 'Zapier', 'Slack', 'GitHub'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.7
),
('Amplitude', 'Product analytics platform.', 'Analytics', 'amplitude.com', 'usage-based',
  ARRAY['Behavioral analytics', 'User segmentation', 'Funnel analysis', 'Retention'],
  ARRAY['Segment', 'Zapier', 'Slack', 'Jira'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.8
);

-- Project Management
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Asana', 'Project and task management platform.', 'Project Management', 'asana.com', 'per-user',
  ARRAY['Task management', 'Project tracking', 'Team collaboration', 'Workflow automation'],
  ARRAY['Slack', 'Google Workspace', 'GitHub', 'Zoom'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.7
),
('Monday.com', 'Visual project management platform.', 'Project Management', 'monday.com', 'per-user',
  ARRAY['Project tracking', 'Team collaboration', 'Workflow automation', 'Resource management'],
  ARRAY['Slack', 'Google Calendar', 'GitHub', 'Zoom'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.6
);

-- Continue with more categories in subsequent migrations...