ALTER TABLE event_comments
    ADD COLUMN pinned     BOOLEAN                  NOT NULL DEFAULT FALSE,
    ADD COLUMN pinned_at  TIMESTAMP WITH TIME ZONE;
