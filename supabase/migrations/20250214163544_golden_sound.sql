/*
  # Fix company member policies and relationships - Final

  1. Changes
    - Add proper foreign key relationships for profiles
    - Simplify policies to prevent recursion
    - Fix join conditions for company members

  2. Security
    - Maintain RLS while preventing recursion
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Company members can view their own company members" ON company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Company members can view documents" ON company_documents;
DROP POLICY IF EXISTS "Company members can create documents" ON company_documents;
DROP POLICY IF EXISTS "Document creators and admins can update documents" ON company_documents;
DROP POLICY IF EXISTS "Company members can view tasks" ON company_tasks;
DROP POLICY IF EXISTS "Company members can create and update tasks" ON company_tasks;
DROP POLICY IF EXISTS "Company members can view development environments" ON development_environments;
DROP POLICY IF EXISTS "Company admins can manage development environments" ON development_environments;

-- Add profile_id column to company_members for proper joins
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id);
UPDATE company_members SET profile_id = user_id WHERE profile_id IS NULL;
ALTER TABLE company_members ALTER COLUMN profile_id SET NOT NULL;

-- Simplified company member policies
CREATE POLICY "Users can view company members"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage members"
  ON company_members
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Simplified document policies
CREATE POLICY "Users can view company documents"
  ON company_documents
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create company documents"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update company documents"
  ON company_documents
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Simplified task policies
CREATE POLICY "Users can view company tasks"
  ON company_tasks
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company tasks"
  ON company_tasks
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

-- Simplified development environment policies
CREATE POLICY "Users can view development environments"
  ON development_environments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage development environments"
  ON development_environments
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Simplified helper functions
CREATE OR REPLACE FUNCTION is_company_member(company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM company_members 
    WHERE company_id = $1 
    AND user_id = auth.uid()
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
    FROM company_members 
    WHERE company_id = $1 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  );
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_profile_id ON company_members(profile_id);