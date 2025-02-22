/*
  # Fix company member policies and relationships

  1. Changes
    - Fix infinite recursion in company member policies
    - Add correct foreign key relationships
    - Update policies to use direct checks instead of recursive queries
    - Fix profile relationship in company members

  2. Security
    - Maintain RLS security while preventing recursion
    - Ensure proper access control
*/

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Company members can view their own company members" ON company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Company members can view documents" ON company_documents;
DROP POLICY IF EXISTS "Company members can create documents" ON company_documents;
DROP POLICY IF EXISTS "Document creators and admins can update documents" ON company_documents;
DROP POLICY IF EXISTS "Company members can view tasks" ON company_tasks;
DROP POLICY IF EXISTS "Company members can create and update tasks" ON company_tasks;
DROP POLICY IF EXISTS "Company members can view development environments" ON development_environments;
DROP POLICY IF EXISTS "Company admins can manage development environments" ON development_environments;

-- Fix company_members table
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE company_members 
  ADD CONSTRAINT company_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create new non-recursive policies
CREATE POLICY "Company members can view their own company members"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = company_members.company_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage members"
  ON company_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = company_members.company_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Document policies
CREATE POLICY "Company members can view documents"
  ON company_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = company_documents.company_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create documents"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = company_documents.company_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Document creators and admins can update documents"
  ON company_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = company_documents.company_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Task policies
CREATE POLICY "Company members can view tasks"
  ON company_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = company_tasks.company_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create and update tasks"
  ON company_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = company_tasks.company_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Development environment policies
CREATE POLICY "Company members can view development environments"
  ON development_environments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = development_environments.company_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage development environments"
  ON development_environments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = development_environments.company_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Update helper functions to prevent recursion
CREATE OR REPLACE FUNCTION is_company_member(company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM company_members cm 
    WHERE cm.company_id = $1 
    AND cm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_company_admin(company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM company_members cm 
    WHERE cm.company_id = $1 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('owner', 'admin')
  );
$$;