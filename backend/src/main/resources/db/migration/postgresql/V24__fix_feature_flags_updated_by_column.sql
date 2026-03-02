-- Fix feature_flags.updated_by column type mismatch
-- Change from BIGINT (member ID) to VARCHAR(255) (admin email)
-- This resolves schema validation error on deployment

-- Drop foreign key constraint if it exists
ALTER TABLE feature_flags 
DROP CONSTRAINT IF EXISTS feature_flags_updated_by_fkey;

-- Change column type from BIGINT to VARCHAR(255)
ALTER TABLE feature_flags 
ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::VARCHAR;
