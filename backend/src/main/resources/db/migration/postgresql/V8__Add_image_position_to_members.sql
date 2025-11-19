-- Add image_position column to members table for profile photo positioning
-- Stores JSON string with x and y coordinates (e.g., {"x": 50, "y": 50})

ALTER TABLE members
ADD COLUMN image_position VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN members.image_position IS 'Profile photo focal point position as JSON string: {"x": 50, "y": 50}';
