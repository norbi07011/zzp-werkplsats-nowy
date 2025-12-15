-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║           🚀 COMPLETE FEED MIGRATION - ALL IN ONE                        ║
-- ║                                                                          ║
-- ║  Date: 2024-12-10                                                        ║
-- ║  Purpose: Fix ALL missing tables and columns for feed functionality     ║
-- ║                                                                          ║
-- ║  This migration includes:                                                ║
-- ║  1. ✅ Add location, category, budget to posts table                    ║
-- ║  2. ✅ Create post_likes table                                          ║
-- ║  3. ✅ Create post_comments table                                       ║
-- ║  4. ✅ RLS policies for all tables                                      ║
-- ║  5. ✅ Automatic count triggers                                         ║
-- ║  6. ✅ Indexes for performance                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ==========================================
-- PART 1: ADD FILTER COLUMNS TO POSTS
-- ==========================================

DO $$ 
BEGIN
    -- Check if columns already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'location'
    ) THEN
        ALTER TABLE posts ADD COLUMN location VARCHAR(100);
        RAISE NOTICE '✅ Added location column to posts';
    ELSE
        RAISE NOTICE '⚠️  location column already exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'category'
    ) THEN
        ALTER TABLE posts ADD COLUMN category VARCHAR(100);
        RAISE NOTICE '✅ Added category column to posts';
    ELSE
        RAISE NOTICE '⚠️  category column already exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'budget'
    ) THEN
        ALTER TABLE posts ADD COLUMN budget NUMERIC(10,2);
        RAISE NOTICE '✅ Added budget column to posts';
    ELSE
        RAISE NOTICE '⚠️  budget column already exists';
    END IF;
END $$;

-- Create indexes for filter columns
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_budget ON posts(budget);
CREATE INDEX IF NOT EXISTS idx_posts_filters ON posts(location, category, budget);

RAISE NOTICE '✅ Filter column indexes created';

-- ==========================================
-- PART 2: CREATE post_likes TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('employer', 'worker', 'accountant', 'regular_user', 'admin', 'cleaning_company')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_profile_id ON post_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

RAISE NOTICE '✅ post_likes table created';

-- ==========================================
-- PART 3: CREATE post_comments TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    author_type TEXT NOT NULL CHECK (author_type IN ('employer', 'worker', 'accountant', 'regular_user', 'admin', 'cleaning_company')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

RAISE NOTICE '✅ post_comments table created';

-- ==========================================
-- PART 4: RLS POLICIES FOR post_likes
-- ==========================================

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view post likes" ON post_likes;
CREATE POLICY "Anyone can view post likes" ON post_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
CREATE POLICY "Authenticated users can like posts" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;
CREATE POLICY "Users can delete their own likes" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage all likes" ON post_likes;
CREATE POLICY "Admin can manage all likes" ON post_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

RAISE NOTICE '✅ post_likes RLS policies created';

-- ==========================================
-- PART 5: RLS POLICIES FOR post_comments
-- ==========================================

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view post comments" ON post_comments;
CREATE POLICY "Anyone can view post comments" ON post_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON post_comments;
CREATE POLICY "Authenticated users can comment" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
CREATE POLICY "Users can update their own comments" ON post_comments
    FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;
CREATE POLICY "Users can delete their own comments" ON post_comments
    FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admin can manage all comments" ON post_comments;
CREATE POLICY "Admin can manage all comments" ON post_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

RAISE NOTICE '✅ post_comments RLS policies created';

-- ==========================================
-- PART 6: RPC FUNCTIONS FOR COUNTS
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

RAISE NOTICE '✅ RPC functions created';

-- ==========================================
-- PART 7: TRIGGERS FOR AUTO COUNTS
-- ==========================================

-- Trigger functions
CREATE OR REPLACE FUNCTION trigger_increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM increment_post_likes(NEW.post_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM decrement_post_likes(OLD.post_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM increment_post_comments(NEW.post_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM decrement_post_comments(OLD.post_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS on_post_like_insert ON post_likes;
CREATE TRIGGER on_post_like_insert
    AFTER INSERT ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_increment_post_likes();

DROP TRIGGER IF EXISTS on_post_like_delete ON post_likes;
CREATE TRIGGER on_post_like_delete
    AFTER DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_decrement_post_likes();

DROP TRIGGER IF EXISTS on_post_comment_insert ON post_comments;
CREATE TRIGGER on_post_comment_insert
    AFTER INSERT ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_increment_post_comments();

DROP TRIGGER IF EXISTS on_post_comment_delete ON post_comments;
CREATE TRIGGER on_post_comment_delete
    AFTER DELETE ON post_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_decrement_post_comments();

RAISE NOTICE '✅ Triggers created';

-- ==========================================
-- PART 8: FINAL VERIFICATION
-- ==========================================

DO $$
DECLARE
    location_exists BOOLEAN;
    category_exists BOOLEAN;
    budget_exists BOOLEAN;
    post_likes_exists BOOLEAN;
    post_comments_exists BOOLEAN;
BEGIN
    -- Check filter columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'location'
    ) INTO location_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'category'
    ) INTO category_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'budget'
    ) INTO budget_exists;

    -- Check tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'post_likes'
    ) INTO post_likes_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'post_comments'
    ) INTO post_comments_exists;

    -- Results
    RAISE NOTICE '========================================';
    RAISE NOTICE '    MIGRATION VERIFICATION RESULTS';
    RAISE NOTICE '========================================';
    
    IF location_exists THEN
        RAISE NOTICE '✅ posts.location column: EXISTS';
    ELSE
        RAISE EXCEPTION '❌ posts.location column: MISSING';
    END IF;

    IF category_exists THEN
        RAISE NOTICE '✅ posts.category column: EXISTS';
    ELSE
        RAISE EXCEPTION '❌ posts.category column: MISSING';
    END IF;

    IF budget_exists THEN
        RAISE NOTICE '✅ posts.budget column: EXISTS';
    ELSE
        RAISE EXCEPTION '❌ posts.budget column: MISSING';
    END IF;

    IF post_likes_exists THEN
        RAISE NOTICE '✅ post_likes table: EXISTS';
    ELSE
        RAISE EXCEPTION '❌ post_likes table: MISSING';
    END IF;

    IF post_comments_exists THEN
        RAISE NOTICE '✅ post_comments table: EXISTS';
    ELSE
        RAISE EXCEPTION '❌ post_comments table: MISSING';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅✅✅ ALL MIGRATIONS COMPLETED! ✅✅✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Reload application: Ctrl+F5';
    RAISE NOTICE '2. Test creating posts with filters';
    RAISE NOTICE '3. Test liking posts (406 errors should be gone)';
    RAISE NOTICE '4. Test filtering by city/category/budget';
    RAISE NOTICE '';
END $$;
