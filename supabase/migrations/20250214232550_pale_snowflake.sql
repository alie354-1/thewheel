-- Add assigned_to column to standup_tasks table
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_assigned_to ON standup_tasks(assigned_to);

-- Update RLS policies to allow assigned users to view and update their tasks
DROP POLICY IF EXISTS "Users can view their own standup tasks" ON standup_tasks;
CREATE POLICY "Users can view their own standup tasks"
  ON standup_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    ) OR
    assigned_to = auth.uid() OR
    category = 'company'
  );

DROP POLICY IF EXISTS "Users can update their own standup tasks" ON standup_tasks;
CREATE POLICY "Users can update their own standup tasks"
  ON standup_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    ) OR
    assigned_to = auth.uid()
  );