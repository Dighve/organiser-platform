package com.organiser.platform.repository;

import com.organiser.platform.model.EventComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventCommentRepository extends JpaRepository<EventComment, Long> {
    
    /**
     * Find all comments for a specific event, ordered by creation date descending
     */
    @Query("SELECT c FROM EventComment c WHERE c.event.id = :eventId ORDER BY c.createdAt DESC")
    List<EventComment> findByEventIdOrderByCreatedAtDesc(@Param("eventId") Long eventId);
    
    /**
     * Count comments for a specific event
     */
    long countByEventId(Long eventId);
    
    /**
     * Find all comments by a specific member
     */
    List<EventComment> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
