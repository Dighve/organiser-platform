package com.organiser.platform.repository;

import com.organiser.platform.model.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    Page<Event> findByStatus(Event.EventStatus status, Pageable pageable);
    
    Page<Event> findByActivityTypeId(Long activityTypeId, Pageable pageable);
    
    Page<Event> findByOrganiserId(Long organiserId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now ORDER BY e.eventDate ASC")
    Page<Event> findUpcomingEvents(@Param("now") LocalDateTime now, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
           "AND e.activityType.id = :activityTypeId ORDER BY e.eventDate ASC")
    Page<Event> findUpcomingEventsByActivityType(
        @Param("now") LocalDateTime now,
        @Param("activityTypeId") Long activityTypeId,
        Pageable pageable
    );
    
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
           "AND LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%')) ORDER BY e.eventDate ASC")
    Page<Event> findUpcomingEventsByLocation(
        @Param("now") LocalDateTime now,
        @Param("location") String location,
        Pageable pageable
    );
    
    @Query("SELECT e FROM Event e JOIN e.participants p WHERE p.id = :userId ORDER BY e.eventDate DESC")
    Page<Event> findEventsByParticipant(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
           "AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Event> searchEvents(@Param("keyword") String keyword, @Param("now") LocalDateTime now, Pageable pageable);
}
