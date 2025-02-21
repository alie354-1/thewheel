-- Create pitch deck collaborators table
CREATE TABLE pitch_deck_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES pitch_decks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(deck_id, user_id)
);

-- Create pitch deck comments table
CREATE TABLE pitch_deck_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES pitch_decks(id) ON DELETE CASCADE,
  slide_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  parent_id uuid REFERENCES pitch_deck_comments(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pitch deck versions table
CREATE TABLE pitch_deck_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES pitch_decks(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  slides jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pitch_deck_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_deck_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_deck_versions ENABLE ROW LEVEL SECURITY;

-- Add is_public column to pitch_decks
ALTER TABLE pitch_decks
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create policies for collaborators
CREATE POLICY "Users can view decks they collaborate on"
  ON pitch_decks
  FOR SELECT
  USING (
    is_public OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM pitch_deck_collaborators
      WHERE deck_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can update decks"
  ON pitch_decks
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM pitch_deck_collaborators
      WHERE deck_id = id
      AND user_id = auth.uid()
      AND role = 'editor'
    )
  );

-- Collaborator policies
CREATE POLICY "Deck owners can manage collaborators"
  ON pitch_deck_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view collaborators"
  ON pitch_deck_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id
      AND (
        user_id = auth.uid() OR
        is_public OR
        EXISTS (
          SELECT 1 FROM pitch_deck_collaborators
          WHERE deck_id = pitch_decks.id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Comment policies
CREATE POLICY "Users can view comments on accessible decks"
  ON pitch_deck_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id
      AND (
        user_id = auth.uid() OR
        is_public OR
        EXISTS (
          SELECT 1 FROM pitch_deck_collaborators
          WHERE deck_id = pitch_decks.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add comments to accessible decks"
  ON pitch_deck_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM pitch_deck_collaborators
          WHERE deck_id = pitch_decks.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON pitch_deck_comments
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id
      AND user_id = auth.uid()
    )
  );

-- Version policies
CREATE POLICY "Users can view versions of accessible decks"
  ON pitch_deck_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id
      AND (
        user_id = auth.uid() OR
        is_public OR
        EXISTS (
          SELECT 1 FROM pitch_deck_collaborators
          WHERE deck_id = pitch_decks.id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Create indexes
CREATE INDEX idx_pitch_deck_collaborators_deck ON pitch_deck_collaborators(deck_id);
CREATE INDEX idx_pitch_deck_collaborators_user ON pitch_deck_collaborators(user_id);
CREATE INDEX idx_pitch_deck_comments_deck ON pitch_deck_comments(deck_id);
CREATE INDEX idx_pitch_deck_comments_slide ON pitch_deck_comments(slide_id);
CREATE INDEX idx_pitch_deck_comments_user ON pitch_deck_comments(user_id);
CREATE INDEX idx_pitch_deck_versions_deck ON pitch_deck_versions(deck_id);

-- Create function to track versions
CREATE OR REPLACE FUNCTION track_pitch_deck_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slides != NEW.slides THEN
    INSERT INTO pitch_deck_versions (
      deck_id,
      version_number,
      slides,
      created_by
    ) VALUES (
      NEW.id,
      COALESCE(
        (
          SELECT MAX(version_number) + 1
          FROM pitch_deck_versions
          WHERE deck_id = NEW.id
        ),
        1
      ),
      NEW.slides,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for version tracking
DROP TRIGGER IF EXISTS track_pitch_deck_version ON pitch_decks;
CREATE TRIGGER track_pitch_deck_version
  AFTER UPDATE ON pitch_decks
  FOR EACH ROW
  EXECUTE FUNCTION track_pitch_deck_version();