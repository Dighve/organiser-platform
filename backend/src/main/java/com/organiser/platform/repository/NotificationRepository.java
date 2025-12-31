package com.organiser.platform.repository;

import com.organiser.platform.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find all notifications for a member, ordered by creation date (newest first)
     */
    Page<Notification> findByMemberIdOrderByCreatedAtDesc(Long memberId, Pageable pageable);
    
    /**
     * Find unread notifications for a member
     */
    List<Notification> findByMemberIdAndIsReadFalseOrderByCreatedAtDesc(Long memberId);
    
    /**
     * Count unread notifications for a member
     */
    long countByMemberIdAndIsReadFalse(Long memberId);
    
    /**
     * Mark all notifications as read for a member
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.member.id = :memberId AND n.isRead = false")
    int markAllAsReadForMember(@Param("memberId") Long memberId);
    
    /**
     * Delete old read notifications (older than 30 days)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.readAt < CURRENT_TIMESTAMP - 30")
    int deleteOldReadNotifications();
}
