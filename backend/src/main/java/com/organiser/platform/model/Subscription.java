package com.organiser.platform.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Subscription entity - represents a Member's subscription to a Group
 * This is the relationship between Member and Group
 */
@Entity
@Table(name = "subscriptions", 
    uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "group_id"}),
    indexes = {
        @Index(name = "idx_subscription_member", columnList = "member_id"),
        @Index(name = "idx_subscription_group", columnList = "group_id")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"member", "group"})
@ToString(exclude = {"member", "group"})
public class Subscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @JsonIgnore
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnore
    private Group group;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;
    
    @Column(name = "notification_enabled")
    @Builder.Default
    private Boolean notificationEnabled = true;
    
    @CreatedDate
    @Column(name = "subscribed_at", nullable = false, updatable = false)
    private LocalDateTime subscribedAt;
    
    @Column(name = "unsubscribed_at")
    private LocalDateTime unsubscribedAt;
    
    public enum SubscriptionStatus {
        ACTIVE,
        INACTIVE,
        BANNED
    }
}
