-- Add new columns to companies table for enhanced analysis

-- Performance Metrics
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS performance_metrics jsonb DEFAULT '{
  "growth_trends": {
    "revenue_growth": [],
    "user_growth": [],
    "market_share_growth": [],
    "efficiency_metrics": []
  },
  "customer_metrics": {
    "acquisition_cost_trends": [],
    "lifetime_value_trends": [],
    "retention_rates": [],
    "satisfaction_scores": []
  },
  "operational_metrics": {
    "productivity_scores": [],
    "resource_utilization": [],
    "process_efficiency": [],
    "quality_metrics": []
  }
}',

-- Industry Benchmarks
ADD COLUMN IF NOT EXISTS industry_benchmarks jsonb DEFAULT '{
  "comparative_metrics": {
    "market_position": null,
    "revenue_percentile": null,
    "growth_percentile": null,
    "efficiency_percentile": null
  },
  "industry_standards": {
    "performance_standards": [],
    "quality_standards": [],
    "compliance_requirements": []
  },
  "competitive_analysis": {
    "strengths_score": null,
    "weaknesses_score": null,
    "opportunities_score": null,
    "threats_score": null
  }
}',

-- Risk Assessment Framework
ADD COLUMN IF NOT EXISTS risk_framework jsonb DEFAULT '{
  "market_risks": {
    "competition_risk": null,
    "demand_risk": null,
    "pricing_risk": null,
    "regulatory_risk": null
  },
  "operational_risks": {
    "technology_risk": null,
    "talent_risk": null,
    "supply_chain_risk": null,
    "process_risk": null
  },
  "financial_risks": {
    "funding_risk": null,
    "cash_flow_risk": null,
    "credit_risk": null,
    "market_risk": null
  },
  "mitigation_strategies": {
    "market_strategies": [],
    "operational_strategies": [],
    "financial_strategies": []
  }
}',

-- Success Probability Indicators
ADD COLUMN IF NOT EXISTS success_indicators jsonb DEFAULT '{
  "team_composition": {
    "experience_score": null,
    "skill_coverage": null,
    "leadership_score": null,
    "cohesion_score": null
  },
  "market_timing": {
    "trend_alignment": null,
    "market_readiness": null,
    "competitive_advantage": null,
    "entry_timing": null
  },
  "product_market_fit": {
    "problem_solution_fit": null,
    "market_demand_score": null,
    "user_adoption_rate": null,
    "feedback_score": null
  },
  "innovation_index": {
    "technology_score": null,
    "uniqueness_score": null,
    "scalability_score": null,
    "defensibility_score": null
  }
}',

-- Resource Allocation Metrics
ADD COLUMN IF NOT EXISTS resource_metrics jsonb DEFAULT '{
  "capital_efficiency": {
    "burn_rate_efficiency": null,
    "roi_metrics": [],
    "allocation_effectiveness": null,
    "funding_runway": null
  },
  "resource_utilization": {
    "human_capital": {
      "productivity_metrics": [],
      "skill_utilization": [],
      "capacity_usage": null
    },
    "technology_resources": {
      "infrastructure_efficiency": null,
      "system_utilization": null,
      "tech_stack_effectiveness": null
    },
    "operational_resources": {
      "asset_utilization": null,
      "process_efficiency": null,
      "resource_optimization": null
    }
  },
  "investment_requirements": {
    "immediate_needs": [],
    "short_term_needs": [],
    "long_term_needs": [],
    "priority_matrix": []
  },
  "scaling_potential": {
    "market_expansion_capacity": null,
    "operational_scalability": null,
    "technology_scalability": null,
    "team_scaling_readiness": null
  }
}';

-- Create function to calculate success probability score
CREATE OR REPLACE FUNCTION calculate_success_probability(
  company_data companies,
  industry_weight float DEFAULT 0.2,
  team_weight float DEFAULT 0.25,
  market_weight float DEFAULT 0.2,
  product_weight float DEFAULT 0.2,
  financial_weight float DEFAULT 0.15
)
RETURNS float
LANGUAGE plpgsql
AS $$
DECLARE
  success_score float := 0;
  max_score constant float := 100;
