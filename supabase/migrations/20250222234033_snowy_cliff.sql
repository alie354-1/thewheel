-- Create super admin user
DO $$ 
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  -- Create user in auth.users with minimal required fields
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_sent_at,
    is_super_admin
  ) VALUES (
    user_id,
    'alie@jointhewheel.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"full_name": "Alie"}',
    now(),
    now(),
    now(),
    now(),
    true
  );

  -- Create profile for super admin
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
    'alie@jointhewheel.com',
    'Alie',
    'superadmin',
    true,
    true,
    now(),
    now()
  );

END $$;