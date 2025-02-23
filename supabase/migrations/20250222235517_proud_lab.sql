-- Create super admin profile
DO $$ 
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'aliecohen@gmail.com'
  LIMIT 1;

  -- Create or update profile for super admin
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_public,
    allows_messages,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'aliecohen@gmail.com',
    'Alie Cohen',
    'superadmin',
    true,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'superadmin',
    updated_at = now();

END $$;