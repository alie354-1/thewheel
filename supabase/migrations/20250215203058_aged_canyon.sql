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

-- Add or update ai_suggestions column with proper structure
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
}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_task_type ON standup_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_ai_suggestions ON standup_tasks USING gin(ai_suggestions);