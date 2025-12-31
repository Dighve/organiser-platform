package com.organiser.platform.dto;

import com.organiser.platform.model.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String notificationType;
    private String title;
    private String message;
    private Long relatedEventId;
    private String relatedEventTitle;
    private Long relatedGroupId;
    private String relatedGroupName;
    private Long relatedCommentId;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    
    public static NotificationDTO fromEntity(Notification notification) {
        NotificationDTOBuilder builder = NotificationDTO.builder()
            .id(notification.getId())
            .notificationType(notification.getNotificationType().name())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .isRead(notification.getIsRead())
            .createdAt(notification.getCreatedAt())
            .readAt(notification.getReadAt());
        
        if (notification.getRelatedEvent() != null) {
            builder.relatedEventId(notification.getRelatedEvent().getId())
                   .relatedEventTitle(notification.getRelatedEvent().getTitle());
        }
        
        if (notification.getRelatedGroup() != null) {
            builder.relatedGroupId(notification.getRelatedGroup().getId())
                   .relatedGroupName(notification.getRelatedGroup().getName());
        }
        
        if (notification.getRelatedComment() != null) {
            builder.relatedCommentId(notification.getRelatedComment().getId());
        }
        
        return builder.build();
    }
}
