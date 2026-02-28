package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Feature Flag data transfer
 * Used for API responses and admin dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureFlagDTO {
    
    private Long id;
    private String flagKey;
    private String flagName;
    private String description;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String updatedByEmail; // Email of the admin who last updated this flag
}
