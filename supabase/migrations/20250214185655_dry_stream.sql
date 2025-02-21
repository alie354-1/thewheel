-- Create a function to get user email by ID
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  RETURN user_email;
END;
$$;

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "member_select" ON company_members;
  DROP POLICY IF EXISTS "member_insert" ON company_members;
  DROP POLICY IF EXISTS "member_update" ON company_members;
  DROP POLICY IF EXISTS "member_delete" ON company_members;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Create new policies with proper auth checks
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