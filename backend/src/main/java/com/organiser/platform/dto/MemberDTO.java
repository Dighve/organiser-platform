package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private LocalDateTime joinedAt; // For event participants: registrationDate, for group members: subscription date
}
