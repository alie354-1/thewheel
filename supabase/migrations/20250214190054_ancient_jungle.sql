-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(participant1_id, participant2_id)
);

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Drop existing policies to prevent conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
  DROP POLICY IF EXISTS "Users can send messages" ON messages;
  DROP POLICY IF EXISTS "Users can update their own sent messages" ON messages;
  DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  USING (
    sender_id = auth.uid() OR
    recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

CREATE POLICY "Users can update their own sent messages"
  ON messages
  FOR UPDATE
  USING (
    sender_id = auth.uid()
  );

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  USING (
    participant1_id = auth.uid() OR
    participant2_id = auth.uid()
  );

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    participant1_id = auth.uid() OR
    participant2_id = auth.uid()
  );

CREATE POLICY "Users can update their conversations"
  ON conversations
  FOR UPDATE
  USING (
    participant1_id = auth.uid() OR
    participant2_id = auth.uid()
  );

-- Drop existing indexes to prevent conflicts
DO $$ BEGIN
  DROP INDEX IF EXISTS idx_messages_sender_id;
  DROP INDEX IF EXISTS idx_messages_recipient_id;
  DROP INDEX IF EXISTS idx_messages_created_at;
  DROP INDEX IF EXISTS idx_conversations_participant1_id;
  DROP INDEX IF EXISTS idx_conversations_participant2_id;
  DROP INDEX IF EXISTS idx_conversations_last_message_at;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2_id ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);