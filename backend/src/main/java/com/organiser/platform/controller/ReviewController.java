package com.organiser.platform.controller;

import com.organiser.platform.dto.CreateReviewRequest;
import com.organiser.platform.dto.EventReviewDTO;
import com.organiser.platform.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
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
    
    @GetMapping("/events/{eventId}/reviews/my-review")
    public ResponseEntity<EventReviewDTO> getMyReviewForEvent(@PathVariable Long eventId) {
        EventReviewDTO review = reviewService.getMyReviewForEvent(eventId);
        if (review == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(review);
    }
    
    @GetMapping("/groups/{groupId}/reviews")
    public ResponseEntity<Page<EventReviewDTO>> getGroupReviews(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EventReviewDTO> reviews = reviewService.getGroupReviews(groupId, page, size);
        return ResponseEntity.ok(reviews);
    }
    
    @PostMapping("/events/{eventId}/reviews")
    public ResponseEntity<EventReviewDTO> submitReview(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateReviewRequest request) {
        EventReviewDTO review = reviewService.submitReview(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }
    
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<EventReviewDTO> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody CreateReviewRequest request) {
        EventReviewDTO review = reviewService.updateReview(reviewId, request);
        return ResponseEntity.ok(review);
    }
}
