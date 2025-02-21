-- Add new fields to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS mission_statement text,
ADD COLUMN IF NOT EXISTS vision_statement text,
ADD COLUMN IF NOT EXISTS core_values text[],
ADD COLUMN IF NOT EXISTS company_culture text,
ADD COLUMN IF NOT EXISTS remote_policy text CHECK (remote_policy IN ('remote', 'hybrid', 'office', 'flexible')),

-- Market Information
ADD COLUMN IF NOT EXISTS target_market_details jsonb DEFAULT '{
  "segments": [],
  "demographics": {},
  "psychographics": {},
  "pain_points": [],
  "needs": []
}',
ADD COLUMN IF NOT EXISTS competitive_analysis jsonb DEFAULT '{
  "direct_competitors": [],
  "indirect_competitors": [],
  "competitive_advantages": [],
  "market_position": null
}',
ADD COLUMN IF NOT EXISTS market_size jsonb DEFAULT '{
  "tam": null,
  "sam": null,
  "som": null,
  "growth_rate": null
}',
ADD COLUMN IF NOT EXISTS go_to_market jsonb DEFAULT '{
  "strategy": null,
  "channels": [],
  "partnerships": [],
  "timeline": null
}',

-- Financial Information
ADD COLUMN IF NOT EXISTS funding_status jsonb DEFAULT '{
  "current_stage": null,
  "total_raised": null,
  "last_round": null,
  "valuation": null,
  "investors": []
}',
ADD COLUMN IF NOT EXISTS revenue_model jsonb DEFAULT '{
  "primary_model": null,
  "revenue_streams": [],
  "pricing_strategy": null,
  "unit_economics": {
    "cac": null,
    "ltv": null,
    "gross_margin": null
  }
}',
ADD COLUMN IF NOT EXISTS financial_metrics jsonb DEFAULT '{
  "mrr": null,
  "arr": null,
  "burn_rate": null,
  "runway_months": null,
  "growth_rate": null
}',
ADD COLUMN IF NOT EXISTS investment_goals jsonb DEFAULT '{
  "amount_seeking": null,
  "use_of_funds": [],
  "target_raise_date": null,
  "milestones": []
}',

-- Team Information
ADD COLUMN IF NOT EXISTS team_structure jsonb DEFAULT '{
  "departments": [],
  "reporting_lines": [],
  "key_roles": []
}',
ADD COLUMN IF NOT EXISTS hiring_plan jsonb DEFAULT '{
  "current_openings": [],
  "future_hires": [],
  "hiring_timeline": null,
  "recruitment_strategy": null
}',
ADD COLUMN IF NOT EXISTS team_composition jsonb DEFAULT '{
  "full_time": 0,
  "part_time": 0,
  "contractors": 0,
  "departments": {},
  "skills_matrix": []
}',

-- Product/Service Information
ADD COLUMN IF NOT EXISTS product_roadmap jsonb DEFAULT '{
  "current_stage": null,
  "key_features": [],
  "upcoming_releases": [],
  "long_term_vision": null
}',
ADD COLUMN IF NOT EXISTS tech_stack jsonb DEFAULT '{
  "frontend": [],
  "backend": [],
  "infrastructure": [],
  "tools": []
}',
ADD COLUMN IF NOT EXISTS intellectual_property jsonb DEFAULT '{
  "patents": [],
  "trademarks": [],
  "trade_secrets": [],
  "licenses": []
}';

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_companies_stage ON companies((funding_status->>'current_stage'));
CREATE INDEX IF NOT EXISTS idx_companies_market_size ON companies USING gin(market_size);
CREATE INDEX IF NOT EXISTS idx_companies_tech_stack ON companies USING gin(tech_stack);