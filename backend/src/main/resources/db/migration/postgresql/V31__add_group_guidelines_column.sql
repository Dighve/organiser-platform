-- Add group_guidelines column to groups table
-- This column stores optional guidelines/rules for group members

ALTER TABLE groups ADD COLUMN group_guidelines TEXT;

-- Add comment for documentation
COMMENT ON COLUMN groups.group_guidelines IS 'Optional guidelines and rules for group members';
