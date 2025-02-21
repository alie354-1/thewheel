-- Add cloud_storage column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS cloud_storage jsonb DEFAULT '{
  "master_folder": null,
  "google": null,
  "microsoft": null
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_cloud_storage ON companies USING gin(cloud_storage);

-- Update existing companies with default cloud storage settings
UPDATE companies
SET cloud_storage = '{
  "master_folder": null,
  "google": null,
  "microsoft": null
}'
WHERE cloud_storage IS NULL;