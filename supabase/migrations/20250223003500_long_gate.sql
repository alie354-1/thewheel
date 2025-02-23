-- Update all users to have admin role
UPDATE profiles
SET role = 'admin'
WHERE role = 'user';

-- Create function to log role counts
CREATE OR REPLACE FUNCTION log_role_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    role_record RECORD;
BEGIN
    FOR role_record IN 
        SELECT role, COUNT(*) as count 
        FROM profiles 
        GROUP BY role
    LOOP
        RAISE NOTICE 'Role %: % users', role_record.role, role_record.count;
    END LOOP;
END;
$$;

-- Call the function to log current role counts
SELECT log_role_counts();

-- Update default role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    'admin',  -- Set default role to admin
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;