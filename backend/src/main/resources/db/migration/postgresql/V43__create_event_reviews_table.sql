-- Event Reviews Table
-- Stores reviews from attendees after events are completed
CREATE TABLE event_reviews (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    
    -- Individual Ratings (1-5 scale)
    organization_rating SMALLINT NOT NULL CHECK (organization_rating BETWEEN 1 AND 5),
    route_rating SMALLINT NOT NULL CHECK (route_rating BETWEEN 1 AND 5),
    group_rating SMALLINT NOT NULL CHECK (group_rating BETWEEN 1 AND 5),
    safety_rating SMALLINT NOT NULL CHECK (safety_rating BETWEEN 1 AND 5),
    value_rating SMALLINT NOT NULL CHECK (value_rating BETWEEN 1 AND 5),
    
    -- Weighted Overall Rating (calculated)
    -- Formula: (organization * 0.25) + (route * 0.20) + (group * 0.20) + (safety * 0.20) + (value * 0.15)
    overall_rating DECIMAL(3,2) NOT NULL,
    
    -- Text Feedback (optional)
    comment TEXT,
    
    -- Recommendations
    would_recommend BOOLEAN DEFAULT false,
    would_join_again BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_verified_attendee BOOLEAN DEFAULT true,
    is_flagged BOOLEAN DEFAULT false,
    
    -- Foreign Keys
    CONSTRAINT fk_event_review_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_review_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_review_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    
    -- One review per attendee per event
    UNIQUE(event_id, member_id)
);

-- Indexes for performance
CREATE INDEX idx_event_reviews_event ON event_reviews(event_id);
CREATE INDEX idx_event_reviews_group ON event_reviews(group_id);
CREATE INDEX idx_event_reviews_member ON event_reviews(member_id);
CREATE INDEX idx_event_reviews_rating ON event_reviews(overall_rating DESC);
CREATE INDEX idx_event_reviews_created ON event_reviews(created_at DESC);

-- Group Rating Summary Table
-- Aggregated ratings per group for fast display
CREATE TABLE group_rating_summary (
    group_id BIGINT PRIMARY KEY,
    
    -- Overall metrics
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    
    -- Category averages
    organization_avg DECIMAL(3,2) DEFAULT 0,
    route_avg DECIMAL(3,2) DEFAULT 0,
    group_avg DECIMAL(3,2) DEFAULT 0,
    safety_avg DECIMAL(3,2) DEFAULT 0,
    value_avg DECIMAL(3,2) DEFAULT 0,
    
    -- Recommendation metrics
    recommendation_count INTEGER DEFAULT 0,
    recommendation_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_group_rating_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX idx_group_rating_summary_rating ON group_rating_summary(average_rating DESC);

-- Function to calculate weighted overall rating
CREATE OR REPLACE FUNCTION calculate_overall_rating(
    org_rating SMALLINT,
    route_rating SMALLINT,
    grp_rating SMALLINT,
    safe_rating SMALLINT,
    val_rating SMALLINT
) RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN ROUND(
        (org_rating * 0.25) + 
        (route_rating * 0.20) + 
        (grp_rating * 0.20) + 
        (safe_rating * 0.20) + 
        (val_rating * 0.15),
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate overall rating before insert/update
CREATE OR REPLACE FUNCTION set_overall_rating()
RETURNS TRIGGER AS $$
BEGIN
    NEW.overall_rating := calculate_overall_rating(
        NEW.organization_rating,
        NEW.route_rating,
        NEW.group_rating,
        NEW.safety_rating,
        NEW.value_rating
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_overall_rating
    BEFORE INSERT OR UPDATE ON event_reviews
    FOR EACH ROW
    EXECUTE FUNCTION set_overall_rating();

-- Trigger to update group_rating_summary after review insert/update/delete
CREATE OR REPLACE FUNCTION update_group_rating_summary()
RETURNS TRIGGER AS $$
DECLARE
    target_group_id BIGINT;
BEGIN
    -- Determine which group to update
    IF TG_OP = 'DELETE' THEN
        target_group_id := OLD.group_id;
    ELSE
        target_group_id := NEW.group_id;
    END IF;
    
    -- Recalculate all metrics for the group
    INSERT INTO group_rating_summary (
        group_id,
        average_rating,
        total_reviews,
        organization_avg,
        route_avg,
        group_avg,
        safety_avg,
        value_avg,
        recommendation_count,
        recommendation_percentage,
        last_updated
    )
    SELECT
        target_group_id,
        COALESCE(ROUND(AVG(overall_rating), 2), 0),
        COUNT(*),
        COALESCE(ROUND(AVG(organization_rating), 2), 0),
        COALESCE(ROUND(AVG(route_rating), 2), 0),
        COALESCE(ROUND(AVG(group_rating), 2), 0),
        COALESCE(ROUND(AVG(safety_rating), 2), 0),
        COALESCE(ROUND(AVG(value_rating), 2), 0),
        COUNT(*) FILTER (WHERE would_recommend = true),
        CASE 
            WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE would_recommend = true)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END,
        CURRENT_TIMESTAMP
    FROM event_reviews
    WHERE group_id = target_group_id
    ON CONFLICT (group_id) DO UPDATE SET
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        organization_avg = EXCLUDED.organization_avg,
        route_avg = EXCLUDED.route_avg,
        group_avg = EXCLUDED.group_avg,
        safety_avg = EXCLUDED.safety_avg,
        value_avg = EXCLUDED.value_avg,
        recommendation_count = EXCLUDED.recommendation_count,
        recommendation_percentage = EXCLUDED.recommendation_percentage,
        last_updated = EXCLUDED.last_updated;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_rating_summary
    AFTER INSERT OR UPDATE OR DELETE ON event_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_group_rating_summary();

-- Comments for documentation
COMMENT ON TABLE event_reviews IS 'Stores post-event reviews from attendees with multi-dimensional ratings';
COMMENT ON TABLE group_rating_summary IS 'Aggregated rating metrics per group for fast display on cards and pages';
COMMENT ON COLUMN event_reviews.overall_rating IS 'Weighted average: org(25%) + route(20%) + group(20%) + safety(20%) + value(15%)';
COMMENT ON COLUMN group_rating_summary.recommendation_percentage IS 'Percentage of reviewers who would recommend this group';
