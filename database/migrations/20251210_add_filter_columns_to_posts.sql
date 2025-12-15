-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Migration: Add filter columns to posts table                        ║
-- ║  Date: 2025-12-10                                                    ║
-- ║  Purpose: Add location, category, budget for advanced filtering      ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Add filter columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS budget NUMERIC(10, 2);

-- Create indexes for better filter performance
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_budget ON posts(budget);

-- Create composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_posts_filters ON posts(location, category, budget);

-- Add comment
COMMENT ON COLUMN posts.location IS 'Miasto (Amsterdam, Rotterdam, etc.) - dla filtrowania geograficznego';
COMMENT ON COLUMN posts.category IS 'Kategoria branżowa (Budowa, IT, Hydraulika, etc.) - dla filtrowania tematycznego';
COMMENT ON COLUMN posts.budget IS 'Budżet/cena w EUR - dla filtrowania cenowego';
