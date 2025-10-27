package com.organiser.platform.repository;

import com.organiser.platform.model.EventCommentReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventCommentReplyRepository extends JpaRepository<EventCommentReply, Long> {
    
    /**
     * Find all replies for a specific comment, ordered by creation date ascending
     */
    List<EventCommentReply> findByCommentIdOrderByCreatedAtAsc(Long commentId);
    
    /**
     * Count replies for a specific comment
     */
    long countByCommentId(Long commentId);
    
    /**
     * Find all replies by a specific member
     */
    List<EventCommentReply> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
