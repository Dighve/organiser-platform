-- Update members table.
-- Add missing columns
ALTER TABLE members
ADD COLUMN is_organiser BOOLEAN NOT NULL DEFAULT FALSE;
