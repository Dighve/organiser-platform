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
 * Group entity - created by Member, linked to ONE Activity
 * Has a primary organiser and optional team organisers
 * Members can subscribe to groups
 * Groups organize events
 */
@Entity
@Table(name = "groups", indexes = {
    @Index(name = "idx_group_primary_organiser", columnList = "primary_organiser_id"),
    @Index(name = "idx_group_activity", columnList = "activity_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Group {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    // Primary organiser who created/manages this group
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_organiser_id", nullable = false)
    private Member primaryOrganiser;
    
    // Co-organisers who help manage this group
    @ManyToMany
    @JoinTable(
        name = "group_co_organisers",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "member_id")
    )
    @Builder.Default
    private Set<Member> coOrganisers = new HashSet<>();
    
    // ONE activity per group
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;
    
    @Column(length = 200)
    private String location;
    
    @Column(name = "max_members")
    private Integer maxMembers;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublic = true;
    
    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Members subscribed to this group
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Subscription> subscriptions = new HashSet<>();
    
    // Events organized by this group
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Event> events = new HashSet<>();
    
    public int getSubscriberCount() {
        return subscriptions != null ? subscriptions.size() : 0;
    }
    
    public boolean isFull() {
        return maxMembers != null && getSubscriberCount() >= maxMembers;
    }
}
