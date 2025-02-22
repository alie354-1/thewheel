/*
  # Fix Company Policies and Relationships - Final

  1. Changes
    - Drop and recreate all policies with unique names
    - Fix foreign key relationships
    - Add proper indexes
    - Remove profile_id dependency

  2. Security
    - Maintain RLS with simplified checks
    - Ensure proper access control
*/

-- Drop all existing policies first
DO $$ 
BEGIN
  -- Drop company_members policies
  DROP POLICY IF EXISTS "Company members can view their own company members" ON company_members;
  DROP POLICY IF EXISTS "Company admins can manage members" ON company_members;
  DROP POLICY IF EXISTS "Users can view company members" ON company_members;
  DROP POLICY IF EXISTS "Company owners can manage members" ON company_members;
  
  -- Drop company_documents policies
  DROP POLICY IF EXISTS "Company members can view documents" ON company_documents;
  DROP POLICY IF EXISTS "Company members can create documents" ON company_documents;
  DROP POLICY IF EXISTS "Document creators and admins can update documents" ON company_documents;
  DROP POLICY IF EXISTS "Users can view company documents" ON company_documents;
  DROP POLICY IF EXISTS "Users can create company documents" ON company_documents;
  DROP POLICY IF EXISTS "Users can update own documents or as admin" ON company_documents;
  
  -- Drop company_tasks policies
  DROP POLICY IF EXISTS "Company members can view tasks" ON company_tasks;
  DROP POLICY IF EXISTS "Company members can create and update tasks" ON company_tasks;
  DROP POLICY IF EXISTS "Users can view company tasks" ON company_tasks;
  DROP POLICY IF EXISTS "Users can manage company tasks" ON company_tasks;
  
  -- Drop development_environments policies
  DROP POLICY IF EXISTS "Company members can view development environments" ON development_environments;
  DROP POLICY IF EXISTS "Company admins can manage development environments" ON development_environments;
  DROP POLICY IF EXISTS "Users can view development environments" ON development_environments;
  DROP POLICY IF EXISTS "Company owners can manage development environments" ON development_environments;
END $$;

-- Fix company_members table
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE company_members DROP COLUMN IF EXISTS profile_id;

-- Re-add proper foreign key
ALTER TABLE company_members
  ADD CONSTRAINT company_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create new policies with unique names
CREATE POLICY "member_view_access_policy"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "member_manage_access_policy"
  ON company_members
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Document policies with unique names
CREATE POLICY "document_view_access_policy"
  ON company_documents
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "document_create_access_policy"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "document_update_access_policy"
  ON company_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Task policies with unique names
CREATE POLICY "task_view_access_policy"
  ON company_tasks
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "task_manage_access_policy"
  ON company_tasks
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Development environment policies with unique names
CREATE POLICY "environment_view_access_policy"
  ON development_environments
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
      UNION
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "environment_manage_access_policy"
  ON development_environments
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Update helper functions
CREATE OR REPLACE FUNCTION is_company_member(company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM company_members WHERE company_id = company_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_company_admin(company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid()
  );
$$;

-- Create or update indexes
DROP INDEX IF EXISTS idx_company_members_user_id;
DROP INDEX IF EXISTS idx_company_members_company_id;
DROP INDEX IF EXISTS idx_company_documents_company_id;
DROP INDEX IF EXISTS idx_company_tasks_company_id;
DROP INDEX IF EXISTS idx_development_environments_company_id;

CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX idx_company_documents_created_by ON company_documents(created_by);
CREATE INDEX idx_company_tasks_company_id ON company_tasks(company_id);
CREATE INDEX idx_company_tasks_created_by ON company_tasks(created_by);
CREATE INDEX idx_development_environments_company_id ON development_environments(company_id);
CREATE INDEX idx_development_environments_created_by ON development_environments(created_by);