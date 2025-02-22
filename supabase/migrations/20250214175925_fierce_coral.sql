-- Drop the existing avatar_url constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_avatar_url_check;

-- Add a more permissive constraint that allows null and empty strings
ALTER TABLE profiles
ADD CONSTRAINT profiles_avatar_url_check 
CHECK (
  avatar_url IS NULL OR 
  avatar_url = '' OR 
  avatar_url ~ '^https?://.*'
);

-- Update any existing invalid avatar_url values to NULL
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url IS NOT NULL 
AND avatar_url != '' 
AND avatar_url !~ '^https?://.*';