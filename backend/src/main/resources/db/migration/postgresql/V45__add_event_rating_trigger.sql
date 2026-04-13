-- Trigger to update events.average_rating and events.total_reviews
-- after a review is inserted, updated, or deleted.
-- This complements the existing group_rating_summary trigger in V43.

CREATE OR REPLACE FUNCTION update_event_rating_summary()
RETURNS TRIGGER AS $$
DECLARE
    target_event_id BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_event_id := OLD.event_id;
    ELSE
        target_event_id := NEW.event_id;
    END IF;

    UPDATE events
    SET average_rating = sub.avg_rating,
        total_reviews  = sub.cnt
    FROM (
        SELECT
            COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0) AS avg_rating,
            COUNT(*)::int AS cnt
        FROM event_reviews
        WHERE event_id = target_event_id
    ) sub
    WHERE events.id = target_event_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_rating_summary
    AFTER INSERT OR UPDATE OR DELETE ON event_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_event_rating_summary();
