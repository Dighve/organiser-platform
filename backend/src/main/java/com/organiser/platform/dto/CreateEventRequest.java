package com.organiser.platform.dto;

import com.organiser.platform.model.Event;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class CreateEventRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Activity type is required")
    private Long activityTypeId;
    
    @NotNull(message = "Event date is required")
    @Future(message = "Event date must be in the future")
    private LocalDateTime eventDate;
    
    private LocalDateTime endDate;
    private LocalDateTime registrationDeadline;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    private BigDecimal latitude;
    private BigDecimal longitude;
    
    @Positive(message = "Max participants must be positive")
    private Integer maxParticipants;
    
    private Integer minParticipants = 1;
    private BigDecimal price = BigDecimal.ZERO;
    private Event.DifficultyLevel difficultyLevel;
    private BigDecimal distanceKm;
    private Integer elevationGainM;
    private BigDecimal estimatedDurationHours;
    private String imageUrl;
    private Set<String> additionalImages;
    private Set<String> requirements;
    private Set<String> includedItems;
    private String cancellationPolicy;
}
