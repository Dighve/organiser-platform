-- Database schema migration for PostgreSQL
-- This creates the complete schema for the Organiser Platform

-- ========== Core Tables ==========

-- Members table
CREATE TABLE members (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    profile_photo_url VARCHAR(500),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_member_email ON members(email);

-- Activities table (e.g., Hiking, Cycling, Running)
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500),
    icon_url VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Groups table (each group is linked to one activity)
CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    primary_organiser_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    location VARCHAR(200),
    max_members INT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_organiser_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE RESTRICT
);
CREATE INDEX idx_group_primary_organiser ON groups(primary_organiser_id);
CREATE INDEX idx_group_activity ON groups(activity_id);

-- Group co-organisers (many-to-many)
CREATE TABLE group_co_organisers (
    group_id BIGINT NOT NULL,
    co_organiser_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, co_organiser_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (co_organiser_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Group members (many-to-many with status)
CREATE TABLE group_members (
    group_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    is_organiser BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, member_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_member ON group_members(member_id);

-- Events table
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    group_id BIGINT NOT NULL,
    organiser_id BIGINT NOT NULL,
    location VARCHAR(200) NOT NULL,
    meeting_point VARCHAR(500),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    max_participants INT,
    difficulty_level VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (organiser_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX idx_event_group ON events(group_id);
CREATE INDEX idx_event_organiser ON events(organiser_id);
CREATE INDEX idx_event_start_time ON events(start_time);
CREATE INDEX idx_event_status ON events(status);

-- Event participants (many-to-many with RSVP status)
CREATE TABLE event_participants (
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    rsvp_status VARCHAR(20) NOT NULL DEFAULT 'GOING',
    response_notes VARCHAR(500),
    rsvp_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (event_id, member_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_member ON event_participants(member_id);

-- Authentication table
CREATE TABLE authentication (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255),
    last_password_change TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    account_locked_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_token_member ON refresh_tokens(member_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers for updated_at columns
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authentication_updated_at BEFORE UPDATE ON authentication
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
