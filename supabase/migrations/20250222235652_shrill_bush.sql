-- Check role for aliecohen@gmail.com
DO $$ 
DECLARE
  user_role text;
  user_exists boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'aliecohen@gmail.com'
  ) INTO user_exists;

  RAISE NOTICE 'User exists in auth.users: %', user_exists;

  -- Check role in profiles
  SELECT role INTO user_role
  FROM profiles
  WHERE email = 'aliecohen@gmail.com'
  LIMIT 1;

  RAISE NOTICE 'User role in profiles table: %', user_role;
END $$;