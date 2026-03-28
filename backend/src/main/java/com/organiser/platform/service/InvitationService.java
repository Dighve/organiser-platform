package com.organiser.platform.service;

import com.organiser.platform.dto.SendInvitationRequest;
import com.organiser.platform.model.Event;
import com.organiser.platform.model.Group;
import com.organiser.platform.model.Member;
import com.organiser.platform.model.Notification;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.GroupRepository;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {
    
    private final MemberRepository memberRepository;
    private final EventRepository eventRepository;
    private final GroupRepository groupRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final FeatureFlagService featureFlagService;
    
    /**
     * Send invitations to multiple members for an event or group
     */
    @Transactional
    public void sendInvitations(SendInvitationRequest request, Long senderId) {
        log.info("Sending {} invitations from member {} for {} {}", 
            request.getMemberIds().size(), senderId, request.getType(), request.getItemId());
        
        // Get sender information
        Member sender = memberRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("Sender not found"));
        
        String senderName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getEmail().split("@")[0];
        
        // Get item details (event or group)
        String itemName;
        String itemType = request.getType();
        
        if ("event".equalsIgnoreCase(itemType)) {
            Event event = eventRepository.findById(request.getItemId())
                .orElseThrow(() -> new RuntimeException("Event not found"));
            itemName = event.getTitle();
        } else if ("group".equalsIgnoreCase(itemType)) {
            Group group = groupRepository.findById(request.getItemId())
                .orElseThrow(() -> new RuntimeException("Group not found"));
            itemName = group.getName();
        } else {
            throw new RuntimeException("Invalid invitation type: " + itemType);
        }
        
        // Send invitation to each member
        List<Long> successfulInvitations = new ArrayList<>();
        List<Long> failedInvitations = new ArrayList<>();
        
        for (Long recipientId : request.getMemberIds()) {
            try {
                Member recipient = memberRepository.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("Recipient not found: " + recipientId));
                
                // Create in-app notification
                String notificationMessage = request.getMessage() != null && !request.getMessage().isEmpty()
                    ? senderName + " invited you to " + itemName + ": \"" + request.getMessage() + "\""
                    : senderName + " invited you to " + itemName;
                
                Notification notification = notificationService.createInvitationNotification(
                    recipient,
                    sender,
                    itemType,
                    request.getItemId(),
                    itemName,
                    notificationMessage,
                    request.getUrl()
                );
                
                log.info("Created notification {} for member {}", notification.getId(), recipientId);
                
                // Send email notification (if globally enabled by admin AND user has email notifications enabled)
                boolean emailsGloballyEnabled = featureFlagService.isEmailNotificationsEnabled();
                if (emailsGloballyEnabled && recipient.getEmailNotificationsEnabled()) {
                    emailService.sendInvitationEmail(
                        recipient,
                        sender,
                        itemType,
                        itemName,
                        request.getMessage(),
                        request.getUrl()
                    );
                    log.info("Sent invitation email to {}", recipient.getEmail());
                } else {
                    if (!emailsGloballyEnabled) {
                        log.info("Email notifications globally disabled by admin, skipping email for member {}", recipientId);
                    } else {
                        log.info("Email notifications disabled for member {}, skipping email", recipientId);
                    }
                }
                
                successfulInvitations.add(recipientId);
                
            } catch (Exception e) {
                log.error("Failed to send invitation to member {}: {}", recipientId, e.getMessage());
                failedInvitations.add(recipientId);
            }
        }
        
        log.info("Invitation summary: {} successful, {} failed", 
            successfulInvitations.size(), failedInvitations.size());
    }
}
