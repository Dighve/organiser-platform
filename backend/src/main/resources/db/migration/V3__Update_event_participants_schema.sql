-- Update event_participants table to match EventParticipant entity

-- Add missing columns
ALTER TABLE event_participants
    ADD COLUMN notes TEXT NULL AFTER status,
    ADD COLUMN registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER notes,
    ADD COLUMN registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER registration_date,
    ADD COLUMN cancelled_at TIMESTAMP NULL AFTER registered_at,
    ADD COLUMN attended BOOLEAN NULL AFTER cancelled_at;

-- Remove the role column as it's not in the entity
ALTER TABLE event_participants
    DROP COLUMN role;

-- Update existing records to set registration_date and registered_at from created_at
UPDATE event_participants 
SET registration_date = created_at,
    registered_at = created_at
WHERE registration_date IS NULL OR registered_at IS NULL;

-- Make registration_date and registered_at NOT NULL after populating
ALTER TABLE event_participants
    MODIFY COLUMN registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
