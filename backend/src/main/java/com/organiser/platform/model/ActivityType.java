package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "activity_types")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "icon_url")
    private String iconUrl;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "activityType")
    private Set<Event> events = new HashSet<>();
    
    // Specific fields for hiking (can be extended for other activities)
    @Column(name = "requires_difficulty_level")
    private Boolean requiresDifficultyLevel = false;
    
    @Column(name = "requires_distance")
    private Boolean requiresDistance = false;
    
    @Column(name = "requires_elevation")
    private Boolean requiresElevation = false;
}
