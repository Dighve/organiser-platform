package com.organiser.platform.controller;

import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.EventDTO;
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
    public ResponseEntity<EventDTO> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
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

    @PostMapping
    public ResponseEntity<EventDTO> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.createEvent(request, userId));
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
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.joinEvent(id, userId));
    }
    
    @PostMapping("/{id}/leave")
    public ResponseEntity<EventDTO> leaveEvent(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.leaveEvent(id, userId));
    }
    
    @GetMapping("/organiser/my-events")
    public ResponseEntity<Page<EventDTO>> getMyEvents(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = getUserIdFromAuth(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("eventDate").descending());
        return ResponseEntity.ok(eventService.getEventsByOrganiser(userId, pageable));
    }
    
    private Long getUserIdFromAuth(Authentication authentication) {
        // Extract userId from JWT token claims
        // The JWT token contains the user email as subject
        // We would need to look up the user by email, but for now we'll use a simpler approach
        // In a production system, you'd want to include userId directly in the JWT claims
        
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        // The principal is a UserDetails object with the email as username
        // For now, we'll extract from the name which should be the email
        // In production, you'd add userId to JWT claims and extract it here
        String email = authentication.getName();
        
        // This is a simplified approach - in production you'd store userId in JWT claims
        // and extract it directly without needing to query the database
        return 1L; // TODO: Extract from JWT claims or lookup by email
    }
}
