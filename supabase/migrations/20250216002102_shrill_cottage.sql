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
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new policies with strict visibility rules
CREATE POLICY "task_view_policy"
  ON standup_tasks
  FOR SELECT
  USING (
    -- Personal tasks (created by user)
    (category = 'personal' AND created_by = auth.uid())
    OR
    -- Tasks from user's standup entries
    (category = 'personal' AND EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    ))
    OR
    -- Tasks assigned to user
    assigned_to = auth.uid()
    OR
    -- Company tasks (if user is a company member)
    (
      category = 'company' AND
      company_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "task_insert_policy"
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
    -- Company tasks (if user is a company member)
    (
      category = 'company' AND
      company_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "task_update_policy"
  ON standup_tasks
  FOR UPDATE
  USING (
    -- Personal tasks (created by user)
    (category = 'personal' AND created_by = auth.uid())
    OR
    -- Task assignee
    assigned_to = auth.uid()
    OR
    -- Company admin/owner for company tasks
    (
      category = 'company' AND
      company_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "task_delete_policy"
  ON standup_tasks
  FOR DELETE
  USING (
    -- Personal tasks (created by user)
    (category = 'personal' AND created_by = auth.uid())
    OR
    -- Company admin/owner for company tasks
    (
      category = 'company' AND
      company_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM company_members
        WHERE company_id = standup_tasks.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_company_id ON standup_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_created_by ON standup_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_category ON standup_tasks(category);