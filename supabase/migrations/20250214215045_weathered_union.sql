-- Drop existing tables if they exist
DROP TABLE IF EXISTS community_document_comments CASCADE;
DROP TABLE IF EXISTS community_document_versions CASCADE;
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
  is_private boolean DEFAULT false,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{
    "allow_member_invites": true,
    "require_approval": false,
    "default_member_role": "member",
    "post_guidelines": null,
    "allowed_post_types": ["discussion", "question", "event", "resource"]
  }',
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
  folder_path text DEFAULT '/',
  is_pinned boolean DEFAULT false,
  permissions jsonb DEFAULT '{
    "view": ["all"],
    "edit": ["author", "admin"],
    "delete": ["author", "admin"]
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document versions table
CREATE TABLE community_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES community_documents(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_url text NOT NULL,
  changes_description text,
  created_at timestamptz DEFAULT now()
);

-- Create document comments table
CREATE TABLE community_document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES community_documents(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_document_comments ENABLE ROW LEVEL SECURITY;

-- Community policies
CREATE POLICY "view_communities"
  ON communities FOR SELECT
  USING (
    NOT is_private OR
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = id
      AND user_id = auth.uid()
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = communities.id
          AND cm.user_id = auth.uid()
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
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Document policies
CREATE POLICY "view_community_documents"
  ON community_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_documents.community_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "create_community_documents"
  ON community_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_documents.community_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "update_community_documents"
  ON community_documents FOR UPDATE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_documents.community_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Document version policies
CREATE POLICY "view_document_versions"
  ON community_document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_documents d
      JOIN community_members m ON d.community_id = m.community_id
      WHERE d.id = document_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "create_document_versions"
  ON community_document_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_documents d
      JOIN community_members m ON d.community_id = m.community_id
      WHERE d.id = document_id
      AND m.user_id = auth.uid()
      AND (d.author_id = auth.uid() OR m.role IN ('owner', 'admin'))
    )
  );

-- Document comment policies
CREATE POLICY "view_document_comments"
  ON community_document_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_documents d
      JOIN community_members m ON d.community_id = m.community_id
      WHERE d.id = document_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "create_document_comments"
  ON community_document_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_documents d
      JOIN community_members m ON d.community_id = m.community_id
      WHERE d.id = document_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "manage_document_comments"
  ON community_document_comments FOR ALL
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_documents d
      JOIN community_members m ON d.community_id = m.community_id
      WHERE d.id = document_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Create indexes
CREATE INDEX idx_communities_owner ON communities(owner_id);
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_documents_community ON community_documents(community_id);
CREATE INDEX idx_community_documents_author ON community_documents(author_id);
CREATE INDEX idx_document_versions_document ON community_document_versions(document_id);
CREATE INDEX idx_document_comments_document ON community_document_comments(document_id);

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