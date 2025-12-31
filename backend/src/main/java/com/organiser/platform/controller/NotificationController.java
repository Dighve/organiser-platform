package com.organiser.platform.controller;

import static com.organiser.platform.controller.EventController.getUserIdFromAuth;

import com.organiser.platform.dto.NotificationDTO;
import com.organiser.platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * Get all notifications for the current user
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        Page<NotificationDTO> notifications = notificationService.getNotificationsForMember(memberId, page, size);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get unread notification count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        long count = notificationService.getUnreadCount(memberId);
        
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Mark a notification as read
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        notificationService.markAsRead(notificationId, memberId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Mark all notifications as read
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(Authentication authentication) {
        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        int count = notificationService.markAllAsRead(memberId);
        
        Map<String, Integer> response = new HashMap<>();
        response.put("markedCount", count);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a notification
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long notificationId,
            Authentication authentication) {

        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        notificationService.deleteNotification(notificationId, memberId);
        return ResponseEntity.ok().build();
    }
}
