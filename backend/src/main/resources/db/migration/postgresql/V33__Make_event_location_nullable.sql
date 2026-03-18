-- Make location column nullable in events table to support EVENT_LOCATION_ENABLED feature flag
-- When EVENT_LOCATION_ENABLED is false, events can be created without a location

ALTER TABLE events ALTER COLUMN location DROP NOT NULL;
