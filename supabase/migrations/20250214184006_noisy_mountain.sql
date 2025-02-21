/*
  # Fix Company Policies and Relationships

  1. Changes
    - Drop all existing policies to prevent conflicts
    - Fix company_members foreign key relationships
    - Create simplified non-recursive policies
    - Add proper indexes
    
  2. Security
    - Policies use direct table checks instead of recursive lookups
    - Proper access control for company resources
*/

-- Drop all existing policies
DO $$ 
BEGIN
  -- Drop company_members policies
  DROP POLICY IF EXISTS "member_view_access_policy" ON company_members;
  DROP POLICY IF EXISTS "member_manage_access_policy" ON company_members;
  
  -- Drop company_documents policies
  DROP POLICY IF EXISTS "document_view_access_policy" ON company_documents;
  DROP POLICY IF EXISTS "document_create_access_policy" ON company_documents;
  DROP POLICY IF EXISTS "document_update_access_policy" ON company_documents;
  
  -- Drop company_tasks policies
  DROP POLICY IF EXISTS "task_view_access_policy" ON company_tasks;
  DROP POLICY IF EXISTS "task_manage_access_policy" ON company_tasks;
  
  -- Drop development_environments policies
  DROP POLICY IF EXISTS "environment_view_access_policy" ON development_environments;
  DROP POLICY IF EXISTS "environment_manage_access_policy" ON development_environments;
END $$;

-- Fix company_members table
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;

-- Re-add proper foreign key
ALTER TABLE company_members
  ADD CONSTRAINT company_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create simplified non-recursive policies
CREATE POLICY "member_view_policy"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_members.company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "member_manage_policy"
  ON company_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_members.company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "document_view_policy"
  ON company_documents
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_documents.company_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members WHERE company_id = company_documents.company_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_create_policy"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_documents.company_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members WHERE company_id = company_documents.company_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_update_policy"
  ON company_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_documents.company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "task_view_policy"
  ON company_tasks
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_tasks.company_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members WHERE company_id = company_tasks.company_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "task_manage_policy"
  ON company_tasks
  FOR ALL
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies WHERE id = company_tasks.company_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members WHERE company_id = company_tasks.company_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "environment_view_policy"
  ON development_environments
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies WHERE id = development_environments.company_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members WHERE company_id = development_environments.company_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "environment_manage_policy"
  ON development_environments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies WHERE id = development_environments.company_id AND owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_created_by ON company_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_company_tasks_company_id ON company_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tasks_created_by ON company_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_development_environments_company_id ON development_environments(company_id);
CREATE INDEX IF NOT EXISTS idx_development_environments_created_by ON development_environments(created_by);