-- Drop and recreate super admin user with correct auth fields
DO $$ 
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  -- Delete existing user if exists
  DELETE FROM auth.users WHERE email = 'aliecohen@gmail.com';
  DELETE FROM profiles WHERE email = 'aliecohen@gmail.com';
  
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
    email_change_token_new,
    last_sign_in_at
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'aliecohen@gmail.com',
    crypt('test123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Alie Cohen"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    now()
  );

  -- Create profile for super admin with settings
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_public,
    allows_messages,
    settings,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'aliecohen@gmail.com',
    'Alie Cohen',
    'superadmin',
    true,
    true,
    jsonb_build_object(
      'notifications', jsonb_build_object(
        'email', true,
        'push', true
      ),
      'privacy', jsonb_build_object(
        'showProfile', true,
        'allowMessages', true
      ),
      'app_credentials', jsonb_build_object(),
      'feature_flags', jsonb_build_object(),
      'openai', jsonb_build_object(
        'api_key', '',
        'model', 'gpt-4'
      ),
      'cloud_storage', jsonb_build_object()
    ),
    now(),
    now()
  );

END $$;