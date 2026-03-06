CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    summary VARCHAR(200) NOT NULL,
    details TEXT NOT NULL,
    page_url VARCHAR(500),
    email VARCHAR(255),
    allow_follow_up BOOLEAN DEFAULT FALSE,
    screenshot_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_member ON feedback(member_id);

-- Optional simple check constraints to keep values within known enums
ALTER TABLE feedback
    ADD CONSTRAINT chk_feedback_type CHECK (type IN ('BUG','FEATURE','UI','CONTENT','OTHER')),
    ADD CONSTRAINT chk_feedback_status CHECK (status IN ('NEW','TRIAGING','RESOLVED','WONT_FIX')),
    ADD CONSTRAINT chk_feedback_priority CHECK (priority IN ('LOW','MEDIUM','HIGH'));
