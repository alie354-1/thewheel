-- Add missing columns to standup_tasks
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS estimated_hours numeric,
ADD COLUMN IF NOT EXISTS dependencies text[],
ADD COLUMN IF NOT EXISTS task_type text CHECK (task_type IN (
  'feature',
  'bug',
  'documentation',
  'research',
  'design',
  'planning',
  'testing',
  'deployment',
  'maintenance',
  'other'
));

-- Update existing tasks to have a task_type
UPDATE standup_tasks
SET task_type = 'other'
WHERE task_type IS NULL;

-- Make task_type required
ALTER TABLE standup_tasks
ALTER COLUMN task_type SET NOT NULL,
ALTER COLUMN task_type SET DEFAULT 'other';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_completed_at ON standup_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_task_type ON standup_tasks(task_type);

-- Update completed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating completed_at
DROP TRIGGER IF EXISTS update_task_completed_at ON standup_tasks;
CREATE TRIGGER update_task_completed_at
  BEFORE UPDATE ON standup_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completed_at();