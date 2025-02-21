-- First drop all existing policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own standup tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can create their own standup tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can update their own standup tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can view tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can create tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can update tasks" ON standup_tasks;
    DROP POLICY IF EXISTS "Users can delete tasks" ON standup_tasks;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add company_id and created_by if they don't exist
DO $$ BEGIN
    ALTER TABLE standup_tasks
    ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create new policies with unique names
CREATE POLICY "standup_tasks_view_policy"
  ON standup_tasks
  FOR SELECT
  USING (
    -- Personal tasks
    EXISTS (
      SELECT 1 FROM standup_entries
      WHERE id = standup_tasks.standup_entry_id
      AND user_id = auth.uid()
    )
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

CREATE POLICY "standup_tasks_insert_policy"
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

CREATE POLICY "standup_tasks_update_policy"
  ON standup_tasks
  FOR UPDATE
  USING (
    -- Task creator
    created_by = auth.uid()
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

CREATE POLICY "standup_tasks_delete_policy"
  ON standup_tasks
  FOR DELETE
  USING (
    -- Task creator
    created_by = auth.uid()
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

-- Update existing tasks to set created_by
UPDATE standup_tasks t
SET created_by = e.user_id
FROM standup_entries e
WHERE t.standup_entry_id = e.id
AND t.created_by IS NULL;

-- Update existing company tasks to set company_id
UPDATE standup_tasks t
SET company_id = c.id
FROM standup_entries e
JOIN company_members cm ON e.user_id = cm.user_id
JOIN companies c ON cm.company_id = c.id
WHERE t.standup_entry_id = e.id
AND t.category = 'company'
AND t.company_id IS NULL;