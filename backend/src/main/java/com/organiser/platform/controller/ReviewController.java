package com.organiser.platform.controller;

import com.organiser.platform.dto.EventReviewDTO;
import com.organiser.platform.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {
    
    private final ReviewService reviewService;
    
    @GetMapping("/events/{eventId}/reviews")
    public ResponseEntity<Page<EventReviewDTO>> getEventReviews(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EventReviewDTO> reviews = reviewService.getEventReviews(eventId, page, size);
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/groups/{groupId}/reviews")
    public ResponseEntity<Page<EventReviewDTO>> getGroupReviews(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EventReviewDTO> reviews = reviewService.getGroupReviews(groupId, page, size);
        return ResponseEntity.ok(reviews);
    }
}
