package com.organiser.platform.service;

import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.model.ActivityType;
import com.organiser.platform.model.Event;
import com.organiser.platform.model.User;
import com.organiser.platform.repository.ActivityTypeRepository;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final ActivityTypeRepository activityTypeRepository;
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO createEvent(CreateEventRequest request, Long organiserId) {
        User organiser = userRepository.findById(organiserId)
                .orElseThrow(() -> new RuntimeException("Organiser not found"));
        
        ActivityType activityType = activityTypeRepository.findById(request.getActivityTypeId())
                .orElseThrow(() -> new RuntimeException("Activity type not found"));
        
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .organiser(organiser)
                .activityType(activityType)
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
                .imageUrl(request.getImageUrl())
                .additionalImages(request.getAdditionalImages())
                .requirements(request.getRequirements())
                .includedItems(request.getIncludedItems())
                .cancellationPolicy(request.getCancellationPolicy())
                .build();
        
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
    
    public Page<EventDTO> getEventsByActivityType(Long activityTypeId, Pageable pageable) {
        return eventRepository.findUpcomingEventsByActivityType(
                LocalDateTime.now(), activityTypeId, pageable
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
        
        if (!event.getOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        event.setStatus(Event.EventStatus.PUBLISHED);
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO joinEvent(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (event.isFull()) {
            throw new RuntimeException("Event is full");
        }
        
        if (event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new RuntimeException("Event is not open for registration");
        }
        
        event.getParticipants().add(user);
        
        if (event.isFull()) {
            event.setStatus(Event.EventStatus.FULL);
        }
        
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO leaveEvent(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        event.getParticipants().remove(user);
        
        if (event.getStatus() == Event.EventStatus.FULL) {
            event.setStatus(Event.EventStatus.PUBLISHED);
        }
        
        event = eventRepository.save(event);
        return convertToDTO(event);
    }
    
    private EventDTO convertToDTO(Event event) {
        return EventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .organiserId(event.getOrganiser().getId())
                .organiserName(event.getOrganiser().getFirstName() + " " + event.getOrganiser().getLastName())
                .activityTypeId(event.getActivityType().getId())
                .activityTypeName(event.getActivityType().getName())
                .eventDate(event.getEventDate())
                .endDate(event.getEndDate())
                .registrationDeadline(event.getRegistrationDeadline())
                .location(event.getLocation())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .maxParticipants(event.getMaxParticipants())
                .minParticipants(event.getMinParticipants())
                .currentParticipants(event.getCurrentParticipantCount())
                .price(event.getPrice())
                .status(event.getStatus())
                .difficultyLevel(event.getDifficultyLevel())
                .distanceKm(event.getDistanceKm())
                .elevationGainM(event.getElevationGainM())
                .estimatedDurationHours(event.getEstimatedDurationHours())
                .imageUrl(event.getImageUrl())
                .additionalImages(event.getAdditionalImages())
                .requirements(event.getRequirements())
                .includedItems(event.getIncludedItems())
                .cancellationPolicy(event.getCancellationPolicy())
                .averageRating(event.getAverageRating())
                .totalReviews(event.getTotalReviews())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
