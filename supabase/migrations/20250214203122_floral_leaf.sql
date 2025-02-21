/*
  # Fix Voting Functions

  1. Changes
    - Update vote counting functions to properly handle UUIDs
    - Fix type comparison issues in voting triggers
    
  2. Security
    - Maintain SECURITY DEFINER setting
*/

-- Drop existing functions and triggers first
DROP FUNCTION IF EXISTS update_post_votes() CASCADE;
DROP FUNCTION IF EXISTS update_comment_votes() CASCADE;

-- Create updated functions with proper UUID handling
CREATE OR REPLACE FUNCTION update_post_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type THEN 1 ELSE 0 END,
      downvotes = downvotes + CASE WHEN NOT NEW.vote_type THEN 1 ELSE 0 END
    WHERE id::text = NEW.post_id::text;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET 
      upvotes = upvotes - CASE WHEN OLD.vote_type THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN NOT OLD.vote_type THEN 1 ELSE 0 END
    WHERE id::text = OLD.post_id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE community_posts
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type THEN 1 ELSE -1 END,
      downvotes = downvotes + CASE WHEN NOT NEW.vote_type THEN 1 ELSE -1 END
    WHERE id::text = NEW.post_id::text;
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
    WHERE id::text = NEW.comment_id::text;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments
    SET 
      upvotes = upvotes - CASE WHEN OLD.vote_type THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN NOT OLD.vote_type THEN 1 ELSE 0 END
    WHERE id::text = OLD.comment_id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE community_comments
    SET 
      upvotes = upvotes + CASE WHEN NEW.vote_type THEN 1 ELSE -1 END,
      downvotes = downvotes + CASE WHEN NOT NEW.vote_type THEN 1 ELSE -1 END
    WHERE id::text = NEW.comment_id::text;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER update_post_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON community_post_votes
FOR EACH ROW EXECUTE FUNCTION update_post_votes();

CREATE TRIGGER update_comment_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON community_comment_votes
FOR EACH ROW EXECUTE FUNCTION update_comment_votes();