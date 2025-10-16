package com.organiser.platform.service;

import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.model.*;
import java.math.BigDecimal;
import com.organiser.platform.repository.*;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventService {
    
    private final EventRepository eventRepository;
    private final MemberRepository memberRepository;
    private final GroupRepository groupRepository;
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO createEvent(CreateEventRequest request, Long organiserId) {
        // Find the member (organiser)
        Member organiser = memberRepository.findById(organiserId)
                .orElseThrow(() -> new RuntimeException("Organiser not found"));
        
        // Find the group for this event (assuming the organiser is part of a group)
        Group group = groupRepository.findByPrimaryOrganiserId(organiserId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No group found for the organiser"));
        
        // Get the activity from the group
        Activity activity = group.getActivity();
        
        // Build the event with all required fields
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .group(group)
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
        return convertToDTO(event);
    }
    
    @Cacheable(value = "events", key = "#id")
    public EventDTO getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return convertToDTO(event);
    }
    
    @Cacheable(value = "events", key = "'upcoming_' + #pageable.pageNumber")
    public Page<EventDTO> getUpcomingEvents(Pageable pageable) {
        return eventRepository.findUpcomingEvents(LocalDateTime.now(), pageable)
                .map(this::convertToDTO);
    }
    
    public Page<EventDTO> getEventsByActivity(Long activityId, Pageable pageable) {
        return eventRepository.findUpcomingEventsByActivityId(
                LocalDateTime.now(), activityId, pageable
        ).map(this::convertToDTO);
    }
    
    public Page<EventDTO> searchEvents(String keyword, Pageable pageable) {
        return eventRepository.searchEvents(keyword, LocalDateTime.now(), pageable)
                .map(this::convertToDTO);
    }
    
    public Page<EventDTO> getEventsByOrganiser(Long organiserId, Pageable pageable) {
        return eventRepository.findByOrganiserId(organiserId, pageable)
                .map(this::convertToDTO);
    }
    
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
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO joinEvent(Long eventId, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Check if the event is full
        if (event.getMaxParticipants() != null && 
            event.getParticipants().size() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event is full");
        }
        
        if (event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new RuntimeException("Event is not open for registration");
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
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO leaveEvent(Long eventId, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Find the participant record for this member and event
        EventParticipant participant = event.getParticipants().stream()
                .filter(p -> p.getMember().getId().equals(memberId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Member is not registered for this event"));
        
        // Remove the participant
        event.getParticipants().remove(participant);
        
        // If the event was full, change status back to PUBLISHED to allow new registrations
        if (event.getStatus() == Event.EventStatus.FULL) {
            event.setStatus(Event.EventStatus.PUBLISHED);
        }
        
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
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
        
        return EventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .organiserId(primaryOrganiser.getId())
                .organiserName(primaryOrganiser.getDisplayName() != null ? primaryOrganiser.getDisplayName() : "")
                .activityTypeId(activity.getId())
                .activityTypeName(activity.getName())
                .groupId(group.getId())
                .groupName(group.getName())
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
}
