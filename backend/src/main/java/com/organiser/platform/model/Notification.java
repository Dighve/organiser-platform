package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Notification entity - represents notifications for members
 * Notifications are created when:
 * 1. A new event is created in a subscribed group
 * 2. A comment is posted on an event the member is attending
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_member", columnList = "member_id"),
    @Index(name = "idx_notification_type", columnList = "notification_type"),
    @Index(name = "idx_notification_is_read", columnList = "is_read"),
    @Index(name = "idx_notification_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"member", "relatedEvent", "relatedGroup", "relatedComment"})
@ToString(exclude = {"member", "relatedEvent", "relatedGroup", "relatedComment"})
public class Notification {
    
    public enum NotificationType {
        NEW_EVENT,           // New event created in subscribed group
        NEW_COMMENT,         // New comment on event user is attending
        NEW_REPLY,           // New reply to user's comment
        EVENT_UPDATE,        // Event details updated
        EVENT_CANCELLED,     // Event cancelled
        EVENT_REMINDER       // Event reminder (24h before)
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_event_id")
    private Event relatedEvent;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_group_id")
    private Group relatedGroup;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_comment_id")
    private EventComment relatedComment;
    
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}
