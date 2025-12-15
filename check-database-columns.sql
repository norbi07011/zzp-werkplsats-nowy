-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  DIAGNOSTIC: Check if filter columns exist in posts table           ║
-- ║  Run this in Supabase SQL Editor to verify migration status         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 1. Check if location, category, budget columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name IN ('location', 'category', 'budget')
ORDER BY column_name;

-- 2. Check ALL posts table columns
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 3. Check if indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'posts'
AND indexname LIKE '%location%' 
   OR indexname LIKE '%category%' 
   OR indexname LIKE '%budget%';

-- 4. Check if post_likes table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'post_likes'
) AS post_likes_exists;

-- 5. Check if post_comments table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'post_comments'
) AS post_comments_exists;
