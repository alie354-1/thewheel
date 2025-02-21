/*
  # Community Features: Message Board and Event Calendar

  1. New Tables
    - `community_posts`
      - Standard post fields (id, title, content, etc.)
      - Category and tags support
      - Voting and engagement tracking
      - Rich content support (markdown)
    
    - `community_comments`
      - Nested comments support
      - Voting system
    
    - `community_events`
      - Event details (title, description, date/time)
      - Location (virtual/physical)
      - Attendance tracking
      - Categories and tags
    
    - `community_event_attendees`
      - Track event attendance and RSVPs
    
  2. Security
    - RLS policies for all tables
    - Public/private event visibility
    - Comment moderation support
*/

-- Create enum for post types
CREATE TYPE post_type AS ENUM ('discussion', 'question', 'announcement', 'resource');

-- Create enum for event types
CREATE TYPE event_type AS ENUM ('virtual', 'in_person', 'hybrid');

-- Message Board: Posts
CREATE TABLE community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  post_type post_type NOT NULL DEFAULT 'discussion',
  category text,
  tags text[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Message Board: Comments
CREATE TABLE community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Message Board: Post Votes
CREATE TABLE community_post_votes (
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type boolean NOT NULL, -- true = upvote, false = downvote
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Message Board: Comment Votes
CREATE TABLE community_comment_votes (
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type boolean NOT NULL, -- true = upvote, false = downvote
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- Events Calendar: Events
CREATE TABLE community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL DEFAULT 'virtual',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  location text,
  virtual_meeting_url text,
  category text,
  tags text[] DEFAULT '{}',
  max_attendees integer,
  is_private boolean DEFAULT false,
  requires_approval boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_duration CHECK (end_time > start_time)
);

-- Events Calendar: Attendees
CREATE TABLE community_event_attendees (
  event_id uuid REFERENCES community_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'waitlisted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_attendees ENABLE ROW LEVEL SECURITY;

-- Post Policies
CREATE POLICY "Anyone can view posts"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own posts"
  ON community_posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Only admins can delete posts"
  ON community_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Comment Policies
CREATE POLICY "Anyone can view comments"
  ON community_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON community_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments"
  ON community_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Only admins can delete comments"
  ON community_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Vote Policies
CREATE POLICY "Anyone can view votes"
  ON community_post_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON community_post_votes
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view comment votes"
  ON community_comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on comments"
  ON community_comment_votes
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Event Policies
CREATE POLICY "Users can view public events"
  ON community_events FOR SELECT
  USING (
    is_private = false OR
    organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_event_attendees
      WHERE event_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create events"
  ON community_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizers can update their events"
  ON community_events FOR UPDATE
  USING (organizer_id = auth.uid());

CREATE POLICY "Only admins can delete events"
  ON community_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Attendee Policies
CREATE POLICY "Users can view event attendees"
  ON community_event_attendees FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can register for events"
  ON community_event_attendees
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own attendance"
  ON community_event_attendees
  FOR UPDATE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_created ON community_posts(created_at);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_tags ON community_posts USING gin(tags);

CREATE INDEX idx_community_comments_post ON community_comments(post_id);
CREATE INDEX idx_community_comments_author ON community_comments(author_id);
CREATE INDEX idx_community_comments_parent ON community_comments(parent_id);

CREATE INDEX idx_community_events_organizer ON community_events(organizer_id);
CREATE INDEX idx_community_events_start ON community_events(start_time);
CREATE INDEX idx_community_events_category ON community_events(category);
CREATE INDEX idx_community_events_tags ON community_events USING gin(tags);

-- Functions
CREATE OR REPLACE FUNCTION update_post_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type THEN 1 ELSE 0 END,
      downvotes = downvotes + CASE WHEN NOT NEW.vote_type THEN 1 ELSE 0 END
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET 
      upvotes = upvotes - CASE WHEN OLD.vote_type THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN NOT OLD.vote_type THEN 1 ELSE 0 END
    WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE community_posts
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type THEN 1 ELSE -1 END,
      downvotes = downvotes + CASE WHEN NOT NEW.vote_type THEN 1 ELSE -1 END
    WHERE id = NEW.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_comments
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type THEN 1 ELSE 0 END,
      downvotes = downvotes + CASE WHEN NOT NEW.vote_type THEN 1 ELSE 0 END
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments
    SET 
      upvotes = upvotes - CASE WHEN OLD.vote_type THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN NOT OLD.vote_type THEN 1 ELSE 0 END
    WHERE id = OLD.comment_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE community_comments
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type THEN 1 ELSE -1 END,
      downvotes = downvotes + CASE WHEN NOT NEW.vote_type THEN 1 ELSE -1 END
    WHERE id = NEW.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER update_post_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON community_post_votes
FOR EACH ROW EXECUTE FUNCTION update_post_votes();

CREATE TRIGGER update_comment_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON community_comment_votes
FOR EACH ROW EXECUTE FUNCTION update_comment_votes();