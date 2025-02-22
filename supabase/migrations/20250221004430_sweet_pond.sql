-- Insert tools data in batches by category

-- Hosting & Domains
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Bluehost', 'Popular web hosting company that also offers domain registration.', 'Hosting & Domains', 'bluehost.com', 'subscription', 
  ARRAY['Easy setup with WordPress', 'Free domain with hosting', 'Email hosting', 'SSL certificates'],
  ARRAY['WordPress', 'cPanel', 'CloudFlare'],
  ARRAY['Early-stage'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'E-commerce', 'Professional Services'],
  4.0
),
('DreamHost', 'Web hosting provider with domain registration and privacy features.', 'Hosting & Domains', 'dreamhost.com', 'subscription',
  ARRAY['Unlimited bandwidth', 'Free WHOIS privacy', 'Free SSL', 'Automated backups'],
  ARRAY['WordPress', 'Ruby', 'Python', 'PHP'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'E-commerce'],
  4.0
),
('GoDaddy', 'Largest domain registrar and web hosting company.', 'Hosting & Domains', 'godaddy.com', 'subscription',
  ARRAY['Domain registration', 'Web hosting', 'Website builder', 'Professional email'],
  ARRAY['WordPress', 'Office 365', 'Google Workspace'],
  ARRAY['Early-stage', 'Enterprise'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'E-commerce'],
  4.0
);

-- Email Services
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Google Workspace', 'Professional email and collaboration tools.', 'Email Services', 'workspace.google.com', 'per-user',
  ARRAY['Professional email', 'Cloud storage', 'Video conferencing', 'Document collaboration'],
  ARRAY['Slack', 'CRM systems', 'Project management tools'],
  ARRAY['Early-stage', 'Growing', 'Enterprise'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'B2C', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.8
),
('Microsoft 365', 'Business email and productivity suite.', 'Email Services', 'microsoft.com/microsoft-365', 'per-user',
  ARRAY['Outlook email', 'Office apps', 'SharePoint', 'Teams'],
  ARRAY['Dynamics 365', 'Power BI', 'Azure'],
  ARRAY['Early-stage', 'Growing', 'Enterprise'], ARRAY['1-10', '11-50', '51-200', '201-500'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'Professional Services'],
  4.7
);

-- Legal Services
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('LegalZoom', 'Online legal services platform.', 'Legal Services', 'legalzoom.com', 'per-service',
  ARRAY['Business formation', 'Registered agent', 'Trademark registration', 'Legal documents'],
  ARRAY['QuickBooks', 'Business licenses'],
  ARRAY['Early-stage'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Professional Services', 'Technology'],
  4.3
),
('Stripe Atlas', 'All-in-one platform for incorporating in the US.', 'Legal Services', 'stripe.com/atlas', 'one-time',
  ARRAY['Delaware C Corp formation', 'EIN registration', 'Bank account setup', 'Stripe account'],
  ARRAY['Stripe Payments', 'Banking services'],
  ARRAY['Early-stage'], ARRAY['1-10'], ARRAY['B2B', 'B2C', 'SaaS'], ARRAY['Technology', 'E-commerce', 'FinTech'],
  4.6
);

-- Financial Services
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Brex', 'Financial services platform for startups.', 'Financial Services', 'brex.com', 'freemium',
  ARRAY['Business bank account', 'Credit card', 'Expense management', 'Bill pay'],
  ARRAY['QuickBooks', 'Xero', 'NetSuite'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.7
),
('Mercury', 'Digital banking for startups.', 'Financial Services', 'mercury.com', 'free',
  ARRAY['Business checking', 'Savings accounts', 'Team cards', 'API access'],
  ARRAY['QuickBooks', 'Xero', 'Wise'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.8
);

-- Marketing
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Mailchimp', 'Email marketing and automation platform.', 'Marketing', 'mailchimp.com', 'freemium',
  ARRAY['Email campaigns', 'Marketing automation', 'Landing pages', 'CRM'],
  ARRAY['Shopify', 'WooCommerce', 'Salesforce'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'B2C'], ARRAY['E-commerce', 'Technology'],
  4.5
),
('Semrush', 'SEO and digital marketing platform.', 'Marketing', 'semrush.com', 'subscription',
  ARRAY['Keyword research', 'Competitor analysis', 'Site audit', 'Content marketing'],
  ARRAY['Google Analytics', 'Google Search Console'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'E-commerce'],
  4.7
);

-- Development
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Vercel', 'Frontend deployment and hosting platform.', 'Development', 'vercel.com', 'freemium',
  ARRAY['Frontend deployment', 'Serverless functions', 'Edge network', 'Analytics'],
  ARRAY['GitHub', 'GitLab', 'Bitbucket'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.8
),
('DigitalOcean', 'Cloud infrastructure provider.', 'Development', 'digitalocean.com', 'usage-based',
  ARRAY['Cloud servers', 'Managed databases', 'Kubernetes', 'Object storage'],
  ARRAY['GitHub', 'Docker', 'Kubernetes'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.6
);

-- Continue with more categories...
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
-- Productivity & Collaboration
('Notion', 'All-in-one workspace for notes and collaboration.', 'Productivity', 'notion.so', 'freemium',
  ARRAY['Notes', 'Docs', 'Wikis', 'Project management'],
  ARRAY['Slack', 'Google Drive', 'GitHub'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.7
),
('Slack', 'Team communication platform.', 'Communication', 'slack.com', 'per-user',
  ARRAY['Team chat', 'File sharing', 'Integrations', 'Video calls'],
  ARRAY['Google Workspace', 'GitHub', 'Jira'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.8
);

-- Add more tools for each category...
-- Continue with the rest of the tools from your CSV data