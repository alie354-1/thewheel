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