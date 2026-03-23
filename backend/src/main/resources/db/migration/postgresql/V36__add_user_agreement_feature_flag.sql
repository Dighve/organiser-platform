-- Add USER_AGREEMENT_ENABLED feature flag
-- When disabled, users skip the user agreement modal and are directly joined

INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled)
VALUES (
    'USER_AGREEMENT_ENABLED',
    'User Agreement Modal',
    'When enabled, new users must accept the user agreement before accessing the platform. When disabled, users skip the agreement modal and are directly joined.',
    true
)
ON CONFLICT (flag_key) DO NOTHING;
