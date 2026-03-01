-- Fix VARCHAR(100) constraint on created_by field in agreement_versions table
-- This field stores admin audit messages that can exceed 100 chars when including 
-- admin email + change description

ALTER TABLE agreement_versions 
ALTER COLUMN created_by TYPE VARCHAR(500);

-- Add comment explaining the increased size
COMMENT ON COLUMN agreement_versions.created_by IS 'Admin audit trail: "Updated by admin: email - description" - increased to 500 chars to accommodate detailed change descriptions';
