package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Event entity - belongs to a Group
 * Members can join events through EventParticipant
 */
@Entity
@Table(name = "events", indexes = {
    @Index(name = "idx_event_group", columnList = "group_id"),
    @Index(name = "idx_event_date", columnList = "event_date"),
    @Index(name = "idx_event_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    
    public enum DifficultyLevel {
        BEGINNER,
        INTERMEDIATE,
        ADVANCED,
        EXPERT
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Event belongs to a Group
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;
    
    // Event organisers (members organizing this specific event)
    @ManyToMany
    @JoinTable(
        name = "event_organisers",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "member_id")
    )
    private Set<Member> eventOrganisers = new HashSet<>();
    
    @Column(name = "event_date", nullable = false)
    private LocalDateTime eventDate;
    
    @Column(name = "end_date")
    private LocalDateTime endDate;
    
    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;
    
    @Column(nullable = false, length = 200)
    private String location;
    
    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;
    
    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;
    
    @Column(name = "max_participants")
    private Integer maxParticipants;
    
    @Column(name = "min_participants")
    private Integer minParticipants = 1;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.DRAFT;
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    @Column(name = "cancellation_policy", columnDefinition = "TEXT")
    private String cancellationPolicy;
    
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel;
    
    @Column(name = "distance_km", precision = 10, scale = 2)
    private BigDecimal distanceKm;
    
    @Column(name = "elevation_gain_m")
    private Integer elevationGainM;
    
    @Column(name = "estimated_duration_hours", precision = 4, scale = 2)
    private BigDecimal estimatedDurationHours;
    
    @ElementCollection
    @CollectionTable(name = "event_additional_images", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "image_url")
    private Set<String> additionalImages = new HashSet<>();
    
    @ElementCollection
    @CollectionTable(name = "event_requirements", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "requirement")
    private Set<String> requirements = new HashSet<>();
    
    @ElementCollection
    @CollectionTable(name = "event_included_items", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "item")
    private Set<String> includedItems = new HashSet<>();
    
    @Column(name = "average_rating", precision = 2, scale = 1)
    private Double averageRating;
    
    @Column(name = "total_reviews")
    private Integer totalReviews = 0;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Members participating in this event
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private Set<EventParticipant> participants = new HashSet<>();
    
    public enum EventStatus {
        DRAFT,
        PUBLISHED,
        CANCELLED,
        COMPLETED,
        FULL
    }
    
    public int getCurrentParticipantCount() {
        return participants != null ? participants.size() : 0;
    }
    
    public boolean isFull() {
        return maxParticipants != null && getCurrentParticipantCount() >= maxParticipants;
    }
}
