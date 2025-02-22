-- First drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_invitation_code ON companies;

-- Add invitation_code column to companies if it doesn't exist
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS invitation_code text UNIQUE;

-- Create or replace function to generate random code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  valid boolean;
BEGIN
  valid := false;
  WHILE NOT valid LOOP
    -- Generate 8 character random alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    -- Check if code is unique
    SELECT NOT EXISTS (
      SELECT 1 FROM companies WHERE invitation_code = code
    ) INTO valid;
  END LOOP;
  RETURN code;
END;
$$;

-- Create or replace function to set invitation code
CREATE OR REPLACE FUNCTION set_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER ensure_invitation_code
  BEFORE INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_code();

-- Create function to join company by code
CREATE OR REPLACE FUNCTION join_company_by_code(code text, user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id uuid;
BEGIN
  -- Get company ID from code
  SELECT id INTO company_id
  FROM companies
  WHERE invitation_code = upper(code);

  IF company_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation code';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = company_id
    AND user_id = join_company_by_code.user_id
  ) THEN
    RAISE EXCEPTION 'Already a member of this company';
  END IF;

  -- Add user as member
  INSERT INTO company_members (
    company_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    company_id,
    join_company_by_code.user_id,
    'member',
    now()
  );

  RETURN company_id;
END;
$$;

-- Create index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_companies_invitation_code ON companies(invitation_code);

-- Update existing companies with invitation codes
UPDATE companies 
SET invitation_code = generate_invitation_code()
WHERE invitation_code IS NULL;