-- First drop all existing policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own standup tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can create their own standup tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can update their own standup tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "task_select_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "task_insert_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "task_update_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "task_delete_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "standup_tasks_view_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "standup_tasks_insert_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "standup_tasks_update_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "standup_tasks_delete_policy" ON standup_tasks;
    DROP POLICY IF EXISTS "task_view_policy" ON standup_tasks;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new simplified policies
CREATE POLICY "task_select"
  ON standup_tasks
  FOR SELECT
  USING (
    -- Personal tasks
    (
      category = 'personal' AND
      EXISTS (
        SELECT 1 FROM standup_entries
        WHERE id = standup_entry_id
        AND user_id = auth.uid()
      )
    )
    OR
    -- Tasks assigned to user
    assigned_to = auth.uid()
    OR
    -- Company tasks (if user is a member)
    (
      category = 'company' AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "task_insert"
  ON standup_tasks
  FOR INSERT
  WITH CHECK (
    -- Personal tasks
    (
      category = 'personal' AND
      EXISTS (
        SELECT 1 FROM standup_entries
        WHERE id = standup_entry_id
        AND user_id = auth.uid()
      )
    )
    OR
    -- Company tasks (if user is a member)
    (
      category = 'company' AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "task_update"
  ON standup_tasks
  FOR UPDATE
  USING (
    -- Personal tasks
    (
      category = 'personal' AND
      EXISTS (
        SELECT 1 FROM standup_entries
        WHERE id = standup_entry_id
        AND user_id = auth.uid()
      )
    )
    OR
    -- Tasks assigned to user
    assigned_to = auth.uid()
    OR
    -- Company tasks (if user is an admin/owner)
    (
      category = 'company' AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "task_delete"
  ON standup_tasks
  FOR DELETE
  USING (
    -- Personal tasks
    (
      category = 'personal' AND
      EXISTS (
        SELECT 1 FROM standup_entries
        WHERE id = standup_entry_id
        AND user_id = auth.uid()
      )
    )
    OR
    -- Company tasks (if user is an admin/owner)
    (
      category = 'company' AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- Ensure company_id is set for company tasks
UPDATE standup_tasks t
SET company_id = c.id
FROM standup_entries e
JOIN company_members cm ON e.user_id = cm.user_id
JOIN companies c ON cm.company_id = c.id
WHERE t.standup_entry_id = e.id
AND t.category = 'company'
AND t.company_id IS NULL;