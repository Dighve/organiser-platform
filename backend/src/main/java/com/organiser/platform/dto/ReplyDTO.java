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
public class ReplyDTO {
    
    private Long id;
    private Long commentId;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private String memberPhotoUrl;
    private String content;
    private Boolean edited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
