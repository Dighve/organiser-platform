package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganiserInviteDTO {
    private Long id;
    private String token;
    private String inviteUrl;
    private String note;
    private String createdByAdminEmail;
    private String usedByMemberEmail;
    private LocalDateTime usedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private Boolean isUsed;
    private Boolean isExpired;
    private Boolean isValid;
}
