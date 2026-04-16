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

@Entity
@Table(name = "member_contact_info", indexes = {
    @Index(name = "idx_contact_info_member", columnList = "member_id")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"member_id", "platform"})
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberContactInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ContactPlatform platform;

    @Column(name = "contact_value", nullable = false, length = 255)
    private String contactValue;

    @Column(name = "display_label", length = 100)
    private String displayLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ContactVisibility visibility = ContactVisibility.GROUP_MEMBERS;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ============================================================
    // ENUMS
    // ============================================================

    public enum ContactPlatform {
        WHATSAPP,
        TELEGRAM,
        INSTAGRAM,
        FACEBOOK,
        X_TWITTER,
        LINKEDIN,
        SNAPCHAT,
        OTHER
    }

    public enum ContactVisibility {
        EVERYONE,        // Visible to all logged-in users
        GROUP_MEMBERS,   // Visible only to people who share a group
        EVENT_ATTENDEES, // Visible only to people who share an event
        NOBODY           // Private — only visible to the owner
    }
}
