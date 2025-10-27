package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    
    private Long id;
    private Long eventId;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private String memberPhotoUrl;
    private String content;
    private Boolean edited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer replyCount;
    private List<ReplyDTO> replies;
}
