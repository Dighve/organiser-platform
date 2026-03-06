package com.organiser.platform.dto;

import com.organiser.platform.model.Feedback;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {
    private Long id;
    private Feedback.FeedbackType type;
    private String summary;
    private String details;
    private String pageUrl;
    private String email;
    private Boolean allowFollowUp;
    private String screenshotUrl;
    private Feedback.FeedbackStatus status;
    private Feedback.FeedbackPriority priority;
    private Instant createdAt;
    private Instant updatedAt;
    private Long memberId;
    private String memberName;
}
