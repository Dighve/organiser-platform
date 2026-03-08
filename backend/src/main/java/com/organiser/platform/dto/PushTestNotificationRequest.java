package com.organiser.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PushTestNotificationRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Body is required")
    private String body;

    private String url;
}
