-- Update members table (PostgreSQL version)
-- Add missing columns
ALTER TABLE members
ADD COLUMN is_organiser BOOLEAN NOT NULL DEFAULT FALSE;
