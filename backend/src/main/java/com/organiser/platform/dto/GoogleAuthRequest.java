package com.organiser.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for Google OAuth authentication.
 * Contains the Google ID token received from frontend.
 */
@Data
public class GoogleAuthRequest {
    
    @NotBlank(message = "Google ID token is required")
    private String idToken;  // Google ID token from frontend
    
    private String redirectUrl;  // Optional URL to redirect to after auth (for auto-join flow)
}
