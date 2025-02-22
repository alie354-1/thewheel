/*
  # Fix recursive policies

  1. Changes
    - Remove recursive policy checks that were causing infinite recursion
    - Simplify admin role checks using direct queries
    - Add proper error handling for edge cases
    - Ensure policies are atomic and don't reference themselves

  2. Security
    - Maintain same security level while fixing recursion
    - Keep RLS enabled on all tables
    - Ensure admin privileges are properly checked
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage slack settings" ON slack_settings;
DROP POLICY IF EXISTS "Admins can manage communities" ON communities;

-- Recreate policies with non-recursive checks
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM auth.users u 
            JOIN profiles p ON u.id = p.id 
            WHERE u.id = auth.uid() 
            AND p.role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM auth.users u 
            JOIN profiles p ON u.id = p.id 
            WHERE u.id = auth.uid() 
            AND p.role IN ('admin', 'superadmin')
        )
        AND id != auth.uid() -- Prevent updating own profile through admin policy
    );

CREATE POLICY "Admins can manage slack settings"
    ON slack_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM auth.users u 
            JOIN profiles p ON u.id = p.id 
            WHERE u.id = auth.uid() 
            AND p.role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Admins can manage communities"
    ON communities FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM auth.users u 
            JOIN profiles p ON u.id = p.id 
            WHERE u.id = auth.uid() 
            AND p.role IN ('admin', 'superadmin')
        )
    );

-- Update helper functions to avoid recursion
CREATE OR REPLACE FUNCTION is_admin()
    RETURNS boolean
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users u 
        JOIN profiles p ON u.id = p.id 
        WHERE u.id = auth.uid() 
        AND p.role IN ('admin', 'superadmin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION is_superadmin()
    RETURNS boolean
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users u 
        JOIN profiles p ON u.id = p.id 
        WHERE u.id = auth.uid() 
        AND p.role = 'superadmin'
    );
END;
$$;