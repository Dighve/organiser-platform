-- Add structured transport/logistics fields to events
ALTER TABLE events ADD COLUMN transport_detail_mode VARCHAR(20) DEFAULT 'FREEFORM';
ALTER TABLE events ADD COLUMN transport_notes TEXT;

-- Transport legs: one OUTBOUND and one RETURN per event (direction-keyed)
CREATE TABLE event_transport_legs (
    id                  BIGSERIAL PRIMARY KEY,
    event_id            BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    direction           VARCHAR(10) NOT NULL,   -- OUTBOUND | RETURN
    mode                VARCHAR(20) NOT NULL,   -- TRAIN | CAR | BUS | WALK | OTHER
    departure_location  TEXT,
    arrival_location    TEXT,
    departure_time      TEXT,                   -- plain text, e.g. "9:45 AM"
    arrival_time        TEXT,                   -- plain text, e.g. "10:24 AM"
    open_return         BOOLEAN DEFAULT FALSE,  -- RETURN leg: true = no fixed time
    notes               TEXT,
    sort_order          INT DEFAULT 0
);

CREATE INDEX idx_transport_legs_event ON event_transport_legs(event_id);
