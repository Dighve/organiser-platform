package com.organiser.platform.service;

// ============================================================
// IMPORTS
// ============================================================
import com.organiser.platform.dto.CalendarEventDTO;
import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.dto.TransportLegDTO;
import com.organiser.platform.exception.AlreadyRegisteredException;
import com.organiser.platform.model.*;
import java.math.BigDecimal;
import com.organiser.platform.repository.*;
import com.organiser.platform.util.EventTimingUtils;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;

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
@Slf4j
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
    private final NotificationService notificationService;
    private final BannedMemberRepository bannedMemberRepository;
    private final EventTransportLegRepository eventTransportLegRepository;
    private final WebPushService webPushService;
    private final EmailService emailService;
    
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
                .maxWaitlist(request.getMaxWaitlist())
                .minParticipants(request.getMinParticipants())
                .price(request.getPrice())
                .status(Event.EventStatus.DRAFT)
                .difficultyLevel(request.getDifficultyLevel())
                .paceLevel(request.getPaceLevel())
                .distanceKm(request.getDistanceKm())
                .elevationGainM(request.getElevationGainM())
                .estimatedDurationHours(request.getEstimatedDurationHours())
                .cancellationPolicy(request.getCancellationPolicy())
                .imageUrl(request.getImageUrl())
                .joinQuestion(request.getJoinQuestion())
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

        event.setTransportDetailMode(request.getTransportDetailMode() != null ? request.getTransportDetailMode() : "FREEFORM");
        event.setTransportNotes(request.getTransportNotes());

        event = eventRepository.save(event);

        saveTransportLegs(event, request.getTransportLegs());

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
        Member newHostMember = null;
        if (request.getHostMemberId() != null) {
            newHostMember = memberRepository.findById(request.getHostMemberId())
                    .orElseThrow(() -> new RuntimeException("Host member not found"));
            
            // Verify host is a member of the group
            if (!groupService.isMemberOfGroup(newHostMember.getId(), event.getGroup().getId())) {
                throw new RuntimeException("Host must be a member of the group");
            }
            event.setHostMember(newHostMember);
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
        event.setMaxWaitlist(request.getMaxWaitlist());
        event.setMinParticipants(request.getMinParticipants());
        event.setPrice(request.getPrice());
        event.setDifficultyLevel(request.getDifficultyLevel());
        event.setPaceLevel(request.getPaceLevel());
        event.setDistanceKm(request.getDistanceKm());
        event.setElevationGainM(request.getElevationGainM());
        event.setEstimatedDurationHours(request.getEstimatedDurationHours());
        event.setCancellationPolicy(request.getCancellationPolicy());
        event.setImageUrl(request.getImageUrl());
        event.setJoinQuestion(request.getJoinQuestion());
        
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

        event.setTransportDetailMode(request.getTransportDetailMode() != null ? request.getTransportDetailMode() : "FREEFORM");
        event.setTransportNotes(request.getTransportNotes());

        event = eventRepository.save(event);

        saveTransportLegs(event, request.getTransportLegs());

        // Ensure the new host has a participant record (preserves existing guest count if already registered)
        if (newHostMember != null) {
            // Check if host already has a participant record
            EventParticipant existingHostParticipant = eventParticipantRepository
                    .findByEventIdAndMemberId(event.getId(), newHostMember.getId())
                    .orElse(null);
            
            if (existingHostParticipant == null) {
                // Create new participant record for the host
                EventParticipant hostParticipant = EventParticipant.builder()
                        .event(event)
                        .member(newHostMember)
                        .status(EventParticipant.ParticipationStatus.CONFIRMED)
                        .registrationDate(LocalDateTime.now())
                        .guestCount(0)
                        .build();
                eventParticipantRepository.save(hostParticipant);
            }
            // If participant record exists, keep it as-is (preserves guest count)
        }
        
        return convertToDTO(event);
    }
    
    /**
     * Get event by ID with privacy controls.
     * Public groups: full data visible to everyone.
     * Private groups: full data only visible to group members.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "events", key = "#id + '_' + #memberId")
    public EventDTO getEventById(Long id, Long memberId) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        boolean isPublicGroup = Boolean.TRUE.equals(event.getGroup().getIsPublic());
        
        // Public groups: everyone can see full event details
        if (isPublicGroup) {
            boolean isMember = memberId != null && groupService.isMemberOfGroup(memberId, event.getGroup().getId());
            EventDTO dto = convertToDTO(event, isMember);
            dto.setUserHasAttended(computeUserHasAttended(event, memberId));
            return dto;
        }

        // Private groups: only members see full details
        if (memberId == null || !groupService.isMemberOfGroup(memberId, event.getGroup().getId())) {
            return convertToPartialDTO(event);
        }

        EventDTO dto = convertToDTO(event, true);
        dto.setUserHasAttended(computeUserHasAttended(event, memberId));
        return dto;
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
        return eventRepository.findUpcomingEvents(Instant.now(), EventTimingUtils.startOfToday(), pageable)
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
                Instant.now(), EventTimingUtils.startOfToday(), activityId, pageable
        ).map(this::convertToDTO);
    }
    
    /**
     * Search events by keyword (title, description, location, difficulty, group, organiser).
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> searchEvents(String keyword, Pageable pageable) {
        return eventRepository.searchEvents(keyword, Instant.now(), EventTimingUtils.startOfToday(), pageable)
                .map(this::convertToDTO);
    }

    /**
     * Advanced search with tokens.
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> searchEventsAdvanced(String query, int page, int size, Long userId) {
        SearchTokens tokens = parseTokens(query);
        Pageable pageable = PageRequest.of(page, size, Sort.by("eventDate").ascending());

        Page<Event> results = eventRepository.searchAdvanced(
                tokens.groupId,
                tokens.hostingOnly ? userId : null,
                tokens.memberId != null ? tokens.memberId : (tokens.me ? userId : null),
                tokens.past,
                tokens.future,
                tokens.text,
                Instant.now(),
                EventTimingUtils.startOfToday(),
                pageable
        );

        return results.map(this::convertToDTO);
    }

    private SearchTokens parseTokens(String query) {
        if (query == null) query = "";
        String[] parts = query.split("\\s+");
        boolean past = false;
        boolean future = false;
        boolean me = false;
        boolean hosting = false;
        Long groupId = null;
        Long memberId = null;
        StringBuilder text = new StringBuilder();

        for (String raw : parts) {
            if (raw.isBlank()) continue;
            String t = raw.trim();
            if (t.equalsIgnoreCase(":past")) {
                past = true;
                continue;
            }
            if (t.equalsIgnoreCase(":future")) {
                future = true;
                continue;
            }
            if (t.equalsIgnoreCase(":me")) {
                me = true;
                continue;
            }
            if (t.equalsIgnoreCase(":hosting")) {
                hosting = true;
                continue;
            }
            if (t.startsWith(":group:")) {
                try {
                    groupId = Long.parseLong(t.replace(":group:", ""));
                    continue;
                } catch (NumberFormatException ignored) {}
            }
            if (t.startsWith(":member:")) {
                try {
                    memberId = Long.parseLong(t.replace(":member:", ""));
                    continue;
                } catch (NumberFormatException ignored) {}
            }
            text.append(t).append(" ");
        }

        // default future if neither set
        if (!past && !future) {
            future = true;
        }

        SearchTokens tokens = new SearchTokens();
        tokens.past = past;
        tokens.future = future;
        tokens.me = me;
        tokens.hostingOnly = hosting;
        tokens.groupId = groupId;
        tokens.memberId = memberId;
        tokens.text = text.toString().trim();
        return tokens;
    }

    private static class SearchTokens {
        boolean past;
        boolean future;
        boolean me;
        boolean hostingOnly;
        Long groupId;
        Long memberId;
        String text;
    }

    /**
     * Get all events organised by a specific member.
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> getEventsByOrganiser(Long organiserId, Pageable pageable, boolean past) {
        Page<Event> page = eventRepository.findByOrganiserId(organiserId, pageable);
        Instant now = Instant.now();
        List<EventDTO> filtered = page.getContent().stream()
                .filter(e -> past ? EventTimingUtils.effectiveEnd(e).isBefore(now) : !EventTimingUtils.effectiveEnd(e).isBefore(now))
                .sorted(past ? Comparator.comparing(Event::getEventDate).reversed() : Comparator.comparing(Event::getEventDate))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(filtered, pageable, filtered.size());
    }
    
    /**
     * Get all events a member is participating in.
     */
    @Transactional(readOnly = true)
    public Page<EventDTO> getEventsByParticipant(Long memberId, Pageable pageable, boolean past) {
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

        Instant now = Instant.now();
        // Filter by past/upcoming
        events = events.stream()
                .filter(e -> past ? EventTimingUtils.effectiveEnd(e).isBefore(now) : !EventTimingUtils.effectiveEnd(e).isBefore(now))
                .collect(Collectors.toList());
        
        // Sort: past desc, upcoming asc
        Comparator<Event> comparator = Comparator.comparing(Event::getEventDate);
        if (past) {
            comparator = comparator.reversed();
        }
        events.sort(comparator);
        
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
        
        Member organiser = memberRepository.findById(organiserId)
                .orElseThrow(() -> new RuntimeException("Organiser not found"));
        
        event.setStatus(Event.EventStatus.PUBLISHED);
        event = eventRepository.save(event);
        
        // Create notifications for all group subscribers
        notificationService.createNewEventNotifications(event, organiser);
        
        return convertToDTO(event);
    }
    
    /**
     * Register a member for an event.
     * Checks if event is full and updates status accordingly.
     */
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public EventDTO joinEvent(Long eventId, Long memberId, Integer guestCount, List<String> guestNames, String joinQuestionAnswer) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        EventParticipant existing = eventParticipantRepository.findByEventIdAndMemberId(eventId, memberId).orElse(null);
        
        int guests = guestCount != null && guestCount > 0 ? guestCount : 0;

        // A CANCELLED record means the member previously left — treat them as not currently registered
        boolean existingIsActive = existing != null && existing.getStatus() != EventParticipant.ParticipationStatus.CANCELLED;

        if (event.getStatus() != Event.EventStatus.PUBLISHED) {
            throw new RuntimeException(String.format("Event is not open for registration - %s", event.getStatus()));
        }

        // Determine fullness before capacity check so waitlist path can bypass the slot limit
        int currentHeadcount = getTotalHeadcount(event);
        boolean eventIsFull = event.getMaxParticipants() != null && currentHeadcount >= event.getMaxParticipants();

        if (eventIsFull && event.getMaxWaitlist() == null) {
            throw new RuntimeException("Event is full");
        }

        // Check capacity only when the user will take a real participant slot (not going to waitlist)
        if (!eventIsFull) {
            int currentSlotsForUser = existingIsActive ? 1 + (existing.getGuestCount() != null ? existing.getGuestCount() : 0) : 0;
            int requestedSlots = 1 + guests;
            int newTotal = currentHeadcount - currentSlotsForUser + requestedSlots;
            if (event.getMaxParticipants() != null && newTotal > event.getMaxParticipants()) {
                int remaining = Math.max(0, event.getMaxParticipants() - (currentHeadcount - currentSlotsForUser));
                throw new RuntimeException(remaining <= 0
                        ? "Event is full"
                        : String.format("Only %d spot%s left", remaining, remaining == 1 ? "" : "s"));
            }
        }


        // AUTOMATIC GROUP SUBSCRIPTION (Meetup.com pattern)
        // When joining an event, automatically subscribe to the group if not already a member
        if (event.getGroup() != null) {
            try {
                boolean isMember = groupService.isMemberOfGroup(memberId, event.getGroup().getId());
                if (!isMember) {
                    groupService.subscribeToGroup(event.getGroup().getId(), memberId);
                }
            } catch (Exception e) {
                System.err.println("Warning: Failed to auto-subscribe to group: " + e.getMessage());
            }
        }

        if (existing != null && existingIsActive) {
            // Active record — update guest count / notes (not waitlisted, not cancelled)
            if (existing.getStatus() == EventParticipant.ParticipationStatus.WAITLISTED) {
                // Already on waitlist — just update their guest count
                existing.setGuestCount(guests);
                existing.setNotes(guestNames != null && !guestNames.isEmpty() ? String.join(", ", guestNames) : null);
            } else {
                existing.setGuestCount(guests);
                existing.setNotes(guestNames != null && !guestNames.isEmpty() ? String.join(", ", guestNames) : null);
                if (joinQuestionAnswer != null && !joinQuestionAnswer.isBlank()) {
                    existing.setJoinQuestionAnswer(joinQuestionAnswer);
                }
            }
        } else if (existing != null) {
            // CANCELLED record — reactivate (or add to waitlist if full)
            if (eventIsFull) {
                long waitlistSize = event.getParticipants().stream()
                        .filter(p -> p.getStatus() == EventParticipant.ParticipationStatus.WAITLISTED)
                        .count();
                if (event.getMaxWaitlist() != null && waitlistSize >= event.getMaxWaitlist()) {
                    throw new RuntimeException("The waitlist is full");
                }
                existing.setStatus(EventParticipant.ParticipationStatus.WAITLISTED);
                existing.setWaitlistJoinedAt(LocalDateTime.now());
            } else {
                existing.setStatus(EventParticipant.ParticipationStatus.REGISTERED);
            }
            existing.setCancelledAt(null);
            existing.setGuestCount(guests);
            existing.setNotes(guestNames != null && !guestNames.isEmpty() ? String.join(", ", guestNames) : null);
            if (joinQuestionAnswer != null && !joinQuestionAnswer.isBlank()) {
                existing.setJoinQuestionAnswer(joinQuestionAnswer);
            }
        } else if (eventIsFull) {
            // New participant — add to waitlist
            long waitlistSize = event.getParticipants().stream()
                    .filter(p -> p.getStatus() == EventParticipant.ParticipationStatus.WAITLISTED)
                    .count();
            if (event.getMaxWaitlist() != null && waitlistSize >= event.getMaxWaitlist()) {
                throw new RuntimeException("The waitlist is full");
            }
            EventParticipant participant = EventParticipant.builder()
                    .event(event)
                    .member(member)
                    .status(EventParticipant.ParticipationStatus.WAITLISTED)
                    .registeredAt(LocalDateTime.now())
                    .waitlistJoinedAt(LocalDateTime.now())
                    .guestCount(guests)
                    .notes(guestNames != null && !guestNames.isEmpty() ? String.join(", ", guestNames) : null)
                    .joinQuestionAnswer(joinQuestionAnswer != null && !joinQuestionAnswer.isBlank() ? joinQuestionAnswer : null)
                    .build();
            event.getParticipants().add(participant);
        } else {
            EventParticipant participant = EventParticipant.builder()
                    .event(event)
                    .member(member)
                    .status(EventParticipant.ParticipationStatus.REGISTERED)
                    .registeredAt(LocalDateTime.now())
                    .guestCount(guests)
                    .notes(guestNames != null && !guestNames.isEmpty() ? String.join(", ", guestNames) : null)
                    .joinQuestionAnswer(joinQuestionAnswer != null && !joinQuestionAnswer.isBlank() ? joinQuestionAnswer : null)
                    .build();
            event.getParticipants().add(participant);
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
        
        // Soft-delete: keep the record so hosts can see who left and when
        participant.setStatus(EventParticipant.ParticipationStatus.CANCELLED);
        participant.setCancelledAt(LocalDateTime.now());
        eventParticipantRepository.save(participant);

        // Promote from waitlist only if event hasn't started yet
        boolean eventNotStarted = Instant.now().isBefore(event.getEventDate());
        if (eventNotStarted) {
            promoteFromWaitlist(event);
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

    private static final List<EventParticipant.ParticipationStatus> REVIEW_ELIGIBLE_STATUSES = List.of(
            EventParticipant.ParticipationStatus.REGISTERED,
            EventParticipant.ParticipationStatus.CONFIRMED,
            EventParticipant.ParticipationStatus.ATTENDED
    );

    private boolean computeUserHasAttended(Event event, Long memberId) {
        if (memberId == null || event.getParticipants() == null) return false;
        return event.getParticipants().stream()
                .anyMatch(p -> memberId.equals(p.getMember().getId())
                        && REVIEW_ELIGIBLE_STATUSES.contains(p.getStatus()));
    }
    
    /**
     * Convert Event entity to full EventDTO (for group members).
     */
    // ============================================================
    // PRIVATE HELPERS - Transport legs
    // ============================================================

    private void saveTransportLegs(Event event, List<TransportLegDTO> legDTOs) {
        eventTransportLegRepository.deleteByEventId(event.getId());
        if (legDTOs == null || legDTOs.isEmpty()) {
            return;
        }
        int order = 0;
        for (TransportLegDTO dto : legDTOs) {
            EventTransportLeg leg = EventTransportLeg.builder()
                    .event(event)
                    .direction(dto.getDirection())
                    .mode(dto.getMode())
                    .departureLocation(dto.getDepartureLocation())
                    .arrivalLocation(dto.getArrivalLocation())
                    .departureTime(dto.getDepartureTime())
                    .arrivalTime(dto.getArrivalTime())
                    .openReturn(Boolean.TRUE.equals(dto.getOpenReturn()))
                    .notes(dto.getNotes())
                    .sortOrder(order++)
                    .build();
            eventTransportLegRepository.save(leg);
        }
    }

    private List<TransportLegDTO> toTransportLegDTOs(Event event) {
        return eventTransportLegRepository.findByEventIdOrderBySortOrderAsc(event.getId())
                .stream()
                .map(leg -> TransportLegDTO.builder()
                        .id(leg.getId())
                        .direction(leg.getDirection())
                        .mode(leg.getMode())
                        .departureLocation(leg.getDepartureLocation())
                        .arrivalLocation(leg.getArrivalLocation())
                        .departureTime(leg.getDepartureTime())
                        .arrivalTime(leg.getArrivalTime())
                        .openReturn(leg.getOpenReturn())
                        .notes(leg.getNotes())
                        .sortOrder(leg.getSortOrder())
                        .build())
                .collect(Collectors.toList());
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
        
        // Get participants count (including guests)
        int participantCount = getTotalHeadcount(event);
        
        // Get participant IDs for the DTO
        Set<Long> participantIds = event.getParticipants() != null ?
                event.getParticipants().stream()
                        .filter(p -> p.getStatus() != EventParticipant.ParticipationStatus.CANCELLED
                                  && p.getStatus() != EventParticipant.ParticipationStatus.WAITLISTED)
                        .map(p -> p.getMember().getId())
                        .collect(Collectors.toSet()) :
                new HashSet<>();
        
        // Get host member info if present
        Long hostMemberId = null;
        String hostMemberName = null;
        if (event.getHostMember() != null) {
            boolean hostDeleted = Boolean.FALSE.equals(event.getHostMember().getActive());
            hostMemberId = hostDeleted ? null : event.getHostMember().getId();
            hostMemberName = hostDeleted
                    ? "Deleted user"
                    : (event.getHostMember().getDisplayName() != null && !event.getHostMember().getDisplayName().isEmpty()
                        ? event.getHostMember().getDisplayName()
                        : event.getHostMember().getEmail());
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
                .groupImageUrl(group.getImageUrl())
                .hostMemberId(hostMemberId)
                .hostMemberName(hostMemberName)
                .eventDate(event.getEventDate())
                .endDate(event.getEndDate())
                .registrationDeadline(event.getRegistrationDeadline())
                .location(event.getLocation())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .maxParticipants(event.getMaxParticipants())
                .maxWaitlist(event.getMaxWaitlist())
                .minParticipants(event.getMinParticipants())
                .currentParticipants(participantCount)
                .waitlistCount((int) (event.getParticipants() != null ? event.getParticipants().stream()
                        .filter(p -> p.getStatus() == EventParticipant.ParticipationStatus.WAITLISTED)
                        .count() : 0))
                .participantIds(participantIds)
                .price(event.getPrice())
                .status(event.getStatus())
                .difficultyLevel(event.getDifficultyLevel())
                .paceLevel(event.getPaceLevel())
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
                .userIsGroupMember(true) // Default true for backward compatibility
                .groupIsPublic(group.getIsPublic())
                .joinQuestion(event.getJoinQuestion())
                .groupGuidelines(group.getGroupGuidelines())
                .transportDetailMode(event.getTransportDetailMode())
                .transportNotes(event.getTransportNotes())
                .transportLegs(toTransportLegDTOs(event))
                .build();
    }

    /**
     * Convert Event entity to EventDTO with group membership status.
     */
    private EventDTO convertToDTO(Event event, boolean isGroupMember) {
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
        
        // Get participants count (including guests)
        int participantCount = getTotalHeadcount(event);
        
        // Get participant IDs for the DTO
        Set<Long> participantIds = event.getParticipants() != null ?
                event.getParticipants().stream()
                        .filter(p -> p.getStatus() != EventParticipant.ParticipationStatus.CANCELLED
                                  && p.getStatus() != EventParticipant.ParticipationStatus.WAITLISTED)
                        .map(p -> p.getMember().getId())
                        .collect(Collectors.toSet()) :
                new HashSet<>();
        
        // Get host member info if present
        Long hostMemberId = null;
        String hostMemberName = null;
        if (event.getHostMember() != null) {
            boolean hostDeleted = Boolean.FALSE.equals(event.getHostMember().getActive());
            hostMemberId = hostDeleted ? null : event.getHostMember().getId();
            hostMemberName = hostDeleted
                    ? "Deleted user"
                    : (event.getHostMember().getDisplayName() != null && !event.getHostMember().getDisplayName().isEmpty()
                        ? event.getHostMember().getDisplayName()
                        : event.getHostMember().getEmail());
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
                .groupImageUrl(group.getImageUrl())
                .hostMemberId(hostMemberId)
                .hostMemberName(hostMemberName)
                .eventDate(event.getEventDate())
                .endDate(event.getEndDate())
                .registrationDeadline(event.getRegistrationDeadline())
                .location(event.getLocation())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .maxParticipants(event.getMaxParticipants())
                .maxWaitlist(event.getMaxWaitlist())
                .minParticipants(event.getMinParticipants())
                .currentParticipants(participantCount)
                .waitlistCount((int) (event.getParticipants() != null ? event.getParticipants().stream()
                        .filter(p -> p.getStatus() == EventParticipant.ParticipationStatus.WAITLISTED)
                        .count() : 0))
                .participantIds(participantIds)
                .price(event.getPrice())
                .status(event.getStatus())
                .difficultyLevel(event.getDifficultyLevel())
                .paceLevel(event.getPaceLevel())
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
                .userIsGroupMember(isGroupMember)
                .groupIsPublic(group.getIsPublic())
                .joinQuestion(event.getJoinQuestion())
                .groupGuidelines(group.getGroupGuidelines())
                .transportDetailMode(event.getTransportDetailMode())
                .transportNotes(event.getTransportNotes())
                .transportLegs(toTransportLegDTOs(event))
                .build();
    }

    /**
     * Convert Event entity to partial EventDTO (for non-members of private groups).
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
                .groupImageUrl(group.getImageUrl())
                .eventDate(event.getEventDate())
                .imageUrl(null) // Hide image from non-members
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
                .paceLevel(null)
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
                .userIsGroupMember(false)
                .groupIsPublic(group.getIsPublic())
                .joinQuestion(null)
                .groupGuidelines(group.getGroupGuidelines()) // Include guidelines for joining flow
                .build();
    }
    
    // ============================================================
    // PUBLIC METHODS - Event Participants
    // ============================================================
    
    /**
     * Get all participants for an event.
     * Marks the event organiser with isOrganiser flag.
     * Email addresses are NEVER exposed in participant lists for privacy protection (Meetup.com approach).
     * Users can only see their own email via their profile endpoint.
     * 
     * @param eventId The ID of the event
     * @param requesterId The ID of the user requesting the participant list (null if not authenticated)
     * @return List of participant DTOs without email addresses
     */
    @Transactional(readOnly = true)
    public java.util.List<com.organiser.platform.dto.MemberDTO> getEventParticipants(Long eventId, Long requesterId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Get the primary organiser of the group (who is the event organiser)
        Long eventOrganiserId = event.getGroup().getPrimaryOrganiser().getId();
        Long groupId = event.getGroup().getId();
        
        return event.getParticipants().stream()
                .map(participant -> {
                    Member member = participant.getMember();
                    boolean isDeleted = Boolean.FALSE.equals(member.getActive());
                    boolean isBanned = bannedMemberRepository.existsByGroupIdAndMemberId(groupId, member.getId());
                    
                    // Determine display name: "Deleted user" for deleted, "Former Member" for banned, or actual name
                    String displayName;
                    if (isDeleted) {
                        displayName = "Deleted user";
                    } else if (isBanned) {
                        displayName = "Former Member";
                    } else {
                        displayName = member.getDisplayName();
                    }
                    
                    return com.organiser.platform.dto.MemberDTO.builder()
                            .id((isDeleted || isBanned) ? null : member.getId())
                            // PRIVACY: Never expose email in participant lists (Meetup.com approach)
                            // Users see their own email only via /api/v1/members/me
                            .displayName(displayName)
                            .profilePhotoUrl((isDeleted || isBanned) ? null : member.getProfilePhotoUrl())
                            // Check if this participant is the organiser of THIS event
                            .isOrganiser(member.getId().equals(eventOrganiserId))
                            .joinedAt(participant.getRegistrationDate())
                            .guestCount(participant.getGuestCount())
                            .joinQuestionAnswer(participant.getJoinQuestionAnswer())
                            .deleted(isDeleted || isBanned)
                            .participationStatus(participant.getStatus() != null ? participant.getStatus().name() : null)
                            .cancelledAt(participant.getCancelledAt())
                            .waitlistJoinedAt(participant.getWaitlistJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Mark a participant as no-show. Host-only, event must have started.
     */
    @Transactional
    public void markNoShow(Long eventId, Long targetMemberId, Long requesterId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getHostMember() == null || !event.getHostMember().getId().equals(requesterId)) {
            throw new RuntimeException("Only the host can mark no-shows");
        }
        if (!Instant.now().isAfter(event.getEventDate())) {
            throw new RuntimeException("Cannot mark no-shows before the event has started");
        }

        EventParticipant participant = eventParticipantRepository.findByEventIdAndMemberId(eventId, targetMemberId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));

        participant.setStatus(EventParticipant.ParticipationStatus.NO_SHOW);
        eventParticipantRepository.save(participant);
    }

    /**
     * Unmark a participant's no-show status, reverting to REGISTERED. Host-only.
     */
    @Transactional
    public void unmarkNoShow(Long eventId, Long targetMemberId, Long requesterId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getHostMember() == null || !event.getHostMember().getId().equals(requesterId)) {
            throw new RuntimeException("Only the host can update no-show status");
        }

        EventParticipant participant = eventParticipantRepository.findByEventIdAndMemberId(eventId, targetMemberId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));

        if (participant.getStatus() != EventParticipant.ParticipationStatus.NO_SHOW) {
            throw new RuntimeException("Participant is not marked as no-show");
        }

        participant.setStatus(EventParticipant.ParticipationStatus.REGISTERED);
        eventParticipantRepository.save(participant);
    }

    /**
     * Get calendar data for an event.
     * Returns event details formatted for calendar integration.
     */
    @Transactional(readOnly = true)
    public CalendarEventDTO getCalendarData(Long eventId, Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Check if user is a member of the group OR a participant of the event
        if (memberId != null) {
            boolean isMember = groupService.isMemberOfGroup(memberId, event.getGroup().getId());
            boolean isParticipant = event.getParticipants().stream()
                    .anyMatch(p -> p.getMember().getId().equals(memberId));
            boolean isOrganiser = event.getEventOrganisers().stream()
                    .anyMatch(o -> o.getId().equals(memberId));
            
            log.info("Calendar access check - memberId: {}, isMember: {}, isParticipant: {}, isOrganiser: {}, participantCount: {}", 
                    memberId, isMember, isParticipant, isOrganiser, event.getParticipants().size());
            
            if (!isMember && !isParticipant && !isOrganiser) {
                throw new RuntimeException("You must be a member of the group or a participant of this event to add it to your calendar");
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

    /**
     * Promotes the earliest waitlisted participant to REGISTERED and notifies them.
     * Called after a cancellation, only when the event hasn't started.
     */
    private void promoteFromWaitlist(Event event) {
        if (event.getParticipants() == null) return;

        event.getParticipants().stream()
                .filter(p -> p.getStatus() == EventParticipant.ParticipationStatus.WAITLISTED)
                .min(Comparator.comparing(EventParticipant::getWaitlistJoinedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .ifPresent(next -> {
                    next.setStatus(EventParticipant.ParticipationStatus.REGISTERED);
                    eventParticipantRepository.save(next);

                    // Send push notification
                    try {
                        webPushService.sendToMember(
                                next.getMember().getId(),
                                "You're in! 🎉",
                                "A spot opened up — you've been moved off the waitlist for " + event.getTitle(),
                                "/events/" + event.getId()
                        );
                    } catch (Exception e) {
                        System.err.println("Warning: Failed to send waitlist promotion push: " + e.getMessage());
                    }

                    // Send email notification
                    try {
                        emailService.sendWaitlistPromotionEmail(next.getMember(), event.getTitle(),
                                event.getGroup().getName(), event.getId());
                    } catch (Exception e) {
                        System.err.println("Warning: Failed to send waitlist promotion email: " + e.getMessage());
                    }
                });
    }

    /**
     * Calculates total headcount including guests (participant + guestCount).
     */
    private int getTotalHeadcount(Event event) {
        if (event.getParticipants() == null) {
            return 0;
        }
        return event.getParticipants().stream()
                .filter(p -> p.getStatus() != EventParticipant.ParticipationStatus.CANCELLED
                          && p.getStatus() != EventParticipant.ParticipationStatus.WAITLISTED)
                .mapToInt(p -> 1 + (p.getGuestCount() != null ? p.getGuestCount() : 0))
                .sum();
    }

    // ============================================================
    // SUPPORT: Member deletion helpers
    // ============================================================
    public boolean isHostOfUpcomingEvents(Long memberId) {
        return eventRepository.existsByHostMemberIdAndEventDateAfter(memberId, Instant.now());
    }

    @Transactional
    public void removeFutureParticipationsForMember(Long memberId) {
        eventParticipantRepository.deleteFutureParticipations(memberId, Instant.now());
    }

}
