-- Drop existing columns if they exist
DO $$ BEGIN
    -- Drop existing columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'standup_tasks' AND column_name = 'ai_suggestions') THEN
        ALTER TABLE standup_tasks DROP COLUMN ai_suggestions;
    END IF;
END $$;

-- Add individual columns for AI suggestions data
ALTER TABLE standup_tasks
ADD COLUMN IF NOT EXISTS implementation_tips text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS potential_challenges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS success_metrics text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resources jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS learning_resources jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tools jsonb DEFAULT '[]';

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_tasks_implementation_tips ON standup_tasks USING gin(implementation_tips);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_potential_challenges ON standup_tasks USING gin(potential_challenges);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_success_metrics ON standup_tasks USING gin(success_metrics);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_resources ON standup_tasks USING gin(resources);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_learning_resources ON standup_tasks USING gin(learning_resources);
CREATE INDEX IF NOT EXISTS idx_standup_tasks_tools ON standup_tasks USING gin(tools);