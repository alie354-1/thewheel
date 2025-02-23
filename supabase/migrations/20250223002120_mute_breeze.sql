-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create new policies
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  RETURN user_role;
END;
$$;