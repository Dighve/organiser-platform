package com.organiser.platform.dto;

import com.organiser.platform.model.Event;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private Long id;
    private String title;
    private String description;
    private Long organiserId;
    private String organiserName;
    private Long activityTypeId;
    private String activityTypeName;
    private Long groupId;
    private String groupName;
    private Long hostMemberId;
    private String hostMemberName;
    private Instant eventDate;  // UTC timestamp for proper timezone handling
    private Instant endDate;  // UTC timestamp
    private Instant registrationDeadline;  // UTC timestamp
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer maxParticipants;
    private Integer minParticipants;
    private Integer currentParticipants;
    private BigDecimal price;
    private Event.EventStatus status;
    private Event.DifficultyLevel difficultyLevel;
    private BigDecimal distanceKm;
    private Integer elevationGainM;
    private BigDecimal estimatedDurationHours;
    private String imageUrl;
    private Set<String> additionalImages;
    private Set<String> requirements;
    private Set<String> includedItems;
    private String cancellationPolicy;
    private BigDecimal averageRating;
    private Integer totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<Long> participantIds;
    private Boolean userIsGroupMember; // Whether current user is a member of the group
}
