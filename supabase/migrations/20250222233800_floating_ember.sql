-- Drop existing tables if they exist
DO $$ BEGIN
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS conversations CASCADE;
    DROP TABLE IF EXISTS community_comments CASCADE;
    DROP TABLE IF EXISTS community_posts CASCADE;
    DROP TABLE IF EXISTS community_members CASCADE;
    DROP TABLE IF EXISTS communities CASCADE;
    DROP TABLE IF EXISTS standup_tasks CASCADE;
    DROP TABLE IF EXISTS standup_entries CASCADE;
    DROP TABLE IF EXISTS company_documents CASCADE;
    DROP TABLE IF EXISTS company_members CASCADE;
    DROP TABLE IF EXISTS companies CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create profiles table first since other tables reference it
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'superadmin')),
  is_public boolean DEFAULT false,
  allows_messages boolean DEFAULT true,
  avatar_url text,
  professional_background text,
  skills text[],
  social_links jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  industries text[] DEFAULT '{}',
  website text,
  size text,
  stage text,
  business_model text,
  target_market text,
  is_public boolean DEFAULT false,
  logo_url text,
  social_links jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_members table
CREATE TABLE company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  title text,
  department text,
  invited_email text,
  invitation_token uuid,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create company_documents table
CREATE TABLE company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  size_bytes bigint,
  folder_path text DEFAULT '/',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_modified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  follow_up_questions jsonb,
  ai_insights jsonb DEFAULT '{
    "strengths": [],
    "areas_for_improvement": [],
    "opportunities": [],
    "risks": [],
    "recommendations": []
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create standup_tasks table
CREATE TABLE standup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standup_entry_id uuid REFERENCES standup_entries(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  category text NOT NULL DEFAULT 'personal',
  task_type text NOT NULL DEFAULT 'Other',
  estimated_hours numeric DEFAULT 1,
  due_date date NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  implementation_tips text[] DEFAULT '{}',
  potential_challenges text[] DEFAULT '{}',
  success_metrics text[] DEFAULT '{}',
  resources jsonb DEFAULT '[]',
  learning_resources jsonb DEFAULT '[]',
  tools jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_members table
CREATE TABLE community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_posts table
CREATE TABLE community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'discussion',
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_comments table
CREATE TABLE community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT participants_different CHECK (participant1_id != participant2_id),
  UNIQUE(participant1_id, participant2_id)
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
DO $$ BEGIN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE standup_entries ENABLE ROW LEVEL SECURITY;
    ALTER TABLE standup_tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
    ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create indexes after all tables are created
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
    CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_company_documents_company ON company_documents(company_id);
    CREATE INDEX IF NOT EXISTS idx_standup_entries_user ON standup_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_standup_tasks_entry ON standup_tasks(standup_entry_id);
    CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
    CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
    CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
    CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
EXCEPTION
    WHEN others THEN null;
END $$;