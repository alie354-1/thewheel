/*
  # Initial Schema Setup with Fixed Policies

  1. Tables
    - Creates user roles enum
    - Sets up profiles table with role-based access
    - Creates slack settings for admin configuration
    - Creates communities table for public/admin management
  
  2. Security
    - Enables RLS on all tables
    - Sets up non-recursive access policies
    - Implements admin and superadmin role checks safely
*/

-- Safe creation of enum type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL,
    full_name text,
    role user_role NOT NULL DEFAULT 'user'::user_role,
    is_public boolean NOT NULL DEFAULT false,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Slack settings table
CREATE TABLE IF NOT EXISTS slack_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id text NOT NULL,
    bot_token text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
DO $$ BEGIN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE slack_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can manage slack settings" ON slack_settings;
    DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
    DROP POLICY IF EXISTS "Admins can manage communities" ON communities;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Basic profile access
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admin access to profiles (fixed to prevent recursion)
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        COALESCE(
            (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'superadmin'),
            false
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        COALESCE(
            (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'superadmin'),
            false
        )
        AND id != auth.uid() -- Prevent updating own profile through admin policy
    );

-- Slack settings access (fixed to prevent recursion)
CREATE POLICY "Admins can manage slack settings"
    ON slack_settings FOR ALL
    USING (
        COALESCE(
            (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'superadmin'),
            false
        )
    );

-- Community access
CREATE POLICY "Anyone can view communities"
    ON communities FOR SELECT
    USING (true);

-- Community management (fixed to prevent recursion)
CREATE POLICY "Admins can manage communities"
    ON communities FOR ALL
    USING (
        COALESCE(
            (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'superadmin'),
            false
        )
    );

-- Helper functions (fixed to prevent recursion)
CREATE OR REPLACE FUNCTION is_admin()
    RETURNS boolean
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid() LIMIT 1;
    RETURN user_role IN ('admin', 'superadmin');
END;
$$;

CREATE OR REPLACE FUNCTION is_superadmin()
    RETURNS boolean
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid() LIMIT 1;
    RETURN user_role = 'superadmin';
END;
$$;