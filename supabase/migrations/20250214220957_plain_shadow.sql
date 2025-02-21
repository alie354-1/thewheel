-- Drop existing tables if they exist
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- Create communities table with auth.users reference
CREATE TABLE communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text UNIQUE NOT NULL,
  avatar_url text,
  banner_url text,
  member_count integer DEFAULT 0,
  is_private boolean DEFAULT false,
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

-- Create community posts table
CREATE TABLE community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'discussion',
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community comments table
CREATE TABLE community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Community policies
CREATE POLICY "view_communities"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "create_communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "update_communities"
  ON communities FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "delete_communities"
  ON communities FOR DELETE
  USING (owner_id = auth.uid());

-- Community members policies
CREATE POLICY "view_community_members"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "manage_community_members"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND owner_id = auth.uid()
    )
  );

-- Post policies
CREATE POLICY "view_community_posts"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "create_community_posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "update_community_posts"
  ON community_posts FOR UPDATE
  USING (author_id = auth.uid());

-- Comment policies
CREATE POLICY "view_community_comments"
  ON community_comments FOR SELECT
  USING (true);

CREATE POLICY "create_community_comments"
  ON community_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "update_community_comments"
  ON community_comments FOR UPDATE
  USING (author_id = auth.uid());

-- Create indexes
CREATE INDEX idx_communities_owner ON communities(owner_id);
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_posts_community ON community_posts(community_id);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_comments_post ON community_comments(post_id);
CREATE INDEX idx_community_comments_author ON community_comments(author_id);

-- Create function to update member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET member_count = member_count - 1
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for member count
DROP TRIGGER IF EXISTS update_community_member_count ON community_members;
CREATE TRIGGER update_community_member_count
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();