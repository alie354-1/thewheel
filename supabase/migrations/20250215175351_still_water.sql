-- Drop existing company_members table
DROP TABLE IF EXISTS company_members CASCADE;

-- Create company_members table with proper references
CREATE TABLE company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  title text,
  department text,
  invited_email text,
  invitation_token uuid,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Enable RLS
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create indexes
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);

-- Create function to get user details from auth.users
CREATE OR REPLACE FUNCTION get_user_details(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_data json;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'full_name', COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.email)
  ) INTO user_data
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = user_id;
  
  RETURN user_data;
END;
$$;