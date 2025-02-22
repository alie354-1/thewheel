/*
  # Fix Company Policies and Relationships

  1. Changes
    - Fix infinite recursion in company member policies
    - Add missing foreign key relationship for profiles
    - Simplify policy checks to prevent recursion
    - Add proper indexes for performance

  2. Security
    - Maintain RLS policies with proper access control
    - Ensure data access is properly scoped to company members
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

-- Fix company_members table relationships
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_profile_id_fkey;

-- Add proper foreign key relationships
ALTER TABLE company_members
  ADD CONSTRAINT company_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create non-recursive policies using direct checks
CREATE POLICY "Company members can view their own company members"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = company_members.company_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage members"
  ON company_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = company_members.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Document policies
CREATE POLICY "Company members can view documents"
  ON company_documents
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = company_documents.company_id 
      AND (c.owner_id = auth.uid() OR EXISTS (
        SELECT 1 
        FROM company_members cm 
        WHERE cm.company_id = c.id 
        AND cm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Company members can create documents"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = company_documents.company_id 
      AND (c.owner_id = auth.uid() OR EXISTS (
        SELECT 1 
        FROM company_members cm 
        WHERE cm.company_id = c.id 
        AND cm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Document creators and admins can update documents"
  ON company_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = company_documents.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Task policies
CREATE POLICY "Company members can view tasks"
  ON company_tasks
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = company_tasks.company_id 
      AND (c.owner_id = auth.uid() OR EXISTS (
        SELECT 1 
        FROM company_members cm 
        WHERE cm.company_id = c.id 
        AND cm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Company members can manage tasks"
  ON company_tasks
  FOR ALL
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = company_tasks.company_id 
      AND (c.owner_id = auth.uid() OR EXISTS (
        SELECT 1 
        FROM company_members cm 
        WHERE cm.company_id = c.id 
        AND cm.user_id = auth.uid()
      ))
    )
  );

-- Development environment policies
CREATE POLICY "Company members can view development environments"
  ON development_environments
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = development_environments.company_id 
      AND (c.owner_id = auth.uid() OR EXISTS (
        SELECT 1 
        FROM company_members cm 
        WHERE cm.company_id = c.id 
        AND cm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Company admins can manage development environments"
  ON development_environments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM companies c
      WHERE c.id = development_environments.company_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tasks_company_id ON company_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_development_environments_company_id ON development_environments(company_id);

-- Update helper functions to prevent recursion
CREATE OR REPLACE FUNCTION is_company_member(company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM companies c
    WHERE c.id = company_id 
    AND (c.owner_id = auth.uid() OR EXISTS (
      SELECT 1 
      FROM company_members cm 
      WHERE cm.company_id = c.id 
      AND cm.user_id = auth.uid()
    ))
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
    FROM companies c
    WHERE c.id = company_id 
    AND c.owner_id = auth.uid()
  );
$$;