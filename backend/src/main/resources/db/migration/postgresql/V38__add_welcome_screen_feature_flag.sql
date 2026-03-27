-- Add welcome screen feature flag
-- This allows admins to enable/disable the welcome screen for unauthenticated users

INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'WELCOME_SCREEN_ENABLED', 
    'Welcome Screen', 
    'Enables the welcome screen for unauthenticated users on the homepage. When disabled, users see the discover events view directly.', 
    true
);
