-- Add market_insights column to ideas table
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS market_insights jsonb DEFAULT '{
  "customer_profiles": [],
  "early_adopters": [],
  "sales_channels": [],
  "pricing_insights": [],
  "integration_recommendations": [],
  "market_size_estimates": [],
  "competition_analysis": []
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ideas_market_insights ON ideas USING gin(market_insights);

-- Update any existing rows to have the default market_insights structure
UPDATE ideas
SET market_insights = '{
  "customer_profiles": [],
  "early_adopters": [],
  "sales_channels": [],
  "pricing_insights": [],
  "integration_recommendations": [],
  "market_size_estimates": [],
  "competition_analysis": []
}'::jsonb
WHERE market_insights IS NULL;