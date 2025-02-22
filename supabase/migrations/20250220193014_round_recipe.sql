-- Drop any existing check constraints
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_remote_policy_check;

-- Add or update remote_policy constraint with proper default
ALTER TABLE companies
ALTER COLUMN remote_policy SET DEFAULT 'flexible',
ADD CONSTRAINT companies_remote_policy_check 
CHECK (remote_policy IN ('remote', 'hybrid', 'office', 'flexible'));

-- Ensure industries has proper default
ALTER TABLE companies
ALTER COLUMN industries SET DEFAULT '{}';

-- Set defaults for required jsonb columns to prevent null values
ALTER TABLE companies
ALTER COLUMN target_market_details SET DEFAULT '{
  "segments": [],
  "demographics": {},
  "psychographics": {},
  "pain_points": [],
  "needs": []
}'::jsonb,
ALTER COLUMN competitive_analysis SET DEFAULT '{
  "direct_competitors": [],
  "indirect_competitors": [],
  "competitive_advantages": [],
  "market_position": null
}'::jsonb,
ALTER COLUMN market_size SET DEFAULT '{
  "tam": null,
  "sam": null,
  "som": null,
  "growth_rate": null
}'::jsonb,
ALTER COLUMN go_to_market SET DEFAULT '{
  "strategy": null,
  "channels": [],
  "partnerships": [],
  "timeline": null
}'::jsonb,
ALTER COLUMN funding_status SET DEFAULT '{
  "current_stage": null,
  "total_raised": null,
  "last_round": null,
  "valuation": null,
  "investors": []
}'::jsonb,
ALTER COLUMN revenue_model SET DEFAULT '{
  "primary_model": null,
  "revenue_streams": [],
  "pricing_strategy": null,
  "unit_economics": {
    "cac": null,
    "ltv": null,
    "gross_margin": null
  }
}'::jsonb,
ALTER COLUMN financial_metrics SET DEFAULT '{
  "mrr": null,
  "arr": null,
  "burn_rate": null,
  "runway_months": null,
  "growth_rate": null
}'::jsonb,
ALTER COLUMN investment_goals SET DEFAULT '{
  "amount_seeking": null,
  "use_of_funds": [],
  "target_raise_date": null,
  "milestones": []
}'::jsonb,
ALTER COLUMN team_structure SET DEFAULT '{
  "departments": [],
  "reporting_lines": [],
  "key_roles": []
}'::jsonb,
ALTER COLUMN hiring_plan SET DEFAULT '{
  "current_openings": [],
  "future_hires": [],
  "hiring_timeline": null,
  "recruitment_strategy": null
}'::jsonb,
ALTER COLUMN team_composition SET DEFAULT '{
  "full_time": 0,
  "part_time": 0,
  "contractors": 0,
  "departments": {},
  "skills_matrix": []
}'::jsonb,
ALTER COLUMN product_roadmap SET DEFAULT '{
  "current_stage": null,
  "key_features": [],
  "upcoming_releases": [],
  "long_term_vision": null
}'::jsonb,
ALTER COLUMN tech_stack SET DEFAULT '{
  "frontend": [],
  "backend": [],
  "infrastructure": [],
  "tools": []
}'::jsonb,
ALTER COLUMN intellectual_property SET DEFAULT '{
  "patents": [],
  "trademarks": [],
  "trade_secrets": [],
  "licenses": []
}'::jsonb;

-- Update any existing null values to their defaults
UPDATE companies
SET 
  remote_policy = COALESCE(remote_policy, 'flexible'),
  industries = COALESCE(industries, '{}'),
  target_market_details = COALESCE(target_market_details, '{
    "segments": [],
    "demographics": {},
    "psychographics": {},
    "pain_points": [],
    "needs": []
  }'::jsonb),
  competitive_analysis = COALESCE(competitive_analysis, '{
    "direct_competitors": [],
    "indirect_competitors": [],
    "competitive_advantages": [],
    "market_position": null
  }'::jsonb),
  market_size = COALESCE(market_size, '{
    "tam": null,
    "sam": null,
    "som": null,
    "growth_rate": null
  }'::jsonb),
  go_to_market = COALESCE(go_to_market, '{
    "strategy": null,
    "channels": [],
    "partnerships": [],
    "timeline": null
  }'::jsonb),
  funding_status = COALESCE(funding_status, '{
    "current_stage": null,
    "total_raised": null,
    "last_round": null,
    "valuation": null,
    "investors": []
  }'::jsonb),
  revenue_model = COALESCE(revenue_model, '{
    "primary_model": null,
    "revenue_streams": [],
    "pricing_strategy": null,
    "unit_economics": {
      "cac": null,
      "ltv": null,
      "gross_margin": null
    }
  }'::jsonb),
  financial_metrics = COALESCE(financial_metrics, '{
    "mrr": null,
    "arr": null,
    "burn_rate": null,
    "runway_months": null,
    "growth_rate": null
  }'::jsonb),
  investment_goals = COALESCE(investment_goals, '{
    "amount_seeking": null,
    "use_of_funds": [],
    "target_raise_date": null,
    "milestones": []
  }'::jsonb),
  team_structure = COALESCE(team_structure, '{
    "departments": [],
    "reporting_lines": [],
    "key_roles": []
  }'::jsonb),
  hiring_plan = COALESCE(hiring_plan, '{
    "current_openings": [],
    "future_hires": [],
    "hiring_timeline": null,
    "recruitment_strategy": null
  }'::jsonb),
  team_composition = COALESCE(team_composition, '{
    "full_time": 0,
    "part_time": 0,
    "contractors": 0,
    "departments": {},
    "skills_matrix": []
  }'::jsonb),
  product_roadmap = COALESCE(product_roadmap, '{
    "current_stage": null,
    "key_features": [],
    "upcoming_releases": [],
    "long_term_vision": null
  }'::jsonb),
  tech_stack = COALESCE(tech_stack, '{
    "frontend": [],
    "backend": [],
    "infrastructure": [],
    "tools": []
  }'::jsonb),
  intellectual_property = COALESCE(intellectual_property, '{
    "patents": [],
    "trademarks": [],
    "trade_secrets": [],
    "licenses": []
  }'::jsonb);