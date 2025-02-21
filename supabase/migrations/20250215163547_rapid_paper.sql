-- First remove the task_type column and its constraint
ALTER TABLE standup_tasks 
DROP COLUMN IF EXISTS task_type;

-- Add the task_type column back with the correct constraint
ALTER TABLE standup_tasks
ADD COLUMN task_type text DEFAULT 'Other';

-- Add the constraint after any data is present
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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_task_type ON standup_tasks(task_type);