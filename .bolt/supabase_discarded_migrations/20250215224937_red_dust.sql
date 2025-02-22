-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own standup tasks" ON standup_tasks;

-- Create new policy that allows task creation without requiring standup entry
CREATE POLICY "Users can create tasks"
  ON standup_tasks
  FOR INSERT
  WITH CHECK (
    -- Allow if user is assigned to the task
    auth.uid() = assigned_to OR
    -- Or if task is associated with user's standup entry
    (standup_entry_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_entry_id
      AND user_id = auth.uid()
    )) OR
    -- Or if it's a company task and user is a company member
    (category = 'company' AND EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
    ))
  );