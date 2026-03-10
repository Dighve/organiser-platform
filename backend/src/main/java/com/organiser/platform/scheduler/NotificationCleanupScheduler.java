package com.organiser.platform.scheduler;

import com.organiser.platform.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled job to clean up old read notifications
 * Runs daily at 2 AM to delete notifications older than 30 days
 * This keeps the database lean and reduces storage costs
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationCleanupScheduler {

    private final NotificationRepository notificationRepository;

    /**
     * Delete read notifications older than 30 days
     * Runs daily at 2:00 AM server time
     * Cron format: second minute hour day month weekday
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        log.info("Starting notification cleanup job...");
        
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            int deletedCount = notificationRepository.deleteOldReadNotifications(cutoffDate);
            
            if (deletedCount > 0) {
                log.info("Deleted {} old read notifications (older than 30 days)", deletedCount);
            } else {
                log.debug("No old notifications to delete");
            }
        } catch (Exception e) {
            log.error("Error during notification cleanup", e);
        }
    }
}
