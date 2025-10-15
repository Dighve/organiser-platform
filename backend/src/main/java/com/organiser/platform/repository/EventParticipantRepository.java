package com.organiser.platform.repository;

import com.organiser.platform.model.EventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    
    List<EventParticipant> findByEventId(Long eventId);
    
    List<EventParticipant> findByMemberId(Long memberId);
    
    Optional<EventParticipant> findByEventIdAndMemberId(Long eventId, Long memberId);
    
    boolean existsByEventIdAndMemberId(Long eventId, Long memberId);
    
    long countByEventIdAndStatus(Long eventId, EventParticipant.ParticipationStatus status);
}
