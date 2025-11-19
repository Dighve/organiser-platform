-- Migration: Change event date columns to support UTC timestamps (Instant type)
-- This migration is backward compatible - existing TIMESTAMP columns work with Instant in Java
-- PostgreSQL TIMESTAMP WITHOUT TIME ZONE stores UTC values when using Instant

-- No actual schema changes needed! 
-- Java Instant type works with existing TIMESTAMP columns
-- Instant stores/retrieves values in UTC automatically

-- Optional: Add a comment to document that these are UTC timestamps
COMMENT ON COLUMN events.event_date IS 'Event start date/time in UTC (stored as Instant)';
COMMENT ON COLUMN events.end_date IS 'Event end date/time in UTC (stored as Instant)';
COMMENT ON COLUMN events.registration_deadline IS 'Registration deadline in UTC (stored as Instant)';

-- Note: Existing data remains unchanged
-- LocalDateTime and Instant are compatible at the database level
-- Frontend now sends ISO 8601 UTC strings (e.g., "2025-11-19T14:30:00.000Z")
-- Backend Instant automatically handles timezone conversion
