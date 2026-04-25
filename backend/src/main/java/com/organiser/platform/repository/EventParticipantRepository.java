package com.organiser.platform.repository;

import com.organiser.platform.model.EventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    
    List<EventParticipant> findByEventId(Long eventId);
    
    List<EventParticipant> findByMemberId(Long memberId);
    
    Optional<EventParticipant> findByEventIdAndMemberId(Long eventId, Long memberId);
    
    boolean existsByEventIdAndMemberId(Long eventId, Long memberId);

    boolean existsByEventIdAndMemberIdAndStatusIn(Long eventId, Long memberId,
            java.util.Collection<EventParticipant.ParticipationStatus> statuses);
    
    long countByEventIdAndStatus(Long eventId, EventParticipant.ParticipationStatus status);
    
    long countByMemberIdAndStatus(Long memberId, EventParticipant.ParticipationStatus status);

    long countByMemberIdAndStatusIn(Long memberId,
            java.util.Collection<EventParticipant.ParticipationStatus> statuses);

    // Admin dashboard queries
    Long countByMemberId(Long memberId);

    @Modifying
    @Query("DELETE FROM EventParticipant ep WHERE ep.member.id = :memberId AND ep.event.eventDate > :cutoff")
    void deleteFutureParticipations(@Param("memberId") Long memberId, @Param("cutoff") Instant cutoff);
    
    /**
     * Delete all participants for an event (used when permanently deleting event)
     */
    void deleteByEventId(Long eventId);

    /**
     * Find participants who have not yet received a review prompt and are eligible:
     * - Status is REGISTERED, CONFIRMED, or ATTENDED (not cancelled/no-show)
     * - Prompt not yet sent
     * - No review already submitted for this event
     * - Event ended within the review window (eventDate between cutoffOld and cutoffRecent)
     *   NOTE: Java-side filtering via EventTimingUtils handles endDate/duration fallback,
     *   so we use a broad eventDate window here and filter precisely in the scheduler.
     */
    @Query("""
        SELECT ep FROM EventParticipant ep
        JOIN FETCH ep.member
        JOIN FETCH ep.event e
        JOIN FETCH e.group g
        JOIN FETCH g.primaryOrganiser
        WHERE ep.reviewPromptSent = false
          AND ep.status IN ('REGISTERED', 'CONFIRMED', 'ATTENDED')
          AND e.eventDate BETWEEN :windowStart AND :windowEnd
          AND NOT EXISTS (
              SELECT r FROM EventReview r
              WHERE r.event = e AND r.member = ep.member
          )
        """)
    List<EventParticipant> findEligibleForReviewPrompt(
            @Param("windowStart") Instant windowStart,
            @Param("windowEnd") Instant windowEnd);
}
