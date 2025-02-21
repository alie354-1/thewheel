-- Drop and recreate ai_suggestions column with proper structure
ALTER TABLE standup_tasks
DROP COLUMN IF EXISTS ai_suggestions;

ALTER TABLE standup_tasks
ADD COLUMN ai_suggestions jsonb DEFAULT '{
  "implementation_tips": [],
  "potential_challenges": [],
  "success_metrics": [],
  "resources": [],
  "learning_resources": [],
  "tools": []
}'::jsonb;

-- Update any existing tasks to have the correct JSON structure
UPDATE standup_tasks
SET ai_suggestions = '{
  "implementation_tips": [],
  "potential_challenges": [],
  "success_metrics": [],
  "resources": [],
  "learning_resources": [],
  "tools": []
}'::jsonb
WHERE ai_suggestions IS NULL OR ai_suggestions = '{}'::jsonb;

-- Create index for better query performance
DROP INDEX IF EXISTS idx_standup_tasks_ai_suggestions;
CREATE INDEX idx_standup_tasks_ai_suggestions ON standup_tasks USING gin(ai_suggestions);