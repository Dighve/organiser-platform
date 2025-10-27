-- Migration for Event Comments and Replies feature (PostgreSQL)
-- Adds tables for threaded comments on events

-- Event Comments table
CREATE TABLE event_comments (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_event ON event_comments(event_id);
CREATE INDEX idx_comment_member ON event_comments(member_id);
CREATE INDEX idx_comment_created ON event_comments(created_at);

-- Event Comment Replies table
CREATE TABLE event_comment_replies (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reply_comment FOREIGN KEY (comment_id) REFERENCES event_comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_reply_comment ON event_comment_replies(comment_id);
CREATE INDEX idx_reply_member ON event_comment_replies(member_id);
CREATE INDEX idx_reply_created ON event_comment_replies(created_at);
