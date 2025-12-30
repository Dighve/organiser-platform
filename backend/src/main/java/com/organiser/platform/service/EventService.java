package com.organiser.platform.service;

// ============================================================
// IMPORTS
// ============================================================
import com.organiser.platform.dto.CalendarEventDTO;
import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.exception.AlreadyRegisteredException;
import com.organiser.platform.model.*;
import java.math.BigDecimal;
import com.organiser.platform.repository.*;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;

// ============================================================
// SERVICE CLASS
// ============================================================
/**
 * Service for managing hiking events and event participation.
 * Handles event creation, updates, publishing, and participant management.
 * 
 * @author OutMeets Platform Team
 */
@Service
@RequiredArgsConstructor
public class EventService {
    
    // ============================================================
    // DEPENDENCIES
    // ============================================================
    private final EventRepository eventRepository;
    private final MemberRepository memberRepository;
    private final GroupRepository groupRepository;
    private final GroupService groupService;
    private final EventParticipantRepository eventParticipantRepository;
    
    // ============================================================
    // PUBLIC METHODS - Event CRUD Operations
    // ============================================================
    
    /**
     * Create a new event for a group.
     * Automatically adds the organiser as a confirmed participant.
     */
    @Transactional
    @CacheEvict(value = "upcomingEvents", allEntries = true)
    public EventDTO createEvent(CreateEventRequest request, Long organiserId) {
        // Find the member (organiser)
        Member organiser = memberRepository.findById(organiserId)
                .orElseThrow(() -> new RuntimeException("Organiser not found"));
        
        // Find the group by ID
        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Verify that the user is the organiser of this group
        if (!group.getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("You are not the organiser of this group");
        }
        
        // Get the activity from the group
        Activity activity = group.getActivity();
        
        // Get host member if specified
        Member hostMember = null;
        if (request.getHostMemberId() != null) {
            hostMember = memberRepository.findById(request.getHostMemberId())
                    .orElseThrow(() -> new RuntimeException("Host member not found"));
            
            // Verify host is a member of the group
            if (!groupService.isMemberOfGroup(hostMember.getId(), group.getId())) {
                throw new RuntimeException("Host must be a member of the group");
            }
        }
        
        // Build the event with all required fields
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .group(group)
                .hostMember(hostMember)
                .eventDate(request.getEventDate())
                .endDate(request.getEndDate())
                .registrationDeadline(request.getRegistrationDeadline())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .maxParticipants(request.getMaxParticipants())
                .minParticipants(request.getMinParticipants())
                .price(request.getPrice())
                .status(Event.EventStatus.DRAFT)
                .difficultyLevel(request.getDifficultyLevel())
                .distanceKm(request.getDistanceKm())
                .elevationGainM(request.getElevationGainM())
                .estimatedDurationHours(request.getEstimatedDurationHours())
                .cancellationPolicy(request.getCancellationPolicy())
                .imageUrl(request.getImageUrl())
                .build();
        
        // Set additional collections if needed
        if (request.getAdditionalImages() != null) {
            event.setAdditionalImages(new HashSet<>(request.getAdditionalImages()));
        }
        if (request.getRequirements() != null) {
            event.setRequirements(new HashSet<>(request.getRequirements()));
        }
        
        if (request.getIncludedItems() != null) {
            event.setIncludedItems(new HashSet<>(request.getIncludedItems()));
        }
        
        event = eventRepository.save(event);
        
        // Automatically add the host as a participant (if host is specified)
        if (event.getHostMember() != null) {
            EventParticipant hostParticipant = EventParticipant.builder()
                    .event(event)
                    .member(event.getHostMember())
                    .status(EventParticipant.ParticipationStatus.CONFIRMED)
                    .registrationDate(LocalDateTime.now())
                    .build();
            // Save the participant explicitly to the repository
            eventParticipantRepository.save(hostParticipant);
            
            // Refresh the event to load the updated participants collection
            event = eventRepository.findById(event.getId())
                    .orElseThrow(() -> new RuntimeException("Event not found after save"));
        }
        
        return convertToDTO(event);
    }
    
