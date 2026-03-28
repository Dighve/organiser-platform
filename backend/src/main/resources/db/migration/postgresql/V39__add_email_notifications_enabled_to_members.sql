-- Add email_notifications_enabled column to members table
ALTER TABLE members
ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN members.email_notifications_enabled IS 'Whether the member has enabled email notifications for invitations and other events';
