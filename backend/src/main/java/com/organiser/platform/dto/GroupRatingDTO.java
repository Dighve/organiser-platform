package com.organiser.platform.dto;

import com.organiser.platform.model.GroupRatingSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupRatingDTO {
    private Double averageRating;
    private Integer totalReviews;
    private Double organizationAvg;
    private Double routeAvg;
    private Double groupAvg;
    private Double safetyAvg;
    private Double valueAvg;
    private Integer recommendationCount;
    private Double recommendationPercentage;
    private LocalDateTime lastUpdated;
    
    public static GroupRatingDTO fromEntity(GroupRatingSummary summary) {
        if (summary == null) {
            return null;
        }
        
        return GroupRatingDTO.builder()
                .averageRating(summary.getAverageRating())
                .totalReviews(summary.getTotalReviews())
                .organizationAvg(summary.getOrganizationAvg())
                .routeAvg(summary.getRouteAvg())
                .groupAvg(summary.getGroupAvg())
                .safetyAvg(summary.getSafetyAvg())
                .valueAvg(summary.getValueAvg())
                .recommendationCount(summary.getRecommendationCount())
                .recommendationPercentage(summary.getRecommendationPercentage())
                .lastUpdated(summary.getLastUpdated())
                .build();
    }
}
