-- Migration: Add RLS policies for regular_users table
-- Date: 2024-12-09
-- Description: Enable Row Level Security for regular_users with policies allowing users to access their own data

-- Enable RLS on regular_users table (if not already enabled)
ALTER TABLE regular_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own regular_users record
CREATE POLICY "Users can view own regular_users data"
ON regular_users
FOR SELECT
USING (auth.uid() = profile_id);

-- Policy: Users can update their own regular_users record
CREATE POLICY "Users can update own regular_users data"
ON regular_users
FOR UPDATE
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can insert their own regular_users record (during registration)
CREATE POLICY "Users can insert own regular_users data"
ON regular_users
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access to regular_users"
ON regular_users
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON regular_users TO authenticated;
GRANT ALL ON regular_users TO service_role;

-- Verify policies
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for regular_users table created successfully';
END $$;
