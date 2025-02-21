-- Add directory-specific fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{"linkedin": null, "twitter": null, "github": null}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_for jsonb DEFAULT '{"mentoring": false, "investing": false, "advising": false, "cofounding": false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create search index
CREATE INDEX IF NOT EXISTS profiles_search_idx ON profiles USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION profiles_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.headline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.skills, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.interests, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS profiles_search_trigger ON profiles;
CREATE TRIGGER profiles_search_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_search_update();

-- Create function to search profiles
CREATE OR REPLACE FUNCTION search_profiles(
  search_query text,
  filter_skills text[] DEFAULT NULL,
  filter_interests text[] DEFAULT NULL,
  filter_available_for text[] DEFAULT NULL,
  limit_val integer DEFAULT 20,
  offset_val integer DEFAULT 0
) 
RETURNS TABLE (
  id uuid,
  full_name text,
  headline text,
  bio text,
  skills text[],
  interests text[],
  location text,
  avatar_url text,
  website text,
  social_links jsonb,
  available_for jsonb,
  search_rank float4
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.headline,
    p.bio,
    p.skills,
    p.interests,
    p.location,
    p.avatar_url,
    p.website,
    p.social_links,
    p.available_for,
    ts_rank(p.search_vector, to_tsquery('english', search_query)) as search_rank
  FROM profiles p
  WHERE
    p.is_public = true
    AND (search_query IS NULL OR p.search_vector @@ to_tsquery('english', search_query))
    AND (filter_skills IS NULL OR p.skills && filter_skills)
    AND (filter_interests IS NULL OR p.interests && filter_interests)
    AND (filter_available_for IS NULL OR p.available_for ?| filter_available_for)
  ORDER BY search_rank DESC, p.full_name ASC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;