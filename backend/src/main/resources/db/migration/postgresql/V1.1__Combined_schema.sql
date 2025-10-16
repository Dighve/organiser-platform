-- Database schema migration for PostgreSQL matching JPA entities
-- This creates the complete schema for the Organiser Platform (HikeHub)

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
    member_id BIGINT NOT NULL,
    PRIMARY KEY (group_id, member_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Events table (groups organize events)
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    group_id BIGINT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    registration_deadline TIMESTAMP,
    location VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    max_participants INT,
    min_participants INT DEFAULT 1,
    price DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    image_url VARCHAR(500),
    cancellation_policy TEXT,
    difficulty_level VARCHAR(20),
    distance_km DECIMAL(10, 2),
    elevation_gain_m INT,
    estimated_duration_hours DECIMAL(4, 2),
    average_rating DOUBLE PRECISION,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
CREATE INDEX idx_event_group ON events(group_id);
CREATE INDEX idx_event_date ON events(event_date);
CREATE INDEX idx_event_status ON events(status);

-- Event organisers (many-to-many between events and members)
CREATE TABLE event_organisers (
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    PRIMARY KEY (event_id, member_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Event participants table
CREATE TABLE event_participants (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ATTENDEE',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_member UNIQUE (event_id, member_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX idx_event_participants_member_id ON event_participants(member_id);

-- Event additional images (element collection)
CREATE TABLE event_additional_images (
    event_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event requirements (element collection)
CREATE TABLE event_requirements (
    event_id BIGINT NOT NULL,
    requirement VARCHAR(500) NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event included items (element collection)
CREATE TABLE event_included_items (
    event_id BIGINT NOT NULL,
    item VARCHAR(500) NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Subscriptions table (members subscribe to groups)
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notification_enabled BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    CONSTRAINT unique_member_group UNIQUE (member_id, group_id),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
CREATE INDEX idx_subscription_member ON subscriptions(member_id);
CREATE INDEX idx_subscription_group ON subscriptions(group_id);

-- Magic links table (for passwordless authentication)
CREATE TABLE magic_links (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    member_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
CREATE INDEX idx_magic_link_token ON magic_links(token);
CREATE INDEX idx_magic_link_email ON magic_links(email);

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

CREATE TRIGGER update_event_participants_updated_at BEFORE UPDATE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
