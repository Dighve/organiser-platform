package com.organiser.platform.scheduler;

import com.organiser.platform.model.EventParticipant;
import com.organiser.platform.repository.EventParticipantRepository;
import com.organiser.platform.service.EmailService;
import com.organiser.platform.service.WebPushService;
import com.organiser.platform.util.EventTimingUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Sends a "How was your event?" push notification to attendees once per event,
 * 24–30 days after the event ends.
 *
 * Runs daily at 10:00 AM UTC.
 * Exclusions: group organiser and event host are never prompted.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewNotificationScheduler {

    private final EventParticipantRepository eventParticipantRepository;
    private final WebPushService webPushService;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 10 * * *") // 10:00 AM UTC daily
    @Transactional
    public void sendReviewPrompts() {
        log.info("Review prompt scheduler started");

        Instant now = Instant.now();

        // Broad DB window: events that started between 31 days ago and yesterday.
        // Java-side filtering narrows this to the precise 24h–30d window using
        // EventTimingUtils.effectiveEnd(), which accounts for endDate, duration, or midnight fallback.
        Instant windowStart = now.minus(31, ChronoUnit.DAYS);
        Instant windowEnd   = now.minus(1,  ChronoUnit.DAYS);

        List<EventParticipant> candidates =
                eventParticipantRepository.findEligibleForReviewPrompt(windowStart, windowEnd);

        int sent = 0;
        int skipped = 0;

        for (EventParticipant ep : candidates) {
            Instant eventEnd = EventTimingUtils.effectiveEnd(ep.getEvent());

            // Precise time window: event must have ended at least 24h ago and no more than 30 days ago
            long hoursElapsed = ChronoUnit.HOURS.between(eventEnd, now);
            if (hoursElapsed < 24 || hoursElapsed > 30 * 24) {
                skipped++;
                continue;
            }

            // Exclude organiser and host — they ran the event, not attendees
            Long memberId     = ep.getMember().getId();
            Long organiserId  = ep.getEvent().getGroup().getPrimaryOrganiser().getId();
            Long hostMemberId = ep.getEvent().getHostMember() != null
                    ? ep.getEvent().getHostMember().getId() : null;

            if (memberId.equals(organiserId) || memberId.equals(hostMemberId)) {
                ep.setReviewPromptSent(true); // mark so we don't revisit on future runs
                skipped++;
                continue;
            }

            String eventTitle = ep.getEvent().getTitle();
            String path = "/events/" + ep.getEvent().getId() + "/review";

            webPushService.sendToMember(
                    memberId,
                    "How was " + eventTitle + "?",
                    "Share your experience and help others discover great events.",
                    path
            );

            emailService.sendReviewPromptEmail(
                    ep.getMember(),
                    eventTitle,
                    ep.getEvent().getGroup().getName(),
                    ep.getEvent().getId()
            );

            ep.setReviewPromptSent(true);
            sent++;
        }

        log.info("Review prompt scheduler complete — sent: {}, skipped: {}", sent, skipped);
    }
}
