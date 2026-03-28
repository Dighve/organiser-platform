package com.organiser.platform.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SendInvitationRequest {
    
    @NotNull(message = "Type is required")
    private String type; // "event" or "group"
    
    @NotNull(message = "Item ID is required")
    private Long itemId; // event ID or group ID
    
    @NotEmpty(message = "At least one member must be selected")
    private List<Long> memberIds; // IDs of members to invite
    
    private String message; // Optional personal message
    
    private String url; // URL to the event/group
}
