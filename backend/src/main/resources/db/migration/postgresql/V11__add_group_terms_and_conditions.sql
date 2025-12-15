-- Add terms and conditions field to groups table
ALTER TABLE groups
ADD COLUMN terms_and_conditions TEXT;

-- Add comment for documentation
COMMENT ON COLUMN groups.terms_and_conditions IS 'Custom terms and conditions set by the group organiser that members must accept when joining events';
