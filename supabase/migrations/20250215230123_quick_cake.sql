-- Add notes and updates fields to standup_tasks
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS updates jsonb DEFAULT '[]';

-- Create index for updates
CREATE INDEX IF NOT EXISTS idx_standup_tasks_updates ON standup_tasks USING gin(updates);