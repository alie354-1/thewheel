-- Create standup_entries table
CREATE TABLE standup_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  accomplished text NOT NULL,
  working_on text NOT NULL,
  blockers text,
  goals text NOT NULL,
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE standup_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own standup entries"
  ON standup_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own standup entries"
  ON standup_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own standup entries"
  ON standup_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_standup_entries_user_id ON standup_entries(user_id);
CREATE INDEX idx_standup_entries_date ON standup_entries(date);