-- Drop and recreate super admin user with correct auth fields
DO $$ 
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  -- Delete existing user if exists
  DELETE FROM auth.users WHERE email = 'alie@jointhewheel.com';
  
  -- Create user in auth.users with correct auth fields
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change_token_new
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'alie@jointhewheel.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Alie"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    ''
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