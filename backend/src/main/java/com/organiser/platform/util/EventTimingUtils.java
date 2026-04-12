package com.organiser.platform.util;

import com.organiser.platform.model.Event;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;

/**
 * Utility methods for event timing logic.
 *
 * Effective end time priority:
 *  1. endDate — explicit end set by organiser
 *  2. eventDate + estimatedDurationHours — duration set by organiser
 *  3. 23:59:59 UTC on the event's start day — fallback (keeps event visible all day)
 */
public final class EventTimingUtils {

    private EventTimingUtils() {}

    /**
     * Returns the instant at which the event is considered to have ended.
     * Used to decide whether an event should appear in upcoming/discover lists.
     */
    public static Instant effectiveEnd(Event event) {
        if (event.getEndDate() != null) {
            return event.getEndDate();
        }
        if (event.getEstimatedDurationHours() != null) {
            long seconds = event.getEstimatedDurationHours()
                    .multiply(BigDecimal.valueOf(3600))
                    .longValue();
            return event.getEventDate().plusSeconds(seconds);
        }
        return LocalDate.ofInstant(event.getEventDate(), ZoneOffset.UTC)
                .atTime(LocalTime.MAX)
                .toInstant(ZoneOffset.UTC);
    }

    /**
     * Midnight UTC today — lower bound used in JPQL queries for events with no end time.
     */
    public static Instant startOfToday() {
        return LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    /**
     * Whether an event is currently ongoing (started but not yet ended).
     */
    public static boolean isOngoing(Event event, Instant now) {
        return event.getEventDate().isBefore(now) && effectiveEnd(event).isAfter(now);
    }

    /**
     * Whether an event is considered past (effective end has passed).
     */
    public static boolean isPast(Event event, Instant now) {
        return effectiveEnd(event).isBefore(now);
    }
}
