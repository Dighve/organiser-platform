package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Member entity - represents any user in the system
 * Members can create groups, subscribe to groups, and join events
 */
@Entity
@Table(name = "members", indexes = {
    @Index(name = "idx_member_email", columnList = "email")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(name = "display_name", length = 100)
    private String displayName;
    
    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean verified = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
    
    @Builder.Default
    @Column(name = "is_organiser", nullable = false)
    private Boolean isOrganiser = false;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Subscriptions to groups
    @Builder.Default
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private Set<Subscription> subscriptions = new HashSet<>();
    
    // Events this member is participating in
    @Builder.Default
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private Set<EventParticipant> eventParticipations = new HashSet<>();
}
