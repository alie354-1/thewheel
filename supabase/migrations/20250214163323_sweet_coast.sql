/*
  # Create companies table and relationships

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users)
      - `name` (text)
      - `industry` (text, nullable)
      - `website` (text, nullable)
      - `size` (text, nullable)
      - `stage` (text, nullable)
      - `founded_year` (integer, nullable)
      - `business_model` (text, nullable)
      - `target_market` (text, nullable)
      - `description` (text, nullable)
      - `mission` (text, nullable)
      - `is_public` (boolean)
      - `logo_url` (text, nullable)
      - `social_links` (jsonb, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for company owners and admins
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS companies CASCADE;

-- Create companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  industry text,
  website text,
  size text,
  stage text,
  founded_year integer,
  business_model text,
  target_market text,
  description text,
  mission text,
  is_public boolean DEFAULT false,
  logo_url text,
  social_links jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can create their own companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON companies;
DROP POLICY IF EXISTS "Public companies are viewable by everyone" ON companies;

-- Create policies
CREATE POLICY "Users can view their own companies"
  ON companies
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own companies"
  ON companies
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own companies"
  ON companies
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own companies"
  ON companies
  FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Public companies are viewable by everyone"
  ON companies
  FOR SELECT
  USING (is_public = true);

-- Create indexes
DROP INDEX IF EXISTS companies_owner_id_idx;
DROP INDEX IF EXISTS companies_is_public_idx;

CREATE INDEX companies_owner_id_idx ON companies(owner_id);
CREATE INDEX companies_is_public_idx ON companies(is_public);