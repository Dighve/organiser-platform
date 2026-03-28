-- Add feature flag for admin control of email notifications
-- This allows admins to globally disable email notifications across the platform

INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'EMAIL_NOTIFICATIONS_ENABLED', 
    'Email Notifications', 
    'Enables email notifications for invitations and other platform events. When disabled, no emails will be sent regardless of user preferences.', 
    true
);
