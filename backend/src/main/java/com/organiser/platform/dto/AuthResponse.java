package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    @Builder.Default
    private String type = "Bearer";
    private Long userId;
    private String email;
    private String role;
    
    // Platform-level organiser role
    private Boolean hasOrganiserRole;

    // True when user just got organiser role via invite — triggers onboarding flow
    private Boolean isNewOrganiser;
}
