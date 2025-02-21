/*
  # Fix Community Tables and Policies

  1. Changes
    - Create community tables with proper type handling
    - Fix policies to properly handle UUIDs
    - Add proper type casting for comparisons
    
  2. Security
    - Enable RLS
    - Add proper security policies
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS community_documents CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- Create communities table
CREATE TABLE communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text UNIQUE NOT NULL,
  avatar_url text,
  banner_url text,
  member_count integer DEFAULT 0,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community members table
CREATE TABLE community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community documents table
CREATE TABLE community_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  size_bytes bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add community_id to existing tables
DO $$ BEGIN
  ALTER TABLE community_posts ADD COLUMN community_id uuid REFERENCES communities(id) ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE community_events ADD COLUMN community_id uuid REFERENCES communities(id) ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_documents ENABLE ROW LEVEL SECURITY;

-- Community policies
CREATE POLICY "view_communities"
  ON communities FOR SELECT
  USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = communities.id
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "create_communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "update_communities"
  ON communities FOR UPDATE
  USING (owner_id::text = auth.uid()::text);

CREATE POLICY "delete_communities"
  ON communities FOR DELETE
  USING (owner_id::text = auth.uid()::text);

-- Community members policies
CREATE POLICY "view_community_members"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND (
        owner_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = communities.id
          AND cm.user_id::text = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "manage_community_members"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_members.community_id
      AND user_id::text = auth.uid()::text
      AND role IN ('owner', 'admin')
    )
  );

-- Community documents policies
CREATE POLICY "view_community_documents"
  ON community_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_documents.community_id
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "create_community_documents"
  ON community_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_documents.community_id
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "update_community_documents"
  ON community_documents FOR UPDATE
  USING (
    author_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_documents.community_id
      AND user_id::text = auth.uid()::text
      AND role IN ('owner', 'admin')
    )
  );

-- Update post policies to check community membership
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "view_community_posts"
    ON community_posts FOR SELECT
    USING (
      community_id IS NULL OR
      EXISTS (
        SELECT 1 FROM communities
        WHERE id = community_posts.community_id
        AND (
          owner_id::text = auth.uid()::text OR
          EXISTS (
            SELECT 1 FROM community_members
            WHERE community_id = communities.id
            AND user_id::text = auth.uid()::text
          )
        )
      )
    );
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Update event policies to check community membership
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view public events" ON community_events;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "view_community_events"
    ON community_events FOR SELECT
    USING (
      community_id IS NULL OR
      EXISTS (
        SELECT 1 FROM communities
        WHERE id = community_events.community_id
        AND (
          owner_id::text = auth.uid()::text OR
          EXISTS (
            SELECT 1 FROM community_members
            WHERE community_id = communities.id
            AND user_id::text = auth.uid()::text
          )
        )
      )
    );
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create indexes
CREATE INDEX idx_communities_owner ON communities(owner_id);
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_documents_community ON community_documents(community_id);
CREATE INDEX idx_community_documents_author ON community_documents(author_id);

DO $$ BEGIN
  CREATE INDEX idx_community_posts_community ON community_posts(community_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_community_events_community ON community_events(community_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Create function to update member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET member_count = member_count + 1
    WHERE id::text = NEW.community_id::text;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET member_count = member_count - 1
    WHERE id::text = OLD.community_id::text;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for member count
DROP TRIGGER IF EXISTS update_community_member_count ON community_members;
CREATE TRIGGER update_community_member_count
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Create initial communities
DO $$ 
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user's ID
  SELECT id INTO first_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- Insert initial communities
  IF first_user_id IS NOT NULL THEN
    INSERT INTO communities (name, description, slug, owner_id)
    VALUES 
      (
        'Startup Founders',
        'A community for startup founders to connect, share experiences, and help each other grow.',
        'startup-founders',
        first_user_id
      ),
      (
        'Tech Entrepreneurs',
        'Connect with other tech entrepreneurs, share insights, and discuss the latest trends.',
        'tech-entrepreneurs',
        first_user_id
      ),
      (
        'Product Builders',
        'A community focused on product development, design, and management.',
        'product-builders',
        first_user_id
      )
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;