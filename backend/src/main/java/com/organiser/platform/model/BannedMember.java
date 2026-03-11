package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "banned_members")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"group", "member", "bannedBy"})
@ToString(exclude = {"group", "member", "bannedBy"})
public class BannedMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "banned_by_member_id", nullable = false)
    private Member bannedBy;
    
    @Column(name = "banned_at", nullable = false)
    private LocalDateTime bannedAt;
    
    @Column(name = "reason", length = 500)
    private String reason;
}
