-- Create a function to get user by email
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
    'email', email
  )
  INTO user_data
  FROM auth.users
  WHERE email = get_user_by_email.email;
  
  RETURN user_data;
END;
$$;