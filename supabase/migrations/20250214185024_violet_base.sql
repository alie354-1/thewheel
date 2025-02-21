-- Drop existing policies to prevent conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "member_select" ON company_members;
  DROP POLICY IF EXISTS "member_insert" ON company_members;
  DROP POLICY IF EXISTS "member_update" ON company_members;
  DROP POLICY IF EXISTS "member_delete" ON company_members;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Fix company_members table
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_company_id_fkey;

-- Re-add proper foreign keys with explicit schema references
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

-- Create new non-recursive policies
CREATE POLICY "member_select"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "member_insert"
  ON company_members
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "member_update"
  ON company_members
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "member_delete"
  ON company_members
  FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_company_members_user_id;
DROP INDEX IF EXISTS idx_company_members_company_id;

CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);