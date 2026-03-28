package com.organiser.platform.controller;

import com.organiser.platform.dto.CalendarEventDTO;
import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.dto.JoinEventRequest;
import com.organiser.platform.dto.EventSearchResponse;
import com.organiser.platform.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {
    
    private final EventService eventService;
    
    @GetMapping("/public")
    public ResponseEntity<Page<EventDTO>> getUpcomingEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("eventDate").ascending());
        return ResponseEntity.ok(eventService.getUpcomingEvents(pageable));
    }
    
    @GetMapping("/public/{id}")
    public ResponseEntity<EventDTO> getEventById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        return ResponseEntity.ok(eventService.getEventById(id, memberId));
    }
    
    @GetMapping("/public/search")
    public ResponseEntity<Page<EventDTO>> searchEvents(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(eventService.searchEvents(keyword, pageable));
    }
    
    @GetMapping("/public/activity/{activityId}")
    public ResponseEntity<Page<EventDTO>> getEventsByActivity(
            @PathVariable Long activityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("eventDate").ascending());
        return ResponseEntity.ok(eventService.getEventsByActivity(activityId, pageable));
    }
    
    @GetMapping("/public/group/{groupId}")
    public ResponseEntity<Page<EventDTO>> getEventsByGroup(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("eventDate").ascending());
        return ResponseEntity.ok(eventService.getEventsByGroup(groupId, pageable));
    }

    @PostMapping
    public ResponseEntity<EventDTO> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.createEvent(request, userId));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.updateEvent(id, request, userId));
    }
    
    @PostMapping("/{id}/publish")
    public ResponseEntity<EventDTO> publishEvent(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.publishEvent(id, userId));
    }
    
    @PostMapping("/{id}/join")
    public ResponseEntity<EventDTO> joinEvent(
            @PathVariable Long id,
            @RequestBody(required = false) JoinEventRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        int guestCount = request != null && request.getGuestCount() != null ? request.getGuestCount() : 0;
        String answer = request != null ? request.getJoinQuestionAnswer() : null;
        return ResponseEntity.ok(eventService.joinEvent(id, userId, guestCount, request != null ? request.getGuestNames() : null, answer));
    }
    
    @PostMapping("/{id}/leave")
    public ResponseEntity<EventDTO> leaveEvent(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.leaveEvent(id, userId));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        eventService.deleteEvent(id, userId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/organiser/my-events")
    public ResponseEntity<Page<EventDTO>> getMyEvents(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean past
    ) {
        Long userId = getUserIdFromAuth(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("eventDate").descending());
        return ResponseEntity.ok(eventService.getEventsByOrganiser(userId, pageable, past));
    }
    
    @GetMapping("/my-joined-events")
    public ResponseEntity<Page<EventDTO>> getMyJoinedEvents(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean past
    ) {
        Long userId = getUserIdFromAuth(authentication);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(eventService.getEventsByParticipant(userId, pageable, past));
    }

    /**
     * Flat search endpoint that supports tokens:
     * :past, :future, :me, :member:<id>, :hosting, :group:<id>
     * plus free text.
     */
    @GetMapping("/search")
    public ResponseEntity<EventSearchResponse> searchEvents(
            Authentication authentication,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = authentication != null ? getUserIdFromAuth(authentication) : null;
        Page<EventDTO> result = eventService.searchEventsAdvanced(query, page, size, userId);
        EventSearchResponse response = EventSearchResponse.builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .pastOnly(query != null && query.contains(":past"))
                .build();
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/public/{id}/participants")
    public ResponseEntity<?> getEventParticipants(
            @PathVariable Long id,
            Authentication authentication
    ) {
        // Get requester ID (null if not authenticated)
        Long requesterId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                requesterId = getUserIdFromAuth(authentication);
            } catch (Exception e) {
                // Not authenticated, requesterId remains null
            }
        }
        return ResponseEntity.ok(eventService.getEventParticipants(id, requesterId));
    }
    
    @GetMapping("/public/{id}/calendar")
    public ResponseEntity<CalendarEventDTO> getCalendarData(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        return ResponseEntity.ok(eventService.getCalendarData(id, memberId));
    }
    
    public static Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        // The principal should be a User object from Spring Security
        // When JWT is parsed, userId is stored in the authorities or can be extracted from token
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            // If we have UserDetails, we need to extract userId from the authentication
            // It should be set as a detail by the JwtAuthenticationFilter
            if (authentication.getDetails() instanceof Long) {
                return (Long) authentication.getDetails();
            }
        }
        
        // Fallback: try to parse from name if it's a Long
        try {
            String name = authentication.getName();
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Unable to extract userId from authentication");
        }
    }
}
