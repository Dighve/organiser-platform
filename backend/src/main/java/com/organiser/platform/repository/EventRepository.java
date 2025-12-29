package com.organiser.platform.repository;

import com.organiser.platform.model.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    Page<Event> findByStatus(Event.EventStatus status, Pageable pageable);
    
    // Get events by activity through group relationship
    @Query("SELECT e FROM Event e WHERE e.group.activity.id = :activityId")
    Page<Event> findByActivityId(@Param("activityId") Long activityId, Pageable pageable);
    
    // Get events by organiser through group relationship
    @Query("SELECT e FROM Event e WHERE e.group.primaryOrganiser.id = :organiserId ORDER BY e.eventDate ASC")
    Page<Event> findByOrganiserId(@Param("organiserId") Long organiserId, Pageable pageable);
    
    // Get events by group
    @Query("SELECT e FROM Event e WHERE e.group.id = :groupId ORDER BY e.eventDate ASC")
    Page<Event> findByGroupId(@Param("groupId") Long groupId, Pageable pageable);
    
    // Get all events by group (non-paginated) - for internal operations like unsubscribe
    @Query("SELECT e FROM Event e WHERE e.group.id = :groupId ORDER BY e.eventDate ASC")
    List<Event> findAllByGroupId(@Param("groupId") Long groupId);
    
    // OPTIMIZED: JOIN FETCH to prevent N+1 queries - loads group and organiser in one query
    // Note: Activity JOIN commented out since we only support Hiking (activityId = 1) for now
    // Uncomment when adding Running, Climbing, Swimming support
    @Query("SELECT DISTINCT e FROM Event e " +
           "LEFT JOIN FETCH e.group g " +
           "LEFT JOIN FETCH g.primaryOrganiser " +
           // "LEFT JOIN FETCH g.activity " +  // TODO: Uncomment when supporting multiple activities
           "WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
           "ORDER BY e.eventDate ASC")
    Page<Event> findUpcomingEvents(@Param("now") Instant now, Pageable pageable);
    
    // Get upcoming events by activity through group relationship
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
           "AND e.group.activity.id = :activityId ORDER BY e.eventDate ASC")
    Page<Event> findUpcomingEventsByActivityId(
        @Param("now") Instant now,
        @Param("activityId") Long activityId,
        Pageable pageable
    );
    
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
           "AND LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%')) ORDER BY e.eventDate ASC")
    Page<Event> findUpcomingEventsByLocation(
        @Param("now") Instant now,
        @Param("location") String location,
        Pageable pageable
    );
    
    @Query("SELECT e FROM Event e JOIN e.participants p WHERE p.id = :userId ORDER BY e.eventDate ASC")
    Page<Event> findEventsByParticipant(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
           "AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.difficultyLevel) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.group.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.group.primaryOrganiser.displayName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.group.primaryOrganiser.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY e.eventDate ASC")
    Page<Event> searchEvents(@Param("keyword") String keyword, @Param("now") Instant now, Pageable pageable);
    
    // Admin dashboard queries
    @Query("SELECT COUNT(e) FROM Event e WHERE e.group.primaryOrganiser.id = :organiserId")
    Long countByOrganiserId(@Param("organiserId") Long organiserId);
}
