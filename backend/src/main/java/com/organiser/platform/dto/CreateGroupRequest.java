package com.organiser.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateGroupRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;

    private String imageUrl;
    
    @NotNull(message = "Activity is required")
    private Long activityId;
    
    private String location;
    
    private Integer maxMembers;
    
    private Boolean isPublic = true;
    
    private String termsAndConditions;
}
