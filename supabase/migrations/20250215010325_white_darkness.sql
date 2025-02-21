-- Add answers column to standup_entries table
ALTER TABLE standup_entries
ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_standup_entries_answers ON standup_entries USING gin(answers);