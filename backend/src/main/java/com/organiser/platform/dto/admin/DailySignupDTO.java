package com.organiser.platform.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for daily signup statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySignupDTO {
    
    private String date; // Format: "2025-12-15"
    private Long count;
}
