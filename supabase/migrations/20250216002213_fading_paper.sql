-- Update tasks with NULL created_by to use the specified user
UPDATE standup_tasks t
SET created_by = u.id
FROM auth.users u
WHERE t.created_by IS NULL
AND u.email = 'alie@jointhewheel.com';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_created_by ON standup_tasks(created_by);