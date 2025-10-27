package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * EventComment entity - represents comments on events
 * Members can comment on events and reply to comments
 */
@Entity
@Table(name = "event_comments", indexes = {
    @Index(name = "idx_comment_event", columnList = "event_id"),
    @Index(name = "idx_comment_member", columnList = "member_id"),
    @Index(name = "idx_comment_created", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"event", "member", "replies"})
@ToString(exclude = {"event", "member", "replies"})
public class EventComment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean edited = false;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Replies to this comment
    @Builder.Default
    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<EventCommentReply> replies = new ArrayList<>();
    
    public int getReplyCount() {
        return replies != null ? replies.size() : 0;
    }
}
