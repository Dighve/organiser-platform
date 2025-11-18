package com.organiser.platform.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberProfileRequest {
    
    @Size(max = 100, message = "Display name must be at most 100 characters")
    private String displayName;
    
    @Size(max = 500, message = "Profile photo URL must be at most 500 characters")
    private String profilePhotoUrl;
}
