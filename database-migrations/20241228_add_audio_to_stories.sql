-- Migration: Add audio_url column to stories table
-- Date: 2024-12-28
-- Purpose: Enable music/audio for Instagram-like stories

-- Add audio_url column to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN stories.audio_url IS 'URL to audio/music file for the story (optional)';

-- Update existing stories to have NULL audio_url (default)
UPDATE stories 
SET audio_url = NULL 
WHERE audio_url IS NULL;
