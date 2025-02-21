/*
  # Fix Database Policies and Relationships

  1. Changes
    - Drop all existing policies to start fresh
    - Fix company_members foreign key relationship
    - Create simplified non-recursive policies
    - Add proper indexes

  2. Security
    - Maintain RLS security while avoiding recursion
    - Ensure proper access control for all tables
*/

-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "member_view_policy" ON company_members;
  DROP POLICY IF EXISTS "member_manage_policy" ON company_members;
  DROP POLICY IF EXISTS "document_view_policy" ON company_documents;
  DROP POLICY IF EXISTS "document_create_policy" ON company_documents;
  DROP POLICY IF EXISTS "document_update_policy" ON company_documents;
  DROP POLICY IF EXISTS "task_view_policy" ON company_tasks;
  DROP POLICY IF EXISTS "task_manage_policy" ON company_tasks;
  DROP POLICY IF EXISTS "environment_view_policy" ON development_environments;
  DROP POLICY IF EXISTS "environment_manage_policy" ON development_environments;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Fix company_members table
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_company_id_fkey;

-- Re-add proper foreign keys
ALTER TABLE company_members
  ADD CONSTRAINT company_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE company_members
  ADD CONSTRAINT company_members_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES companies(id) 
  ON DELETE CASCADE;

-- Create new simplified policies
CREATE POLICY "member_select"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_members.company_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "member_insert"
  ON company_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "member_update"
  ON company_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_members.company_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "member_delete"
  ON company_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_members.company_id 
      AND owner_id = auth.uid()
    )
  );

-- Document policies
CREATE POLICY "document_select"
  ON company_documents
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_documents.company_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = company_documents.company_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_insert"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = company_documents.company_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "document_update"
  ON company_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_documents.company_id 
      AND owner_id = auth.uid()
    )
  );

-- Task policies
CREATE POLICY "task_select"
  ON company_tasks
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_tasks.company_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = company_tasks.company_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "task_insert"
  ON company_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = company_tasks.company_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "task_update"
  ON company_tasks
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_tasks.company_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = company_tasks.company_id 
      AND user_id = auth.uid()
    )
  );

-- Environment policies
CREATE POLICY "environment_select"
  ON development_environments
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = development_environments.company_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = development_environments.company_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "environment_insert"
  ON development_environments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "environment_update"
  ON development_environments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = development_environments.company_id 
      AND owner_id = auth.uid()
    )
  );

-- Create or update indexes
DROP INDEX IF EXISTS idx_company_members_user_id;
DROP INDEX IF EXISTS idx_company_members_company_id;
DROP INDEX IF EXISTS idx_company_documents_company_id;
DROP INDEX IF EXISTS idx_company_documents_created_by;
DROP INDEX IF EXISTS idx_company_tasks_company_id;
DROP INDEX IF EXISTS idx_company_tasks_created_by;
DROP INDEX IF EXISTS idx_development_environments_company_id;
DROP INDEX IF EXISTS idx_development_environments_created_by;

CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX idx_company_documents_created_by ON company_documents(created_by);
CREATE INDEX idx_company_tasks_company_id ON company_tasks(company_id);
CREATE INDEX idx_company_tasks_created_by ON company_tasks(created_by);
CREATE INDEX idx_development_environments_company_id ON development_environments(company_id);
CREATE INDEX idx_development_environments_created_by ON development_environments(created_by);