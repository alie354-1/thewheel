-- Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;

-- Create policies
CREATE POLICY "Anyone can view app settings"
  ON app_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (is_public = true OR auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  ));

CREATE POLICY "Users can update their own profile"
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

-- Update all users to have admin role
UPDATE profiles
SET role = 'admin'
WHERE role = 'user';

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    full_name,
    is_public,
    allows_messages,
    settings
  ) VALUES (
    new.id,
    new.email,
    'admin',
    new.raw_user_meta_data->>'full_name',
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
      )
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;