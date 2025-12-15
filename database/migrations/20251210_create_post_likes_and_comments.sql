-- ================================================
-- MIGRATION: Create post_likes and post_comments tables
-- Date: 2024-12-10
-- Purpose: Fix 406 errors - missing post_likes/post_comments tables
-- ================================================

-- ==========================================
-- 1. CREATE post_likes TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- For accountant/employer IDs
    user_type TEXT NOT NULL CHECK (user_type IN ('employer', 'worker', 'accountant', 'regular_user', 'admin', 'cleaning_company')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint: one like per user per post
    UNIQUE(post_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_profile_id ON post_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

-- ==========================================
-- 2. CREATE post_comments TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL CHECK (author_type IN ('employer', 'worker', 'accountant', 'regular_user', 'admin', 'cleaning_company')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    
    -- Validation
    CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- ==========================================
-- 3. RLS POLICIES FOR post_likes
-- ==========================================

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read likes (public feed)
DROP POLICY IF EXISTS "Anyone can view post likes" ON post_likes;
CREATE POLICY "Anyone can view post likes" ON post_likes
    FOR SELECT USING (true);

-- Allow authenticated users to like posts
DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
CREATE POLICY "Authenticated users can like posts" ON post_likes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Allow users to unlike their own likes
DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;
CREATE POLICY "Users can delete their own likes" ON post_likes
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Admin bypass
DROP POLICY IF EXISTS "Admin can manage all likes" ON post_likes;
CREATE POLICY "Admin can manage all likes" ON post_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ==========================================
-- 4. RLS POLICIES FOR post_comments
-- ==========================================

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments (public feed)
DROP POLICY IF EXISTS "Anyone can view post comments" ON post_comments;
CREATE POLICY "Anyone can view post comments" ON post_comments
    FOR SELECT USING (true);

-- Allow authenticated users to comment
DROP POLICY IF EXISTS "Authenticated users can comment" ON post_comments;
CREATE POLICY "Authenticated users can comment" ON post_comments
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
    );

-- Allow users to update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
CREATE POLICY "Users can update their own comments" ON post_comments
    FOR UPDATE USING (
        auth.uid() = author_id
    );

-- Allow users to delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;
CREATE POLICY "Users can delete their own comments" ON post_comments
    FOR DELETE USING (
        auth.uid() = author_id
    );

-- Admin bypass
DROP POLICY IF EXISTS "Admin can manage all comments" ON post_comments;
CREATE POLICY "Admin can manage all comments" ON post_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ==========================================
-- 5. CREATE RPC FUNCTIONS FOR LIKE COUNTS
-- ==========================================

-- Increment post likes count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts 
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement post likes count
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment post comments count
CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts 
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement post comments count
CREATE OR REPLACE FUNCTION decrement_post_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE posts 
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. CREATE TRIGGERS FOR AUTOMATIC COUNTS
-- ==========================================

-- Trigger for like count on INSERT
CREATE OR REPLACE FUNCTION trigger_increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM increment_post_likes(NEW.post_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_like_insert ON post_likes;
CREATE TRIGGER on_post_like_insert
    AFTER INSERT ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_increment_post_likes();

-- Trigger for like count on DELETE
CREATE OR REPLACE FUNCTION trigger_decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM decrement_post_likes(OLD.post_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_like_delete ON post_likes;
CREATE TRIGGER on_post_like_delete
    AFTER DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_decrement_post_likes();

-- Trigger for comment count on INSERT
CREATE OR REPLACE FUNCTION trigger_increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM increment_post_comments(NEW.post_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_comment_insert ON post_comments;
CREATE TRIGGER on_post_comment_insert
    AFTER INSERT ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_increment_post_comments();

-- Trigger for comment count on DELETE
CREATE OR REPLACE FUNCTION trigger_decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM decrement_post_comments(OLD.post_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_comment_delete ON post_comments;
CREATE TRIGGER on_post_comment_delete
    AFTER DELETE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_decrement_post_comments();

-- ==========================================
-- 7. VERIFY INSTALLATION
-- ==========================================

DO $$
BEGIN
    -- Check post_likes table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_likes') THEN
        RAISE NOTICE '✅ post_likes table created successfully';
    ELSE
        RAISE EXCEPTION '❌ post_likes table creation failed!';
    END IF;

    -- Check post_comments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_comments') THEN
        RAISE NOTICE '✅ post_comments table created successfully';
    ELSE
        RAISE EXCEPTION '❌ post_comments table creation failed!';
    END IF;

    RAISE NOTICE '✅ Migration completed successfully!';
END $$;
