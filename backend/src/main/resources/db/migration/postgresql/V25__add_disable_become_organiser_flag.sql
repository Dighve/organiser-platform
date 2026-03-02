-- Add feature flag to control visibility of the "Become Organiser" button

INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled)
VALUES (
  'DISABLE_BECOME_ORGANISER_BUTTON',
  'Disable Become Organiser button',
  'Hide the Become Organiser call-to-action for all non-organiser users.',
  false
)
ON CONFLICT (flag_key) DO NOTHING;
