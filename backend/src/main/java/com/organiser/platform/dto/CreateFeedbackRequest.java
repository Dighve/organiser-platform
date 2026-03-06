package com.organiser.platform.dto;

import com.organiser.platform.model.Feedback;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFeedbackRequest {
    
    @NotNull
    private Feedback.FeedbackType type;
    
    @NotBlank
    @Size(max = 200)
    private String summary;
    
    @NotBlank
    @Size(max = 4000)
    private String details;
    
    @Size(max = 500)
    private String pageUrl;
    
    @Email
    @Size(max = 255)
    private String email;
    
    private Boolean allowFollowUp = false;
    
    @Size(max = 500)
    private String screenshotUrl;
}
