-- Add user_email column to company_members
ALTER TABLE company_members
ADD COLUMN IF NOT EXISTS user_email text;

-- Create function to sync user email
CREATE OR REPLACE FUNCTION sync_company_member_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user email from auth.users
  SELECT email
  INTO NEW.user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync user email on insert/update
DROP TRIGGER IF EXISTS sync_company_member_email ON company_members;
CREATE TRIGGER sync_company_member_email
  BEFORE INSERT OR UPDATE OF user_id ON company_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_member_email();

-- Update existing records
UPDATE company_members cm
SET user_email = u.email
FROM auth.users u
WHERE cm.user_id = u.id
AND cm.user_email IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_company_members_user_email ON company_members(user_email);