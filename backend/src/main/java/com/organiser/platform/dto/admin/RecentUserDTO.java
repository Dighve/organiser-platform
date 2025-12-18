package com.organiser.platform.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for recent user signups in admin dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentUserDTO {
    
    private Long id;
    private String email;
    private String displayName;
    private String profilePhotoUrl;
    private Boolean isOrganiser;
    private Boolean verified;
    private Boolean active;
    private LocalDateTime createdAt;
    private String authMethod; // "MAGIC_LINK" or "GOOGLE_OAUTH"
    
    // Activity metrics
    private Long groupsJoined;
    private Long eventsJoined;
    private Long groupsCreated;
    private Long eventsCreated;
}
