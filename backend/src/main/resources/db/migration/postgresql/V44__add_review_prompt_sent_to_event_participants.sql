-- Track whether a review prompt push notification has been sent to each participant.
-- Prevents the daily scheduler from sending duplicate review prompts.
ALTER TABLE event_participants
    ADD COLUMN review_prompt_sent BOOLEAN NOT NULL DEFAULT FALSE;


 DELETE FROM flyway_schema_history WHERE version = '44'