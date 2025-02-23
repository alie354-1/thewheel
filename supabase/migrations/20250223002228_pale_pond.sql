-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

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

-- Create function to get user by email
CREATE OR REPLACE FUNCTION get_user_by_email(email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data json;
BEGIN
  SELECT json_build_object(
    'id', id,
    'email', email,
    'role', role,
    'full_name', full_name
  ) INTO user_data
  FROM profiles
  WHERE profiles.email = get_user_by_email.email;
  
  RETURN user_data;
END;
$$;