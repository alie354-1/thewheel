/*
  # Community Tables Migration Fix

  This migration adds community-related tables and policies while handling existing objects gracefully.
  
  1. Tables
    - posts
    - comments
    - post_votes
    - comment_votes

  2. Policies
    - View and manage posts
    - View and manage comments
    - Handle voting

  3. Functions
    - Vote counting
    - Vote updates
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  -- Posts policies
  DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
  DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
  DROP POLICY IF EXISTS "Admins can update any post" ON posts;

  -- Comments policies
  DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
  DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
  DROP POLICY IF EXISTS "Users can update their own comments" ON comments;

  -- Votes policies
  DROP POLICY IF EXISTS "Users can view votes" ON post_votes;
  DROP POLICY IF EXISTS "Users can manage their own votes" ON post_votes;
  DROP POLICY IF EXISTS "Users can view comment votes" ON comment_votes;
  DROP POLICY IF EXISTS "Users can manage their own comment votes" ON comment_votes;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create or update tables
DO $$ BEGIN
  -- Posts table
  CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    tags text[] DEFAULT '{}',
    upvotes integer DEFAULT 0,
    downvotes integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Comments table
  CREATE TABLE IF NOT EXISTS comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
    upvotes integer DEFAULT 0,
    downvotes integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Post votes table
  CREATE TABLE IF NOT EXISTS post_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
  );

  -- Comment votes table
  CREATE TABLE IF NOT EXISTS comment_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(comment_id, user_id)
  );
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Create new policies
-- Posts policies
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND NOT is_locked)
  WITH CHECK (auth.uid() = author_id AND NOT is_locked);

CREATE POLICY "Admins can update any post"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    NOT EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_id AND is_locked
    )
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Votes policies
CREATE POLICY "Users can view votes"
  ON post_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own votes"
  ON post_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view comment votes"
  ON comment_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own comment votes"
  ON comment_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create or replace functions
CREATE OR REPLACE FUNCTION update_post_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
    ELSE
      UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_post_votes_trigger ON post_votes;
DROP TRIGGER IF EXISTS update_comment_votes_trigger ON comment_votes;

CREATE TRIGGER update_post_votes_trigger
AFTER INSERT OR DELETE ON post_votes
FOR EACH ROW
EXECUTE FUNCTION update_post_votes();

CREATE TRIGGER update_comment_votes_trigger
AFTER INSERT OR DELETE ON comment_votes
FOR EACH ROW
EXECUTE FUNCTION update_comment_votes();

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts(author_id);
  CREATE INDEX IF NOT EXISTS posts_category_id_idx ON posts(category_id);
  CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at);
  CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
  CREATE INDEX IF NOT EXISTS comments_author_id_idx ON comments(author_id);
  CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
  CREATE INDEX IF NOT EXISTS post_votes_post_id_user_id_idx ON post_votes(post_id, user_id);
  CREATE INDEX IF NOT EXISTS comment_votes_comment_id_user_id_idx ON comment_votes(comment_id, user_id);
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;