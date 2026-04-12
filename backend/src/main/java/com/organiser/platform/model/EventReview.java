package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(name = "organization_rating", nullable = false)
    private Short organizationRating;

    @Column(name = "route_rating", nullable = false)
    private Short routeRating;

    @Column(name = "group_rating", nullable = false)
    private Short groupRating;

    @Column(name = "safety_rating", nullable = false)
    private Short safetyRating;

    @Column(name = "value_rating", nullable = false)
    private Short valueRating;

    @Column(name = "overall_rating", nullable = false, columnDefinition = "DECIMAL(3,2)")
    private Double overallRating;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "would_recommend")
    private Boolean wouldRecommend;

    @Column(name = "would_join_again")
    private Boolean wouldJoinAgain;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_verified_attendee")
    private Boolean isVerifiedAttendee;

    @Column(name = "is_flagged")
    private Boolean isFlagged;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isVerifiedAttendee == null) {
            isVerifiedAttendee = true;
        }
        if (isFlagged == null) {
            isFlagged = false;
        }
        if (wouldRecommend == null) {
            wouldRecommend = false;
        }
        if (wouldJoinAgain == null) {
            wouldJoinAgain = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
