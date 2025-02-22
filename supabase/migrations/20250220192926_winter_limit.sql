-- Add industries column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS industries text[] DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_industries ON companies USING gin(industries);

-- Update existing companies with empty industries array
UPDATE companies
SET industries = '{}'
WHERE industries IS NULL;