    /**
     * Update an existing event.
     * Only the group organiser can update events.
     */
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO updateEvent(Long eventId, CreateEventRequest request, Long organiserId) {
        // Find the existing event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Verify that the user is the organiser of the group that owns this event
        if (!event.getGroup().getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("You are not authorized to update this event");
        }
        
        // Update host member if specified
        if (request.getHostMemberId() != null) {
            Member hostMember = memberRepository.findById(request.getHostMemberId())
                    .orElseThrow(() -> new RuntimeException("Host member not found"));
            
            // Verify host is a member of the group
            if (!groupService.isMemberOfGroup(hostMember.getId(), event.getGroup().getId())) {
                throw new RuntimeException("Host must be a member of the group");
            }
            event.setHostMember(hostMember);
        } else {
            event.setHostMember(null);
        }
        
        // Update all fields
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setEndDate(request.getEndDate());
        event.setRegistrationDeadline(request.getRegistrationDeadline());
        event.setLocation(request.getLocation());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setMinParticipants(request.getMinParticipants());
        event.setPrice(request.getPrice());
        event.setDifficultyLevel(request.getDifficultyLevel());
        event.setDistanceKm(request.getDistanceKm());
        event.setElevationGainM(request.getElevationGainM());
        event.setEstimatedDurationHours(request.getEstimatedDurationHours());
        event.setCancellationPolicy(request.getCancellationPolicy());
        event.setImageUrl(request.getImageUrl());
        
        // Update collections
        if (request.getAdditionalImages() != null) {
            event.setAdditionalImages(new HashSet<>(request.getAdditionalImages()));
        }
        if (request.getRequirements() != null) {
            event.setRequirements(new HashSet<>(request.getRequirements()));
        }
        if (request.getIncludedItems() != null) {
            event.setIncludedItems(new HashSet<>(request.getIncludedItems()));
        }
        
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
    /**
     * Get event by ID with privacy controls.
     * Non-members see only partial event data.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "events", key = "#id + '_' + #memberId")
    public EventDTO getEventById(Long id, Long memberId) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // If group is public, show full event details to everyone
        if (event.getGroup().getIsPublic()) {
            return convertToDTO(event);
        }
        
        // For private groups, check if user is a member
        // If not a member, return partial event data (title, date, organiser, activity only)
        if (memberId == null || !groupService.isMemberOfGroup(memberId, event.getGroup().getId())) {
            return convertToPartialDTO(event);
        }
        
        return convertToDTO(event);
    }
    
    /**
     * Get event by ID (backward compatibility - public access).
     */
    @Transactional(readOnly = true)
    public EventDTO getEventById(Long id) {
        return getEventById(id, null);
    }
    
    /**
     * Get all upcoming published events.
     * Cached for 5 minutes to improve performance.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "upcomingEvents", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<EventDTO> getUpcomingEvents(Pageable pageable) {
        return eventRepository.findUpcomingEvents(Instant.now(), pageable)
                .map(this::convertToDTO);
    }
    
    // ============================================================
    // PUBLIC METHODS - Event Queries
    // ============================================================
    
    /**
     * Get upcoming events filtered by activity type.
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> getEventsByActivity(Long activityId, Pageable pageable) {
        return eventRepository.findUpcomingEventsByActivityId(
                Instant.now(), activityId, pageable
        ).map(this::convertToDTO);
    }
    
    /**
     * Search events by keyword (title, description, location, difficulty, group, organiser).
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> searchEvents(String keyword, Pageable pageable) {
        return eventRepository.searchEvents(keyword, Instant.now(), pageable)
                .map(this::convertToDTO);
    }
    
    /**
     * Get all events organised by a specific member.
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> getEventsByOrganiser(Long organiserId, Pageable pageable) {
        return eventRepository.findByOrganiserId(organiserId, pageable)
                .map(this::convertToDTO);
    }
    
    /**
     * Get all events a member is participating in.
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> getEventsByParticipant(Long memberId, Pageable pageable) {
        // Get all event participations for this member
        List<EventParticipant> participations = eventParticipantRepository.findByMemberId(memberId);
        
        // Extract event IDs
        List<Long> eventIds = participations.stream()
                .map(ep -> ep.getEvent().getId())
                .collect(Collectors.toList());
        
        if (eventIds.isEmpty()) {
            return Page.empty(pageable);
        }
        
        // Get events by IDs
        List<Event> events = eventRepository.findAllById(eventIds);
        
        // Sort by event date ascending
        events.sort(Comparator.comparing(Event::getEventDate));
        
        // Convert to DTOs
        List<EventDTO> eventDTOs = events.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Create pageable response
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), eventDTOs.size());
        List<EventDTO> pageContent = eventDTOs.subList(start, end);
        
        return new PageImpl<>(pageContent, pageable, eventDTOs.size());
    }
    
    /**
     * Get all events for a specific group.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "events", key = "'group_' + #groupId + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Page<EventDTO> getEventsByGroup(Long groupId, Pageable pageable) {
        return eventRepository.findByGroupId(groupId, pageable)
                .map(this::convertToDTO);
    }
    
    // ============================================================
    // PUBLIC METHODS - Event Operations
    // ============================================================
    
    /**
     * Publish an event (change status from DRAFT to PUBLISHED).
     * Only the group organiser can publish events.
     */
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO publishEvent(Long eventId, Long organiserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Check if the requesting user is the primary organiser of the group
        if (!event.getGroup().getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("Unauthorized: Only the group organiser can publish events");
        }
        
        event.setStatus(Event.EventStatus.PUBLISHED);
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
    /**
     * Register a member for an event.
     * Checks if event is full and updates status accordingly.
     */
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO joinEvent(Long eventId, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // CHECK IF ALREADY REGISTERED (prevent duplicate registrations)
        // Note: This is expected behavior when users click "Join" multiple times or refresh after joining
        boolean alreadyRegistered = eventParticipantRepository.findByEventIdAndMemberId(eventId, memberId).isPresent();
        if (alreadyRegistered) {
            throw new AlreadyRegisteredException("You are already registered for this event");
        }
        
        // Check if the event is full
        if (event.getMaxParticipants() != null && 
            event.getParticipants().size() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event is full");
        }
        
        if (event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new RuntimeException(String.format("Event is not open for registration - %s", event.getStatus()));
        }
        
        // AUTOMATIC GROUP SUBSCRIPTION (Meetup.com pattern)
        // When joining an event, automatically subscribe to the group if not already a member
        if (event.getGroup() != null) {
            try {
                // Check if user is already a member of the group
                boolean isMember = groupService.isMemberOfGroup(memberId, event.getGroup().getId());
                if (!isMember) {
                    // Auto-subscribe to group (this will create ACTIVE subscription)
                    groupService.subscribeToGroup(event.getGroup().getId(), memberId);
                }
            } catch (Exception e) {
                // Log but don't fail the event join if group subscription fails
                System.err.println("Warning: Failed to auto-subscribe to group: " + e.getMessage());
            }
        }
        
        // Create a new event participant
        EventParticipant participant = EventParticipant.builder()
                .event(event)
                .member(member)
                .status(EventParticipant.ParticipationStatus.REGISTERED)
                .registeredAt(LocalDateTime.now())
                .build();
        
        // Add participant to the event
        event.getParticipants().add(participant);
        
        // Update event status if it's now full
        if (event.getMaxParticipants() != null && 
            event.getParticipants().size() >= event.getMaxParticipants()) {
            event.setStatus(Event.EventStatus.FULL);
        }
        
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
    /**
     * Unregister a member from an event.
     * Updates event status if it was previously full.
     */
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO leaveEvent(Long eventId, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Find the participant record for this member and event
        EventParticipant participant = eventParticipantRepository.findByEventIdAndMemberId(eventId, memberId)
                .orElseThrow(() -> new RuntimeException("Member is not registered for this event"));
        
        // Remove the participant from event's collection
        event.getParticipants().remove(participant);
        
        // Explicitly delete the participant from database
        eventParticipantRepository.delete(participant);
        
        // If the event was full, change status back to PUBLISHED to allow new registrations
        if (event.getStatus() == Event.EventStatus.FULL) {
            event.setStatus(Event.EventStatus.PUBLISHED);
        }
        
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
    /**
     * Delete an event.
     * Only the group organiser can delete events.
     */
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public void deleteEvent(Long eventId, Long organiserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Verify that the user is the organiser of the group that owns this event
        Group group = event.getGroup();
        if (!group.getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("You are not authorized to delete this event");
        }
        
        eventRepository.delete(event);
    }
    
    // ============================================================
    // PRIVATE METHODS - Data Conversion
    // ============================================================
    
    /**
     * Convert Event entity to full EventDTO (for group members).
     */
    private EventDTO convertToDTO(Event event) {
        if (event == null) {
            return null;
        }
        
        // Get the group
        Group group = event.getGroup();
        if (group == null) {
            throw new IllegalStateException("Event must belong to a group");
        }
        
        // Get the primary organiser from the group
        Member primaryOrganiser = group.getPrimaryOrganiser();
        if (primaryOrganiser == null) {
            throw new IllegalStateException("Group must have a primary organiser");
        }
        
        // Get the activity from the group
        Activity activity = group.getActivity();
        if (activity == null) {
            throw new IllegalStateException("Group must be associated with an activity");
        }
        
        // Get participants count
        int participantCount = event.getParticipants() != null ? event.getParticipants().size() : 0;
        
        // Get participant IDs for the DTO
        Set<Long> participantIds = event.getParticipants() != null ?
                event.getParticipants().stream()
                        .map(p -> p.getMember().getId())
                        .collect(Collectors.toSet()) :
                new HashSet<>();
        
        // Get host member info if present
        Long hostMemberId = null;
        String hostMemberName = null;
        if (event.getHostMember() != null) {
            hostMemberId = event.getHostMember().getId();
            hostMemberName = event.getHostMember().getDisplayName() != null && !event.getHostMember().getDisplayName().isEmpty()
                    ? event.getHostMember().getDisplayName()
                    : event.getHostMember().getEmail();
        }
        
        return EventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .organiserId(primaryOrganiser.getId())
                .organiserName(primaryOrganiser.getDisplayName() != null && !primaryOrganiser.getDisplayName().isEmpty() 
                        ? primaryOrganiser.getDisplayName() 
                        : primaryOrganiser.getEmail())
                .activityTypeId(activity.getId())
                .activityTypeName(activity.getName())
                .groupId(group.getId())
                .groupName(group.getName())
                .hostMemberId(hostMemberId)
                .hostMemberName(hostMemberName)
                .eventDate(event.getEventDate())
                .endDate(event.getEndDate())
                .registrationDeadline(event.getRegistrationDeadline())
                .location(event.getLocation())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .maxParticipants(event.getMaxParticipants())
                .minParticipants(event.getMinParticipants())
                .currentParticipants(participantCount)
                .participantIds(participantIds)
                .price(event.getPrice())
                .status(event.getStatus())
                .difficultyLevel(event.getDifficultyLevel())
                .distanceKm(event.getDistanceKm())
                .elevationGainM(event.getElevationGainM())
                .estimatedDurationHours(event.getEstimatedDurationHours())
                .imageUrl(event.getImageUrl())
                .additionalImages(event.getAdditionalImages() != null ? new HashSet<>(event.getAdditionalImages()) : new HashSet<>())
                .requirements(event.getRequirements() != null ? new HashSet<>(event.getRequirements()) : new HashSet<>())
                .includedItems(event.getIncludedItems() != null ? new HashSet<>(event.getIncludedItems()) : new HashSet<>())
                .cancellationPolicy(event.getCancellationPolicy())
                .averageRating(event.getAverageRating() != null ? new BigDecimal(event.getAverageRating()) : BigDecimal.ZERO)
                .totalReviews(event.getTotalReviews() != null ? event.getTotalReviews() : 0)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
    
    /**
     * Convert Event entity to partial EventDTO (for non-members).
     * Only includes basic information: title, date, organiser, activity type, group info, image.
     */
    private EventDTO convertToPartialDTO(Event event) {
        if (event == null) {
            return null;
        }
        
        Group group = event.getGroup();
        if (group == null) {
            throw new IllegalStateException("Event must belong to a group");
        }
        
        Member primaryOrganiser = group.getPrimaryOrganiser();
        if (primaryOrganiser == null) {
            throw new IllegalStateException("Group must have a primary organiser");
        }
        
        Activity activity = group.getActivity();
        if (activity == null) {
            throw new IllegalStateException("Group must be associated with an activity");
        }
        
        // Return DTO with only basic information - no sensitive details
        return EventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .organiserId(primaryOrganiser.getId())
                .organiserName(primaryOrganiser.getDisplayName() != null && !primaryOrganiser.getDisplayName().isEmpty() 
                        ? primaryOrganiser.getDisplayName() 
                        : primaryOrganiser.getEmail())
                .activityTypeId(activity.getId())
                .activityTypeName(activity.getName())
                .groupId(group.getId())
                .groupName(group.getName())
                .eventDate(event.getEventDate())
                .imageUrl(event.getImageUrl())
                .status(event.getStatus())
                .createdAt(event.getCreatedAt())
                // All other fields are null/empty for non-members
                .description(null)
                .endDate(null)
                .registrationDeadline(null)
                .location(null)
                .latitude(null)
                .longitude(null)
                .maxParticipants(null)
                .minParticipants(null)
                .currentParticipants(0)
                .participantIds(new HashSet<>())
                .price(null)
                .difficultyLevel(null)
                .distanceKm(null)
                .elevationGainM(null)
                .estimatedDurationHours(null)
                .additionalImages(new HashSet<>())
                .requirements(new HashSet<>())
                .includedItems(new HashSet<>())
                .cancellationPolicy(null)
                .averageRating(BigDecimal.ZERO)
                .totalReviews(0)
                .updatedAt(null)
                .build();
    }
    
    // ============================================================
    // PUBLIC METHODS - Event Participants
    // ============================================================
    
    /**
     * Get all participants for an event.
     * Marks the event organiser with isOrganiser flag.
     */
    @Transactional(readOnly = true)
    public java.util.List<com.organiser.platform.dto.MemberDTO> getEventParticipants(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Get the primary organiser of the group (who is the event organiser)
        Long eventOrganiserId = event.getGroup().getPrimaryOrganiser().getId();
        
        return event.getParticipants().stream()
                .map(participant -> com.organiser.platform.dto.MemberDTO.builder()
                        .id(participant.getMember().getId())
                        .email(participant.getMember().getEmail())
                        .displayName(participant.getMember().getDisplayName())
                        .profilePhotoUrl(participant.getMember().getProfilePhotoUrl())
                        // Check if this participant is the organiser of THIS event
                        .isOrganiser(participant.getMember().getId().equals(eventOrganiserId))
                        .joinedAt(participant.getRegistrationDate())
                        .build())
                .collect(Collectors.toList());
    }
    
    /**
     * Get calendar data for an event.
     * Returns event details formatted for calendar integration.
     */
    @Transactional(readOnly = true)
    public CalendarEventDTO getCalendarData(Long eventId, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Check if user is a member of the group (privacy check)
        if (memberId != null) {
            boolean isMember = groupService.isMemberOfGroup(memberId, event.getGroup().getId());
            if (!isMember) {
                throw new RuntimeException("You must be a member of the group to add this event to your calendar");
            }
        }
        
        // Build calendar event description with all relevant details
        StringBuilder description = new StringBuilder();
        description.append(event.getDescription() != null ? event.getDescription() : "");
        
        if (event.getDifficultyLevel() != null) {
            description.append("\n\nDifficulty: ").append(event.getDifficultyLevel());
        }
        
        if (event.getDistanceKm() != null) {
            description.append("\nDistance: ").append(event.getDistanceKm()).append(" km");
        }
        
        if (event.getElevationGainM() != null) {
            description.append("\nElevation Gain: ").append(event.getElevationGainM()).append(" m");
        }
        
        if (event.getEstimatedDurationHours() != null) {
            description.append("\nEstimated Duration: ").append(event.getEstimatedDurationHours()).append(" hours");
        }
        
        if (event.getRequirements() != null && !event.getRequirements().isEmpty()) {
            description.append("\n\nRequired Gear: ").append(String.join(", ", event.getRequirements()));
        }
        
        // Calculate end time if not provided (use estimated duration or default 3 hours)
        Instant endTime = event.getEndDate();
        if (endTime == null && event.getEstimatedDurationHours() != null) {
            long hoursToAdd = event.getEstimatedDurationHours().longValue();
            endTime = event.getEventDate().plusSeconds(hoursToAdd * 3600);
        } else if (endTime == null) {
            // Default to 3 hours if no end time or duration specified
            endTime = event.getEventDate().plusSeconds(3 * 3600);
        }
        
        return CalendarEventDTO.builder()
                .title(event.getTitle())
                .description(description.toString())
                .location(event.getLocation())
                .startTime(event.getEventDate())
                .endTime(endTime)
                .organiserName(event.getGroup().getPrimaryOrganiser().getDisplayName() != null 
                    ? event.getGroup().getPrimaryOrganiser().getDisplayName() 
                    : event.getGroup().getPrimaryOrganiser().getEmail())
                .eventUrl("https://www.outmeets.com/events/" + eventId)
                .build();
    }
}
