package com.organiser.platform.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MemberDTO {
    private Long id;
    private String email;
    private String displayName;
    private String profilePhotoUrl;
    private String imagePosition; // JSON string: {"x": 50, "y": 50}
    
    // Platform-level organiser role (different from being organiser of a specific group/event)
    private Boolean hasOrganiserRole;
    
    // Context-specific flag: true if this member is the organiser of the current group/event being viewed
    // This is set dynamically based on context (e.g., in group member lists, event participant lists)
    private Boolean isOrganiser;
    
    private Boolean isAdmin;
    private Boolean hasAcceptedOrganiserAgreement;
    private LocalDateTime organiserAgreementAcceptedAt;
    private Boolean hasAcceptedUserAgreement;
    private LocalDateTime userAgreementAcceptedAt;
    private Boolean emailNotificationsEnabled;
    private LocalDateTime joinedAt; // For event participants: registrationDate, for group members: subscription date
    private Boolean deleted;
    private Integer guestCount; // optional: populated for event participant listings
    
    // Ban information (for banned members list)
    private LocalDateTime bannedAt;
    private String bannedBy;
    private String banReason;
    private String joinQuestionAnswer;
    private String notes;
}
