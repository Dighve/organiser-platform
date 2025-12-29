-- Migration: Rename is_organiser column to has_organiser_role for clarity
-- This separates the concept of platform-level organiser role from group/event organiser relationships

-- Rename the column
ALTER TABLE members RENAME COLUMN is_organiser TO has_organiser_role;

-- Update the comment for clarity
COMMENT ON COLUMN members.has_organiser_role IS 'Platform-level organiser role - indicates member has organiser capabilities (different from being organiser of a specific group/event)';
