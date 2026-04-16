package com.organiser.platform.repository;

import com.organiser.platform.model.EventReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EventReviewRepository extends JpaRepository<EventReview, Long> {
    
    @Query("SELECT r FROM EventReview r WHERE r.event.id = :eventId ORDER BY r.createdAt DESC")
    Page<EventReview> findByEventId(@Param("eventId") Long eventId, Pageable pageable);
    
    @Query("SELECT r FROM EventReview r WHERE r.group.id = :groupId ORDER BY r.createdAt DESC")
    Page<EventReview> findByGroupId(@Param("groupId") Long groupId, Pageable pageable);
    
    boolean existsByEventIdAndMemberId(Long eventId, Long memberId);
    
    @Query("SELECT r FROM EventReview r WHERE r.event.id = :eventId AND r.member.id = :memberId")
    java.util.Optional<EventReview> findByEventIdAndMemberId(@Param("eventId") Long eventId, @Param("memberId") Long memberId);

    @Query("SELECT r FROM EventReview r WHERE r.member.id = :memberId ORDER BY r.createdAt DESC")
    Page<EventReview> findByMemberId(@Param("memberId") Long memberId, Pageable pageable);
}
