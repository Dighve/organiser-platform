package com.organiser.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MagicLinkRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    private String displayName;  // Optional display name (can be pseudonym)
    
    private String redirectUrl;  // Optional URL to redirect to after verification (e.g., /events/123?action=join)
}
