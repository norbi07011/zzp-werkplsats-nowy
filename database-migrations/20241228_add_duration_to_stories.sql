-- Migration: Add duration column to stories table
-- Date: 2024-12-28
-- Purpose: Allow users to choose story duration (15/30/45/60 seconds)

-- Add duration column to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 15;

-- Add check constraint to ensure valid duration values
ALTER TABLE stories
ADD CONSTRAINT stories_duration_check 
CHECK (duration IN (15, 30, 45, 60));

-- Add comment for documentation
COMMENT ON COLUMN stories.duration IS 'Story duration in seconds (15, 30, 45, or 60)';

-- Update existing stories to have default 15 seconds
UPDATE stories 
SET duration = 15 
WHERE duration IS NULL;
