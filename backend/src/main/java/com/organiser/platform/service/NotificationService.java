package com.organiser.platform.service;

import com.organiser.platform.dto.NotificationDTO;
import com.organiser.platform.model.*;
import com.organiser.platform.repository.NotificationRepository;
import com.organiser.platform.repository.SubscriptionRepository;
import com.organiser.platform.repository.EventParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final EventParticipantRepository eventParticipantRepository;
    
    /**
     * Get all notifications for a member with pagination
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getNotificationsForMember(Long memberId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable);
        return notifications.map(NotificationDTO::fromEntity);
    }
    
    /**
     * Get unread notification count for a member
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long memberId) {
        return notificationRepository.countByMemberIdAndIsReadFalse(memberId);
    }
    
    /**
     * Mark a notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Long memberId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getMember().getId().equals(memberId)) {
            throw new RuntimeException("Unauthorized to mark this notification as read");
        }
        
        notification.markAsRead();
        notificationRepository.save(notification);
    }
    
    /**
     * Mark all notifications as read for a member
     */
    @Transactional
    public int markAllAsRead(Long memberId) {
        return notificationRepository.markAllAsReadForMember(memberId);
    }
    
    /**
     * Create notification when a new event is created in a group
     * Notifies all active subscribers of the group (except the event creator)
     */
    @Transactional
    public void createNewEventNotifications(Event event, Member eventCreator) {
        Group group = event.getGroup();
        
        // Find all active subscribers of the group
        List<Subscription> activeSubscriptions = subscriptionRepository
            .findByGroupIdAndStatus(group.getId(), Subscription.SubscriptionStatus.ACTIVE);
        
        for (Subscription subscription : activeSubscriptions) {
            Member subscriber = subscription.getMember();
            
            // Don't notify the event creator
            if (subscriber.getId().equals(eventCreator.getId())) {
                continue;
            }
            
            // Check if notifications are enabled for this subscription
            if (!subscription.getNotificationEnabled()) {
                continue;
            }
            
            Notification notification = Notification.builder()
                .member(subscriber)
                .notificationType(Notification.NotificationType.NEW_EVENT)
                .title("New Event in " + group.getName())
                .message("A new event \"" + event.getTitle() + "\" has been created in " + group.getName())
                .relatedEvent(event)
                .relatedGroup(group)
                .build();
            
            notificationRepository.save(notification);
            log.info("Created NEW_EVENT notification for member {} for event {}", subscriber.getId(), event.getId());
        }
    }
    
    /**
     * Create notification when a new comment is posted on an event
     * Notifies all participants of the event (except the commenter)
     */
    @Transactional
    public void createNewCommentNotifications(EventComment comment, Member commenter) {
        Event event = comment.getEvent();
        
        // Find all participants of the event
        List<EventParticipant> participants = eventParticipantRepository.findByEventId(event.getId());
        
        for (EventParticipant participant : participants) {
            Member member = participant.getMember();
            
            // Don't notify the commenter
            if (member.getId().equals(commenter.getId())) {
                continue;
            }
            var commenterName = commenter.getDisplayName() == null ?commenter.getEmail().split("@")[0] : commenter.getDisplayName();
            Notification notification = Notification.builder()
                .member(member)
                .notificationType(Notification.NotificationType.NEW_COMMENT)
                .title("New Comment on " + event.getTitle())
                .message( commenterName + " commented: \"" +
                        (comment.getContent().length() > 100 ? 
                            comment.getContent().substring(0, 100) + "..." : 
                            comment.getContent()) + "\"")
                .relatedEvent(event)
                .relatedComment(comment)
                .build();
            
            notificationRepository.save(notification);
            log.info("Created NEW_COMMENT notification for member {} for event {}", member.getId(), event.getId());
        }
    }
    
    /**
     * Delete a notification
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long memberId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getMember().getId().equals(memberId)) {
            throw new RuntimeException("Unauthorized to delete this notification");
        }
        
        notificationRepository.delete(notification);
    }
}
