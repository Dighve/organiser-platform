-- Add is_admin field to members table for admin dashboard access
ALTER TABLE members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for faster admin queries
CREATE INDEX idx_member_is_admin ON members(is_admin) WHERE is_admin = TRUE;

-- Optional: Set first user as admin (update with your admin email)
-- UPDATE members SET is_admin = TRUE WHERE email = 'admin@outmeets.com';
