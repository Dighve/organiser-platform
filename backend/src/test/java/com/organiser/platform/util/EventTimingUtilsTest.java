package com.organiser.platform.util;

import com.organiser.platform.model.Event;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

class EventTimingUtilsTest {

    // ---------------------------------------------------------------
    // effectiveEnd — priority: endDate > duration > end-of-start-day
    // ---------------------------------------------------------------

    @Test
    void effectiveEnd_usesEndDate_whenSet() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant end   = Instant.parse("2025-06-15T13:00:00Z");

        Event event = eventWith(start, end, null);

        assertEquals(end, EventTimingUtils.effectiveEnd(event));
    }

    @Test
    void effectiveEnd_usesDuration_whenEndDateNull() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");

        Event event = eventWith(start, null, new BigDecimal("3.0")); // 3-hour hike

        Instant expected = Instant.parse("2025-06-15T12:00:00Z");
        assertEquals(expected, EventTimingUtils.effectiveEnd(event));
    }

    @Test
    void effectiveEnd_usesDuration_fractionalHours() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");

        Event event = eventWith(start, null, new BigDecimal("1.5")); // 90-minute event

        Instant expected = Instant.parse("2025-06-15T10:30:00Z");
        assertEquals(expected, EventTimingUtils.effectiveEnd(event));
    }

    @Test
    void effectiveEnd_usesEndOfStartDay_whenNeitherSet() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");

        Event event = eventWith(start, null, null);

        // Should be 23:59:59.999999999 UTC on 2025-06-15
        Instant endOfDay = LocalDate.of(2025, 6, 15)
                .atTime(23, 59, 59, 999_999_999)
                .toInstant(ZoneOffset.UTC);
        assertEquals(endOfDay, EventTimingUtils.effectiveEnd(event));
    }

    @Test
    void effectiveEnd_prefersEndDate_overDuration_whenBothSet() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant end   = Instant.parse("2025-06-15T14:00:00Z");

        Event event = eventWith(start, end, new BigDecimal("3.0")); // endDate wins

        assertEquals(end, EventTimingUtils.effectiveEnd(event));
    }

    // ---------------------------------------------------------------
    // isPast
    // ---------------------------------------------------------------

    @Test
    void isPast_false_whenEventOngoing() {
        Instant now   = Instant.parse("2025-06-15T10:00:00Z");
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant end   = Instant.parse("2025-06-15T13:00:00Z");

        Event event = eventWith(start, end, null);

        assertFalse(EventTimingUtils.isPast(event, now));
    }

    @Test
    void isPast_true_whenEndDatePassed() {
        Instant now   = Instant.parse("2025-06-15T14:00:00Z");
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant end   = Instant.parse("2025-06-15T13:00:00Z");

        Event event = eventWith(start, end, null);

        assertTrue(EventTimingUtils.isPast(event, now));
    }

    @Test
    void isPast_false_duringDuration_whenNoEndDate() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant now   = start.plus(2, ChronoUnit.HOURS); // 2h into a 3h hike

        Event event = eventWith(start, null, new BigDecimal("3.0"));

        assertFalse(EventTimingUtils.isPast(event, now));
    }

    @Test
    void isPast_true_afterDuration_whenNoEndDate() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant now   = start.plus(4, ChronoUnit.HOURS); // 4h after a 3h hike

        Event event = eventWith(start, null, new BigDecimal("3.0"));

        assertTrue(EventTimingUtils.isPast(event, now));
    }

    @Test
    void isPast_false_sameDayAfterStart_whenNeitherSet() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant now   = Instant.parse("2025-06-15T18:00:00Z"); // later same day

        Event event = eventWith(start, null, null);

        // Still today — should be visible until midnight
        assertFalse(EventTimingUtils.isPast(event, now));
    }

    @Test
    void isPast_true_nextDayAfterStart_whenNeitherSet() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant now   = Instant.parse("2025-06-16T00:00:01Z"); // just past midnight

        Event event = eventWith(start, null, null);

        assertTrue(EventTimingUtils.isPast(event, now));
    }

    // ---------------------------------------------------------------
    // isOngoing
    // ---------------------------------------------------------------

    @Test
    void isOngoing_true_betweenStartAndEnd() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant end   = Instant.parse("2025-06-15T13:00:00Z");
        Instant now   = Instant.parse("2025-06-15T11:00:00Z");

        Event event = eventWith(start, end, null);

        assertTrue(EventTimingUtils.isOngoing(event, now));
    }

    @Test
    void isOngoing_false_beforeStart() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant end   = Instant.parse("2025-06-15T13:00:00Z");
        Instant now   = Instant.parse("2025-06-15T08:00:00Z");

        Event event = eventWith(start, end, null);

        assertFalse(EventTimingUtils.isOngoing(event, now));
    }

    @Test
    void isOngoing_false_afterEnd() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant end   = Instant.parse("2025-06-15T13:00:00Z");
        Instant now   = Instant.parse("2025-06-15T14:00:00Z");

        Event event = eventWith(start, end, null);

        assertFalse(EventTimingUtils.isOngoing(event, now));
    }

    @Test
    void isOngoing_true_withinDuration_whenNoEndDate() {
        Instant start = Instant.parse("2025-06-15T09:00:00Z");
        Instant now   = start.plus(90, ChronoUnit.MINUTES); // 1.5h into a 3h hike

        Event event = eventWith(start, null, new BigDecimal("3.0"));

        assertTrue(EventTimingUtils.isOngoing(event, now));
    }

    // ---------------------------------------------------------------
    // Helper
    // ---------------------------------------------------------------

    private Event eventWith(Instant eventDate, Instant endDate, BigDecimal durationHours) {
        return Event.builder()
                .title("Test Event")
                .location("Test Location")
                .eventDate(eventDate)
                .endDate(endDate)
                .estimatedDurationHours(durationHours)
                .build();
    }
}
