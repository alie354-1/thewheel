/*
  # Community Message Board Schema

  1. New Tables
    - posts
      - id (uuid, primary key)
      - author_id (uuid, references auth.users)
      - title (text)
      - content (text)
      - category_id (uuid)
      - tags (text[])
      - upvotes (int)
      - downvotes (int)
      - is_pinned (boolean)
      - is_locked (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - comments
      - id (uuid, primary key)
      - post_id (uuid, references posts)
      - author_id (uuid, references auth.users)
      - content (text)
      - parent_id (uuid, self-reference for nested comments)
      - upvotes (int)
      - downvotes (int)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - categories
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - slug (text)
      - color (text)
      - icon (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - post_votes
      - id (uuid, primary key)
      - post_id (uuid, references posts)
      - user_id (uuid, references auth.users)
      - vote_type (text: 'up' or 'down')
      - created_at (timestamptz)
    
    - comment_votes
      - id (uuid, primary key)
      - comment_id (uuid, references comments)
      - user_id (uuid, references auth.users)
      - vote_type (text: 'up' or 'down')
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated user actions
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  color text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create post_votes table
CREATE TABLE post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment_votes table
CREATE TABLE comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

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

-- Create indexes
CREATE INDEX posts_author_id_idx ON posts(author_id);
CREATE INDEX posts_category_id_idx ON posts(category_id);
CREATE INDEX posts_created_at_idx ON posts(created_at);
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_author_id_idx ON comments(author_id);
CREATE INDEX comments_parent_id_idx ON comments(parent_id);
CREATE INDEX post_votes_post_id_user_id_idx ON post_votes(post_id, user_id);
CREATE INDEX comment_votes_comment_id_user_id_idx ON comment_votes(comment_id, user_id);

-- Insert default categories
INSERT INTO categories (name, description, slug, color, icon) VALUES
  ('General Discussion', 'General startup and entrepreneurship discussions', 'general', '#6366F1', 'MessageSquare'),
  ('Technical', 'Technical discussions and questions', 'technical', '#EC4899', 'Code'),
  ('Marketing', 'Marketing strategies and tips', 'marketing', '#10B981', 'TrendingUp'),
  ('Funding', 'Fundraising and investment discussions', 'funding', '#F59E0B', 'DollarSign'),
  ('Product', 'Product development and management', 'product', '#3B82F6', 'Box'),
  ('Design', 'Design and UX discussions', 'design', '#8B5CF6', 'Palette'),
  ('Legal', 'Legal advice and discussions', 'legal', '#EF4444', 'Scale'),
  ('Hiring', 'Hiring and team building', 'hiring', '#14B8A6', 'Users')
ON CONFLICT (slug) DO NOTHING;

-- Functions
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

-- Triggers
CREATE TRIGGER update_post_votes_trigger
AFTER INSERT OR DELETE ON post_votes
FOR EACH ROW
EXECUTE FUNCTION update_post_votes();

CREATE TRIGGER update_comment_votes_trigger
AFTER INSERT OR DELETE ON comment_votes
FOR EACH ROW
EXECUTE FUNCTION update_comment_votes();