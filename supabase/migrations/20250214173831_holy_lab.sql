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

-- Fix company_members table structure
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE company_members 
  ADD CONSTRAINT company_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Simplified company member policies
CREATE POLICY "View company members"
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

CREATE POLICY "Manage company members"
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
CREATE POLICY "View company documents"
  ON company_documents
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Create company documents"
  ON company_documents
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Update company documents"
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
CREATE POLICY "View company tasks"
  ON company_tasks
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Manage company tasks"
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
CREATE POLICY "View development environments"
  ON development_environments
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM company_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Manage development environments"
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tasks_company_id ON company_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_development_environments_company_id ON development_environments(company_id);