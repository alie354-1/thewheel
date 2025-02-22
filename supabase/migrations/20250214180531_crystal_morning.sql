/*
  # Enhanced Company Profile Schema

  1. New Fields
    - Added detailed financial metrics
    - Added team composition tracking
    - Added growth metrics
    - Added market analysis fields
    - Added competitive analysis
    - Added risk assessment
    - Added milestone tracking
    - Added funding history
    - Added product/service metrics
    - Added customer metrics

  2. Changes
    - Enhanced existing fields with more detailed options
    - Added validation constraints
    - Added computed metrics

  3. Security
    - Maintained existing RLS policies
    - Added new computed fields
*/

-- Add new columns to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_type text CHECK (company_type IN ('product', 'service', 'marketplace', 'hardware', 'saas', 'enterprise', 'consumer', 'b2b', 'b2c', 'b2b2c')),
ADD COLUMN IF NOT EXISTS development_stage text CHECK (development_stage IN ('concept', 'prototype', 'mvp', 'beta', 'launched', 'growth', 'scale')),
ADD COLUMN IF NOT EXISTS business_category text[],
ADD COLUMN IF NOT EXISTS target_industries text[],
ADD COLUMN IF NOT EXISTS geographical_focus text[],

-- Financial Metrics
ADD COLUMN IF NOT EXISTS financial_metrics jsonb DEFAULT '{
  "revenue": {
    "current_mrr": null,
    "target_mrr": null,
    "growth_rate": null,
    "burn_rate": null,
    "runway_months": null
  },
  "unit_economics": {
    "cac": null,
    "ltv": null,
    "gross_margin": null,
    "payback_period": null
  },
  "funding": {
    "total_raised": null,
    "last_round": null,
    "valuation": null
  }
}',

-- Team Composition
ADD COLUMN IF NOT EXISTS team_composition jsonb DEFAULT '{
  "total_employees": 0,
  "departments": {
    "engineering": 0,
    "product": 0,
    "sales": 0,
    "marketing": 0,
    "customer_success": 0,
    "operations": 0
  },
  "hiring_plan": [],
  "key_positions_open": []
}',

-- Growth Metrics
ADD COLUMN IF NOT EXISTS growth_metrics jsonb DEFAULT '{
  "user_growth": {
    "total_users": 0,
    "active_users": 0,
    "growth_rate": null
  },
  "engagement_metrics": {
    "dau": 0,
    "mau": 0,
    "retention_rate": null
  },
  "acquisition_channels": []
}',

-- Market Analysis
ADD COLUMN IF NOT EXISTS market_analysis jsonb DEFAULT '{
  "total_addressable_market": null,
  "serviceable_addressable_market": null,
  "serviceable_obtainable_market": null,
  "market_growth_rate": null,
  "market_trends": [],
  "regulatory_factors": []
}',

-- Competitive Analysis
ADD COLUMN IF NOT EXISTS competitive_analysis jsonb DEFAULT '{
  "direct_competitors": [],
  "indirect_competitors": [],
  "competitive_advantages": [],
  "market_positioning": null,
  "barriers_to_entry": []
}',

-- Risk Assessment
ADD COLUMN IF NOT EXISTS risk_assessment jsonb DEFAULT '{
  "business_risks": [],
  "technical_risks": [],
  "market_risks": [],
  "regulatory_risks": [],
  "mitigation_strategies": []
}',

-- Milestones
ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '{
  "completed": [],
  "upcoming": [],
  "long_term": []
}',

-- Funding History
ADD COLUMN IF NOT EXISTS funding_history jsonb DEFAULT '[]',

-- Product/Service Metrics
ADD COLUMN IF NOT EXISTS product_metrics jsonb DEFAULT '{
  "features": [],
  "roadmap": [],
  "technical_stack": [],
  "deployment_metrics": {
    "uptime": null,
    "response_time": null,
    "error_rate": null
  },
  "quality_metrics": {
    "bug_count": null,
    "test_coverage": null,
    "user_satisfaction": null
  }
}',

-- Customer Metrics
ADD COLUMN IF NOT EXISTS customer_metrics jsonb DEFAULT '{
  "segments": [],
  "satisfaction_score": null,
  "net_promoter_score": null,
  "churn_rate": null,
  "feedback_summary": [],
  "support_metrics": {
    "ticket_volume": null,
    "resolution_time": null,
    "satisfaction_rate": null
  }
}',

-- Intellectual Property
ADD COLUMN IF NOT EXISTS intellectual_property jsonb DEFAULT '{
  "patents": [],
  "trademarks": [],
  "copyrights": [],
  "trade_secrets": []
}',

-- Partnerships and Integrations
ADD COLUMN IF NOT EXISTS partnerships jsonb DEFAULT '{
  "strategic_partners": [],
  "technology_partners": [],
  "channel_partners": [],
  "integration_partners": []
}',

-- Compliance and Certifications
ADD COLUMN IF NOT EXISTS compliance_certifications jsonb DEFAULT '{
  "current": [],
  "pending": [],
  "required": []
}';

-- Create function to calculate company maturity score
CREATE OR REPLACE FUNCTION calculate_company_maturity_score(company_data companies)
RETURNS float
LANGUAGE plpgsql
AS $$
DECLARE
  score float := 0;
  max_score constant float := 100;
  weights jsonb := '{
    "team": 0.2,
    "product": 0.2,
    "market": 0.15,
    "financial": 0.15,
    "growth": 0.15,
    "risk": 0.15
  }';
BEGIN
  -- Team score
  IF company_data.team_composition->>'total_employees' IS NOT NULL THEN
    score := score + (weights->>'team')::float * 
      LEAST(((company_data.team_composition->>'total_employees')::int / 50.0), 1) * max_score;
  END IF;

  -- Product score
  IF company_data.development_stage IS NOT NULL THEN
    score := score + (weights->>'product')::float * 
      CASE company_data.development_stage
        WHEN 'concept' THEN 0.2
        WHEN 'prototype' THEN 0.4
        WHEN 'mvp' THEN 0.6
        WHEN 'beta' THEN 0.8
        WHEN 'launched' THEN 0.9
        WHEN 'growth' THEN 1.0
        WHEN 'scale' THEN 1.0
        ELSE 0
      END * max_score;
  END IF;

  -- Market score
  IF company_data.market_analysis->>'total_addressable_market' IS NOT NULL THEN
    score := score + (weights->>'market')::float * max_score;
  END IF;

  -- Financial score
  IF company_data.financial_metrics->'revenue'->>'current_mrr' IS NOT NULL THEN
    score := score + (weights->>'financial')::float * max_score;
  END IF;

  -- Growth score
  IF company_data.growth_metrics->'user_growth'->>'growth_rate' IS NOT NULL THEN
    score := score + (weights->>'growth')::float * max_score;
  END IF;

  -- Risk score (inverse - fewer risks is better)
  IF jsonb_array_length(company_data.risk_assessment->'business_risks') > 0 THEN
    score := score + (weights->>'risk')::float * 
      (1 - LEAST(jsonb_array_length(company_data.risk_assessment->'business_risks')::float / 10, 1)) * max_score;
  END IF;

  RETURN ROUND(score::numeric, 2);
END;
$$;