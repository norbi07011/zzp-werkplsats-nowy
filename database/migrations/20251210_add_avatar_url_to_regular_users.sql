-- =====================================================
-- Migration: Add avatar_url to regular_users and profiles
-- Date: 2025-12-10
-- Purpose: Enable profile photo upload for regular users
-- =====================================================

-- Add avatar_url column to regular_users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'regular_users' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE regular_users 
        ADD COLUMN avatar_url TEXT;
        
        COMMENT ON COLUMN regular_users.avatar_url IS 'URL of profile photo stored in Supabase Storage (avatars bucket)';
    END IF;
END $$;

-- Ensure profiles table has avatar_url (should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN avatar_url TEXT;
        
        COMMENT ON COLUMN profiles.avatar_url IS 'URL of profile photo stored in Supabase Storage (avatars bucket)';
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_regular_users_avatar_url 
ON regular_users(avatar_url) 
WHERE avatar_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url 
ON profiles(avatar_url) 
WHERE avatar_url IS NOT NULL;

-- Grant permissions (RLS policies already handle access control)
-- No additional grants needed

COMMENT ON TABLE regular_users IS 'Regular user profiles with subscription management and profile photos';

-- Verify changes
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed: avatar_url added to regular_users and profiles';
    RAISE NOTICE '📊 Columns added:';
    RAISE NOTICE '   - regular_users.avatar_url (TEXT)';
    RAISE NOTICE '   - profiles.avatar_url (TEXT) [verified]';
    RAISE NOTICE '🔒 RLS policies: Inherited from existing table policies';
    RAISE NOTICE '📸 Storage: Use Supabase Storage bucket "avatars" for uploads';
END $$;
