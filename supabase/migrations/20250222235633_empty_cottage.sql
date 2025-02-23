-- Check role for aliecohen@gmail.com
DO $$ 
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE email = 'aliecohen@gmail.com'
  LIMIT 1;

  RAISE NOTICE 'User role for aliecohen@gmail.com: %', user_role;
END $$;