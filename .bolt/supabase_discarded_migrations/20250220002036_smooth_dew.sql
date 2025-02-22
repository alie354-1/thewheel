-- Insert additional steps for each stage
DO $$ 
DECLARE
  stage_id uuid;
BEGIN
  -- Legal & Structure stage
  SELECT id INTO stage_id FROM company_stages WHERE name = 'Legal & Structure';
  IF FOUND THEN
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
      stage_id,
      'Business Structure',
      'Choose and set up your legal business structure',
      1,
      true,
      '2-3 days',
      '[
        {
          "name": "Business Structure Guide",
          "url": "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
          "type": "external"
        }
      ]'::jsonb,
      '[
        {
          "title": "Business Structure Comparison",
          "url": "https://www.irs.gov/businesses/small-businesses-self-employed/business-structures",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Research different business structures",
        "Consult with legal advisor",
        "Choose appropriate structure",
        "File formation documents",
        "Get EIN from IRS"
      ]'::jsonb,
      ARRAY[
        'Consider future funding needs when choosing structure',
        'Understand tax implications',
        'Plan for scalability',
        'Document all decisions'
      ]
    ),
    (
      stage_id,
      'Licenses & Permits',
      'Obtain necessary business licenses and permits',
      2,
      true,
      '3-5 days',
      '[
        {
          "name": "License Finder",
          "url": "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
          "type": "external"
        }
      ]'::jsonb,
      '[
        {
          "title": "Business License Guide",
          "url": "https://www.sba.gov/business-guide/launch-your-business/get-federal-state-licenses",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Research required licenses",
        "Apply for federal licenses",
        "Apply for state licenses",
        "Apply for local permits",
        "Set up renewal reminders"
      ]'::jsonb,
      ARRAY[
        'Start early as some permits take time',
        'Keep digital copies of all licenses',
        'Track renewal dates',
        'Consider hiring a compliance expert'
      ]
    );
  END IF;

  -- Financial Setup stage
  SELECT id INTO stage_id FROM company_stages WHERE name = 'Financial Setup';
  IF FOUND THEN
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
      stage_id,
      'Banking Setup',
      'Set up business banking and financial accounts',
      1,
      true,
      '2-3 days',
      '[
        {
          "name": "Bank Account Comparison",
          "url": "https://www.bankrate.com/banking/best-business-checking-accounts/",
          "type": "external"
        }
      ]'::jsonb,
      '[
        {
          "title": "Business Banking Guide",
          "url": "https://www.sba.gov/business-guide/launch-your-business/open-business-bank-account",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Research business bank accounts",
        "Gather required documents",
        "Open business checking account",
        "Set up business savings account",
        "Order business checks/cards"
      ]'::jsonb,
      ARRAY[
        'Keep personal and business finances separate',
        'Compare fees and features',
        'Consider online banking options',
        'Set up overdraft protection'
      ]
    ),
    (
      stage_id,
      'Accounting System',
      'Set up accounting and bookkeeping systems',
      2,
      true,
      '3-4 days',
      '[
        {
          "name": "QuickBooks Online",
          "url": "https://quickbooks.intuit.com/",
          "type": "external"
        }
      ]'::jsonb,
      '[
        {
          "title": "Accounting Basics Guide",
          "url": "https://www.sba.gov/business-guide/manage-your-business/manage-your-finances",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Choose accounting software",
        "Set up chart of accounts",
        "Configure tax settings",
        "Set up payroll system",
        "Create financial reports"
      ]'::jsonb,
      ARRAY[
        'Start with good habits early',
        'Consider hiring a bookkeeper',
        'Keep all receipts',
        'Regular reconciliation is key'
      ]
    );
  END IF;

  -- Brand & Identity stage
  SELECT id INTO stage_id FROM company_stages WHERE name = 'Brand & Identity';
  IF FOUND THEN
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
      stage_id,
      'Brand Strategy',
      'Develop your brand strategy and identity',
      1,
      true,
      '4-5 days',
      '[
        {
          "name": "Brand Strategy Template",
          "url": "/resources/brand-strategy-template",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "Brand Building Guide",
          "url": "https://www.entrepreneur.com/starting-a-business/building-a-brand",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Define brand values",
        "Create brand story",
        "Develop brand voice",
        "Design visual identity",
        "Create style guide"
      ]'::jsonb,
      ARRAY[
        'Stay consistent across channels',
        'Think long-term',
        'Research competitors',
        'Get customer feedback'
      ]
    ),
    (
      stage_id,
      'Online Presence',
      'Establish your online presence and website',
      2,
      true,
      '5-7 days',
      '[
        {
          "name": "Website Builder",
          "url": "https://www.wix.com/",
          "type": "external"
        }
      ]'::jsonb,
      '[
        {
          "title": "Website Planning Guide",
          "url": "https://www.shopify.com/blog/how-to-build-a-website",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Register domain name",
        "Choose hosting provider",
        "Design website",
        "Set up business email",
        "Create social media accounts"
      ]'::jsonb,
      ARRAY[
        'Mobile-first design',
        'Focus on user experience',
        'Optimize for search engines',
        'Regular content updates'
      ]
    );
  END IF;

  -- Product Development stage
  SELECT id INTO stage_id FROM company_stages WHERE name = 'Product Development';
  IF FOUND THEN
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
      stage_id,
      'MVP Planning',
      'Plan and define your minimum viable product',
      1,
      true,
      '5-7 days',
      '[
        {
          "name": "Product Roadmap Tool",
          "url": "/resources/product-roadmap",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "MVP Development Guide",
          "url": "https://www.productplan.com/learn/minimum-viable-product/",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Define core features",
        "Create user stories",
        "Set success metrics",
        "Plan development phases",
        "Create timeline"
      ]'::jsonb,
      ARRAY[
        'Focus on core value proposition',
        'Get early user feedback',
        'Keep it minimal',
        'Plan for iterations'
      ]
    ),
    (
      stage_id,
      'Development Process',
      'Set up development workflow and processes',
      2,
      true,
      '3-4 days',
      '[
        {
          "name": "Project Management Tool",
          "url": "https://www.atlassian.com/software/jira",
          "type": "external"
        }
      ]'::jsonb,
      '[
        {
          "title": "Agile Development Guide",
          "url": "https://www.atlassian.com/agile",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Choose development methodology",
        "Set up version control",
        "Configure CI/CD pipeline",
        "Define coding standards",
        "Plan testing strategy"
      ]'::jsonb,
      ARRAY[
        'Use agile methodologies',
        'Automate where possible',
        'Document everything',
        'Regular code reviews'
      ]
    );
  END IF;

  -- Market Entry stage
  SELECT id INTO stage_id FROM company_stages WHERE name = 'Market Entry';
  IF FOUND THEN
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
      stage_id,
      'Launch Strategy',
      'Develop and execute your market entry strategy',
      1,
      true,
      '5-7 days',
      '[
        {
          "name": "Launch Checklist",
          "url": "/resources/launch-checklist",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "Product Launch Guide",
          "url": "https://www.productplan.com/learn/product-launch-checklist/",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Define launch goals",
        "Create marketing plan",
        "Prepare sales strategy",
        "Set up analytics",
        "Plan customer support"
      ]'::jsonb,
      ARRAY[
        'Start with soft launch',
        'Monitor metrics closely',
        'Have backup plans',
        'Focus on customer experience'
      ]
    ),
    (
      stage_id,
      'Marketing Setup',
      'Set up marketing channels and campaigns',
      2,
      true,
      '4-6 days',
      '[
        {
          "name": "Marketing Tools",
          "url": "/resources/marketing-tools",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "Digital Marketing Guide",
          "url": "https://www.hubspot.com/marketing-statistics",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Set up marketing channels",
        "Create content calendar",
        "Configure tracking",
        "Plan initial campaigns",
        "Set up email marketing"
      ]'::jsonb,
      ARRAY[
        'Focus on key channels',
        'Test and measure results',
        'Create quality content',
        'Build email list early'
      ]
    );
  END IF;

  -- Growth & Scale stage
  SELECT id INTO stage_id FROM company_stages WHERE name = 'Growth & Scale';
  IF FOUND THEN
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
      stage_id,
      'Growth Strategy',
      'Develop and implement growth strategies',
      1,
      true,
      '5-7 days',
      '[
        {
          "name": "Growth Planning Tool",
          "url": "/resources/growth-planning",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "Startup Growth Guide",
          "url": "https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Define growth metrics",
        "Identify growth channels",
        "Create scaling plan",
        "Set up partnerships",
        "Plan resource needs"
      ]'::jsonb,
      ARRAY[
        'Focus on sustainable growth',
        'Monitor unit economics',
        'Build scalable processes',
        'Invest in automation'
      ]
    ),
    (
      stage_id,
      'Team Expansion',
      'Plan and execute team growth',
      2,
      true,
      '4-6 days',
      '[
        {
          "name": "HR Planning Tool",
          "url": "/resources/hr-planning",
          "type": "internal"
        }
      ]'::jsonb,
      '[
        {
          "title": "Team Building Guide",
          "url": "https://www.notion.so/blog/startup-hiring-guide",
          "type": "article"
        }
      ]'::jsonb,
      '[
        "Create hiring plan",
        "Define roles needed",
        "Set up HR processes",
        "Plan onboarding",
        "Define culture values"
      ]'::jsonb,
      ARRAY[
        'Hire ahead of growth',
        'Focus on culture fit',
        'Document processes',
        'Invest in training'
      ]
    );
  END IF;
END $$;