-- First remove any existing task_type constraints
ALTER TABLE standup_tasks 
DROP CONSTRAINT IF EXISTS standup_tasks_task_type_check;

-- Update any NULL task_types to 'Other'
UPDATE standup_tasks
SET task_type = 'Other'
WHERE task_type IS NULL;

-- Add the constraint with the correct values
ALTER TABLE standup_tasks
ADD CONSTRAINT standup_tasks_task_type_check
CHECK (task_type IN (
  'Feature Development',
  'Bug Fix',
  'Documentation',
  'Research',
  'Design',
  'Planning',
  'Marketing',
  'Sales',
  'Customer Support',
  'Infrastructure',
  'Testing',
  'Analytics',
  'Process Improvement',
  'Team Coordination',
  'Other'
));

-- Set default value
ALTER TABLE standup_tasks
ALTER COLUMN task_type SET DEFAULT 'Other';

-- Drop and recreate ai_suggestions column with proper structure
DROP INDEX IF EXISTS idx_standup_tasks_ai_suggestions;
ALTER TABLE standup_tasks DROP COLUMN IF EXISTS ai_suggestions;

ALTER TABLE standup_tasks
ADD COLUMN ai_suggestions jsonb DEFAULT '{
  "implementation_tips": [],
  "potential_challenges": [],
  "success_metrics": [],
  "resources": [],
  "learning_resources": [],
  "tools": []
}'::jsonb;

-- Add estimated_hours if it doesn't exist
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT 1;

-- Add assigned_to if it doesn't exist
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_task_type ON standup_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_ai_suggestions ON standup_tasks USING gin(ai_suggestions);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_assigned_to ON standup_tasks(assigned_to);

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