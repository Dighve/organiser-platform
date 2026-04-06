package com.organiser.platform.dto;

import com.organiser.platform.model.EventReview;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventReviewDTO {
    private Long id;
    private Long eventId;
    private String eventName;
    private Long memberId;
    private String memberName;
    private String memberPhotoUrl;
    private Long groupId;
    private String groupName;
    private Short organizationRating;
    private Short routeRating;
    private Short groupRating;
    private Short safetyRating;
    private Short valueRating;
    private Double overallRating;
    private String comment;
    private Boolean wouldRecommend;
    private Boolean wouldJoinAgain;
    private Boolean isVerifiedAttendee;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EventReviewDTO fromEntity(EventReview review) {
        return EventReviewDTO.builder()
                .id(review.getId())
                .eventId(review.getEvent() != null ? review.getEvent().getId() : null)
                .eventName(review.getEvent() != null ? review.getEvent().getTitle() : null)
                .memberId(review.getMember() != null ? review.getMember().getId() : null)
                .memberName(review.getMember() != null ? review.getMember().getDisplayName() : null)
                .memberPhotoUrl(review.getMember() != null ? review.getMember().getProfilePhotoUrl() : null)
                .groupId(review.getGroup() != null ? review.getGroup().getId() : null)
                .groupName(review.getGroup() != null ? review.getGroup().getName() : null)
                .organizationRating(review.getOrganizationRating())
                .routeRating(review.getRouteRating())
                .groupRating(review.getGroupRating())
                .safetyRating(review.getSafetyRating())
                .valueRating(review.getValueRating())
                .overallRating(review.getOverallRating())
                .comment(review.getComment())
                .wouldRecommend(review.getWouldRecommend())
                .wouldJoinAgain(review.getWouldJoinAgain())
                .isVerifiedAttendee(review.getIsVerifiedAttendee())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
