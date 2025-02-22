-- Insert more tool categories

-- Intellectual Property Protection
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('LegalPatent', 'Patent search and filing platform.', 'IP Protection', 'legalpatent.com', 'per-service',
  ARRAY['Patent search', 'Patent filing', 'Trademark search', 'IP portfolio management'],
  ARRAY['DocuSign', 'Legal document management'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'Technology'], ARRAY['Technology', 'BioTech', 'Hardware'],
  4.5
),
('Corsearch', 'Trademark search and protection platform.', 'IP Protection', 'corsearch.com', 'subscription',
  ARRAY['Trademark search', 'Brand protection', 'Domain monitoring', 'IP analytics'],
  ARRAY['Legal management systems', 'Brand monitoring tools'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B'], ARRAY['Technology', 'Consumer Products'],
  4.4
);

-- Product Roadmap
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('ProductBoard', 'Product management and roadmap platform.', 'Product Roadmap', 'productboard.com', 'per-user',
  ARRAY['Feature prioritization', 'Customer feedback', 'Roadmap planning', 'Team collaboration'],
  ARRAY['Jira', 'Zendesk', 'Intercom', 'Slack'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.7
),
('Aha!', 'Product and project management software.', 'Product Roadmap', 'aha.io', 'per-user',
  ARRAY['Strategic planning', 'Roadmapping', 'Release management', 'Idea management'],
  ARRAY['Jira', 'GitHub', 'Slack', 'Salesforce'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.6
);

-- Testing
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('TestRail', 'Test case management platform.', 'Testing', 'testrail.com', 'per-user',
  ARRAY['Test case management', 'Test planning', 'Defect tracking', 'Reporting'],
  ARRAY['Jira', 'GitHub', 'Jenkins', 'Slack'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.5
),
('BrowserStack', 'Cross-browser testing platform.', 'Testing', 'browserstack.com', 'subscription',
  ARRAY['Browser testing', 'Mobile testing', 'Automated testing', 'Screenshot testing'],
  ARRAY['GitHub', 'Jenkins', 'Travis CI', 'CircleCI'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.6
);

-- Public Relations
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Meltwater', 'Media monitoring and PR analytics platform.', 'Public Relations', 'meltwater.com', 'subscription',
  ARRAY['Media monitoring', 'Social listening', 'PR analytics', 'Influencer management'],
  ARRAY['Social media platforms', 'CRM systems', 'Analytics tools'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B'], ARRAY['Technology', 'Consumer Products'],
  4.4
),
('Cision', 'PR and earned media software.', 'Public Relations', 'cision.com', 'subscription',
  ARRAY['Media database', 'Press release distribution', 'Media monitoring', 'Analytics'],
  ARRAY['Social media platforms', 'Analytics tools', 'CRM systems'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B'], ARRAY['Technology', 'Professional Services'],
  4.3
);

-- Landing Page Builder
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Unbounce', 'Landing page and conversion optimization platform.', 'Landing Page Builder', 'unbounce.com', 'subscription',
  ARRAY['Landing page builder', 'A/B testing', 'Pop-ups', 'Sticky bars'],
  ARRAY['WordPress', 'Mailchimp', 'Zapier', 'Google Analytics'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'Marketing'],
  4.6
),
('Instapage', 'Landing page platform for marketing teams.', 'Landing Page Builder', 'instapage.com', 'subscription',
  ARRAY['Page builder', 'Personalization', 'Analytics', 'Collaboration'],
  ARRAY['Marketing tools', 'Analytics platforms', 'CRM systems'],
  ARRAY['Growing', 'Enterprise'], ARRAY['11-50', '51-200'], ARRAY['B2B'], ARRAY['Technology', 'Marketing'],
  4.5
);

-- Email Marketing
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('SendGrid', 'Email delivery and marketing platform.', 'Email Marketing', 'sendgrid.com', 'usage-based',
  ARRAY['Email API', 'Marketing campaigns', 'Email templates', 'Analytics'],
  ARRAY['CRM systems', 'Marketing platforms', 'E-commerce platforms'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'E-commerce'],
  4.7
),
('Campaign Monitor', 'Email marketing software.', 'Email Marketing', 'campaignmonitor.com', 'subscription',
  ARRAY['Email campaigns', 'Automation', 'Personalization', 'Analytics'],
  ARRAY['CRM systems', 'E-commerce platforms', 'CMS systems'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Marketing', 'E-commerce'],
  4.5
);

-- Competitor Analysis
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Crayon', 'Market and competitive intelligence platform.', 'Competitor Analysis', 'crayon.co', 'subscription',
  ARRAY['Competitor tracking', 'Market analysis', 'Intel management', 'Battlecards'],
  ARRAY['Salesforce', 'Slack', 'Chrome extension'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.6
),
('Kompyte', 'Competitive intelligence automation platform.', 'Competitor Analysis', 'kompyte.com', 'subscription',
  ARRAY['Competitor monitoring', 'Market intelligence', 'Sales enablement', 'Alerts'],
  ARRAY['Salesforce', 'HubSpot', 'Slack'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.4
);

-- Task Management
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('ClickUp', 'All-in-one productivity platform.', 'Task Management', 'clickup.com', 'freemium',
  ARRAY['Task management', 'Project views', 'Docs', 'Time tracking'],
  ARRAY['GitHub', 'Slack', 'Google Calendar', 'Zoom'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Professional Services'],
  4.7
),
('Todoist', 'Task management and organization tool.', 'Task Management', 'todoist.com', 'freemium',
  ARRAY['Task organization', 'Project management', 'Team collaboration', 'Integrations'],
  ARRAY['Google Calendar', 'Slack', 'Gmail', 'Outlook'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'Professional Services'],
  4.8
);

-- CI/CD
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('CircleCI', 'Continuous integration and delivery platform.', 'CI/CD', 'circleci.com', 'usage-based',
  ARRAY['Automated testing', 'Deployment automation', 'Docker support', 'Workflow orchestration'],
  ARRAY['GitHub', 'Bitbucket', 'Slack', 'Jira'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.7
),
('Jenkins', 'Open-source automation server.', 'CI/CD', 'jenkins.io', 'free',
  ARRAY['Build automation', 'Deployment automation', 'Plugin ecosystem', 'Pipeline as code'],
  ARRAY['Git', 'Docker', 'Kubernetes', 'AWS'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'SaaS'],
  4.5
);

-- Design
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Figma', 'Collaborative interface design tool.', 'Design', 'figma.com', 'freemium',
  ARRAY['Design tools', 'Prototyping', 'Design systems', 'Collaboration'],
  ARRAY['Slack', 'Jira', 'Notion', 'Zeplin'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Design'],
  4.9
),
('Sketch', 'Professional digital design for Mac.', 'Design', 'sketch.com', 'subscription',
  ARRAY['Vector editing', 'Prototyping', 'Design systems', 'Collaboration'],
  ARRAY['InVision', 'Zeplin', 'Abstract', 'Principle'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Design'],
  4.7
);

-- Payment Processing
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Square', 'Payment processing and point of sale solutions.', 'Payment Processing', 'squareup.com', 'per-transaction',
  ARRAY['Payment processing', 'POS system', 'E-commerce', 'Business analytics'],
  ARRAY['QuickBooks', 'Xero', 'WooCommerce', 'Shopify'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Retail', 'E-commerce'],
  4.7
),
('PayPal', 'Online payment solutions.', 'Payment Processing', 'paypal.com', 'per-transaction',
  ARRAY['Payment processing', 'Invoicing', 'International payments', 'Fraud protection'],
  ARRAY['Shopping carts', 'E-commerce platforms', 'Accounting software'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['E-commerce', 'Retail'],
  4.6
);

-- Bookkeeping
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Wave', 'Free accounting software for small businesses.', 'Bookkeeping', 'waveapps.com', 'free',
  ARRAY['Accounting', 'Invoicing', 'Receipt scanning', 'Payment processing'],
  ARRAY['PayPal', 'Etsy', 'Shoeboxed', 'Banking integration'],
  ARRAY['Early-stage'], ARRAY['1-10'], ARRAY['B2B', 'B2C'], ARRAY['Professional Services', 'Small Business'],
  4.4
),
('Bench', 'Bookkeeping service with dedicated bookkeepers.', 'Bookkeeping', 'bench.co', 'subscription',
  ARRAY['Dedicated bookkeeper', 'Financial reporting', 'Tax prep', 'Catch-up bookkeeping'],
  ARRAY['QuickBooks', 'Stripe', 'Square', 'Shopify'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B'], ARRAY['Professional Services', 'E-commerce'],
  4.6
);

-- Beta Testing
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('TestFlight', 'Beta testing platform for iOS apps.', 'Beta Testing', 'developer.apple.com/testflight', 'free',
  ARRAY['iOS beta distribution', 'Tester management', 'Feedback collection', 'Analytics'],
  ARRAY['App Store Connect', 'Xcode', 'Bug tracking tools'],
  ARRAY['Early-stage', 'Growing'], ARRAY['1-10', '11-50'], ARRAY['B2B', 'B2C'], ARRAY['Technology', 'Mobile'],
  4.8
),
('UserTesting', 'User experience testing platform.', 'Beta Testing', 'usertesting.com', 'subscription',
  ARRAY['User testing', 'Video feedback', 'Prototype testing', 'Participant sourcing'],
  ARRAY['Jira', 'Slack', 'Trello', 'Adobe XD'],
  ARRAY['Early-stage', 'Growing'], ARRAY['11-50', '51-200'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'E-commerce'],
  4.7
);

-- Data Analytics
INSERT INTO tools (name, description, category, url, pricing_model, features, integrations, company_stages, company_sizes, business_models, industries, rating) VALUES
('Looker', 'Business intelligence and big data analytics platform.', 'Data Analytics', 'looker.com', 'subscription',
  ARRAY['Data modeling', 'Visualization', 'Embedded analytics', 'Data governance'],
  ARRAY['Google BigQuery', 'Snowflake', 'Amazon Redshift', 'PostgreSQL'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Enterprise'],
  4.7
),
('Mode', 'Collaborative data science and business analytics platform.', 'Data Analytics', 'mode.com', 'subscription',
  ARRAY['SQL editor', 'Python notebooks', 'Visualization', 'Reporting'],
  ARRAY['Snowflake', 'Redshift', 'BigQuery', 'PostgreSQL'],
  ARRAY['Growing', 'Enterprise'], ARRAY['51-200', '201-500'], ARRAY['B2B', 'SaaS'], ARRAY['Technology', 'Enterprise'],
  4.6
);