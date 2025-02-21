-- Add missing columns to company_members
ALTER TABLE company_members
ADD COLUMN IF NOT EXISTS user_email text,
ADD COLUMN IF NOT EXISTS user_full_name text;

-- Create function to sync user data to company_members
CREATE OR REPLACE FUNCTION sync_company_member_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user data from auth.users
  SELECT 
    email,
    raw_user_meta_data->>'full_name'
  INTO
    NEW.user_email,
    NEW.user_full_name
  FROM auth.users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync user data on insert/update
DROP TRIGGER IF EXISTS sync_company_member_user_data ON company_members;
CREATE TRIGGER sync_company_member_user_data
  BEFORE INSERT OR UPDATE OF user_id ON company_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_member_user_data();

-- Update existing records
UPDATE company_members cm
SET 
  user_email = u.email,
  user_full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE cm.user_id = u.id;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_email ON company_members(user_email);
CREATE INDEX IF NOT EXISTS idx_company_members_user_full_name ON company_members(user_full_name);