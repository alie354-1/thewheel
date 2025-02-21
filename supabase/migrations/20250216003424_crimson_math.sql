-- First drop all existing policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "task_select" ON standup_tasks;
    DROP POLICY IF EXISTS "task_insert" ON standup_tasks;
    DROP POLICY IF EXISTS "task_update" ON standup_tasks;
    DROP POLICY IF EXISTS "task_delete" ON standup_tasks;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new stricter policies
CREATE POLICY "task_select"
  ON standup_tasks
  FOR SELECT
  USING (
    -- Only task creator can see personal tasks
    (
      category = 'personal' AND
      created_by = auth.uid()
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
      created_by = auth.uid()
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
    -- Only creator can update personal tasks
    (
      category = 'personal' AND
      created_by = auth.uid()
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
    -- Only creator can delete personal tasks
    (
      category = 'personal' AND
      created_by = auth.uid()
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