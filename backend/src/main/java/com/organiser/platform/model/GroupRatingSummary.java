package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_rating_summary")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupRatingSummary {

    @Id
    @Column(name = "group_id")
    private Long groupId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "group_id")
    private Group group;

    @Column(name = "average_rating", nullable = false, columnDefinition = "NUMERIC(3,2)")
    private Double averageRating;

    @Column(name = "total_reviews", nullable = false)
    private Integer totalReviews;

    @Column(name = "organization_avg", columnDefinition = "NUMERIC(3,2)")
    private Double organizationAvg;

    @Column(name = "route_avg", columnDefinition = "NUMERIC(3,2)")
    private Double routeAvg;

    @Column(name = "group_avg", columnDefinition = "NUMERIC(3,2)")
    private Double groupAvg;

    @Column(name = "safety_avg", columnDefinition = "NUMERIC(3,2)")
    private Double safetyAvg;

    @Column(name = "value_avg", columnDefinition = "NUMERIC(3,2)")
    private Double valueAvg;

    @Column(name = "recommendation_count")
    private Integer recommendationCount;

    @Column(name = "recommendation_percentage", columnDefinition = "NUMERIC(5,2)")
    private Double recommendationPercentage;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
