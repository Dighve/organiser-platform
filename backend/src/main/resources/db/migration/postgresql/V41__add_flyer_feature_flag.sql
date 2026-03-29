-- Add feature flag for admin control of event flyer generation and sharing
-- When disabled, the "Share as Flyer" option is hidden from all share menus

INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'FLYER_ENABLED', 
    'Event Flyer Sharing', 
    'Enables event flyer generation and sharing (Story/Post formats). All processing is client-side so there is no server cost. Disable only if needed for policy reasons.',
    true
);
