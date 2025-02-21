-- Add new columns to standup_tasks
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS resources text[],
ADD COLUMN IF NOT EXISTS category text DEFAULT 'personal';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_category ON standup_tasks(category);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own standup tasks" ON standup_tasks;
CREATE POLICY "Users can view their own standup tasks"
  ON standup_tasks
  FOR SELECT
  USING (
    category = 'company' OR
    EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    ) OR
    assigned_to = auth.uid()
  );