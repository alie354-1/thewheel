-- Add workspace_setup column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS workspace_setup jsonb DEFAULT '{
  "google": false,
  "microsoft": false
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_workspace_setup ON companies USING gin(workspace_setup);

-- Update existing companies with default workspace setup
UPDATE companies
SET workspace_setup = '{
  "google": false,
  "microsoft": false
}'
WHERE workspace_setup IS NULL;