BEGIN
  -- Industry benchmark score
  IF company_data.industry_benchmarks->'comparative_metrics'->>'market_position' IS NOT NULL THEN
    success_score := success_score + industry_weight * 
      CASE (company_data.industry_benchmarks->'comparative_metrics'->>'market_position')::text
        WHEN 'leader' THEN 1.0
        WHEN 'challenger' THEN 0.8
        WHEN 'follower' THEN 0.6
        WHEN 'niche' THEN 0.4
        ELSE 0.2
      END * max_score;
  END IF;

  -- Team composition score
  IF company_data.success_indicators->'team_composition'->>'experience_score' IS NOT NULL THEN
    success_score := success_score + team_weight * 
      (company_data.success_indicators->'team_composition'->>'experience_score')::float * max_score;
  END IF;

  -- Market timing score
  IF company_data.success_indicators->'market_timing'->>'trend_alignment' IS NOT NULL THEN
    success_score := success_score + market_weight * 
      (company_data.success_indicators->'market_timing'->>'trend_alignment')::float * max_score;
  END IF;

  -- Product-market fit score
  IF company_data.success_indicators->'product_market_fit'->>'problem_solution_fit' IS NOT NULL THEN
    success_score := success_score + product_weight * 
      (company_data.success_indicators->'product_market_fit'->>'problem_solution_fit')::float * max_score;
  END IF;

  -- Financial health score
  IF company_data.resource_metrics->'capital_efficiency'->>'burn_rate_efficiency' IS NOT NULL THEN
    success_score := success_score + financial_weight * 
      (company_data.resource_metrics->'capital_efficiency'->>'burn_rate_efficiency')::float * max_score;
  END IF;

  RETURN ROUND(success_score::numeric, 2);
END;
$$;

-- Create function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(company_data companies)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  risk_scores jsonb;
  max_score constant float := 100;
BEGIN
  risk_scores := jsonb_build_object(
    'market_risk', CASE
      WHEN company_data.risk_framework->'market_risks'->>'competition_risk' IS NOT NULL THEN
        ROUND((
          (company_data.risk_framework->'market_risks'->>'competition_risk')::float +
          (company_data.risk_framework->'market_risks'->>'demand_risk')::float +
          (company_data.risk_framework->'market_risks'->>'pricing_risk')::float +
          (company_data.risk_framework->'market_risks'->>'regulatory_risk')::float
        ) / 4 * max_score, 2)
      ELSE NULL
    END,
    'operational_risk', CASE
      WHEN company_data.risk_framework->'operational_risks'->>'technology_risk' IS NOT NULL THEN
        ROUND((
          (company_data.risk_framework->'operational_risks'->>'technology_risk')::float +
          (company_data.risk_framework->'operational_risks'->>'talent_risk')::float +
          (company_data.risk_framework->'operational_risks'->>'supply_chain_risk')::float +
          (company_data.risk_framework->'operational_risks'->>'process_risk')::float
        ) / 4 * max_score, 2)
      ELSE NULL
    END,
    'financial_risk', CASE
      WHEN company_data.risk_framework->'financial_risks'->>'funding_risk' IS NOT NULL THEN
        ROUND((
          (company_data.risk_framework->'financial_risks'->>'funding_risk')::float +
          (company_data.risk_framework->'financial_risks'->>'cash_flow_risk')::float +
          (company_data.risk_framework->'financial_risks'->>'credit_risk')::float +
          (company_data.risk_framework->'financial_risks'->>'market_risk')::float
        ) / 4 * max_score, 2)
      ELSE NULL
    END
  );

  -- Calculate overall risk score
  risk_scores := risk_scores || jsonb_build_object(
    'overall_risk', CASE
      WHEN risk_scores->>'market_risk' IS NOT NULL AND
           risk_scores->>'operational_risk' IS NOT NULL AND
           risk_scores->>'financial_risk' IS NOT NULL
      THEN
        ROUND((
          (risk_scores->>'market_risk')::float +
          (risk_scores->>'operational_risk')::float +
          (risk_scores->>'financial_risk')::float
        ) / 3, 2)
      ELSE NULL
    END
  );

  RETURN risk_scores;
END;
$$;

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_companies_performance_metrics ON companies USING gin (performance_metrics);
CREATE INDEX IF NOT EXISTS idx_companies_industry_benchmarks ON companies USING gin (industry_benchmarks);
CREATE INDEX IF NOT EXISTS idx_companies_risk_framework ON companies USING gin (risk_framework);
CREATE INDEX IF NOT EXISTS idx_companies_success_indicators ON companies USING gin (success_indicators);
CREATE INDEX IF NOT EXISTS idx_companies_resource_metrics ON companies USING gin (resource_metrics);