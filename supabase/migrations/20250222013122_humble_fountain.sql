-- Drop existing policies first
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view decks they collaborate on" ON pitch_decks;
  DROP POLICY IF EXISTS "Users can create decks" ON pitch_decks;
  DROP POLICY IF EXISTS "Editors can update decks" ON pitch_decks;
  DROP POLICY IF EXISTS "Users can delete their own decks" ON pitch_decks;
  DROP POLICY IF EXISTS "Deck owners can manage collaborators" ON pitch_deck_collaborators;
  DROP POLICY IF EXISTS "Users can view collaborators" ON pitch_deck_collaborators;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create simplified policies without recursion
CREATE POLICY "deck_select_policy"
  ON pitch_decks
  FOR SELECT
  USING (
    is_public OR 
    user_id = auth.uid()
  );

CREATE POLICY "deck_insert_policy"
  ON pitch_decks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "deck_update_policy"
  ON pitch_decks
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "deck_delete_policy"
  ON pitch_decks
  FOR DELETE
  USING (user_id = auth.uid());

-- Drop collaborator policies since we're not using them
DROP POLICY IF EXISTS "Deck owners can manage collaborators" ON pitch_deck_collaborators;
DROP POLICY IF EXISTS "Users can view collaborators" ON pitch_deck_collaborators;