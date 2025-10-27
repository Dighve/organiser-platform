package com.organiser.platform.controller;

import com.organiser.platform.dto.CommentDTO;
import com.organiser.platform.dto.CreateCommentRequest;
import com.organiser.platform.dto.CreateReplyRequest;
import com.organiser.platform.dto.ReplyDTO;
import com.organiser.platform.service.EventCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventCommentController {
    
    private final EventCommentService commentService;
    
    /**
     * Get all comments for an event (public endpoint)
     */
    @GetMapping("/{eventId}/comments")
    public ResponseEntity<List<CommentDTO>> getEventComments(
            @PathVariable Long eventId,
            Authentication authentication
    ) {
        Long memberId = authentication != null ? getUserIdFromAuth(authentication) : null;
        return ResponseEntity.ok(commentService.getEventComments(eventId, memberId));
    }
    
    /**
     * Create a new comment on an event (authenticated)
     */
    @PostMapping("/{eventId}/comments")
    public ResponseEntity<CommentDTO> createComment(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(commentService.createComment(eventId, request, userId));
    }
    
    /**
     * Update a comment (authenticated)
     */
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentDTO> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(commentService.updateComment(commentId, request, userId));
    }
    
    /**
     * Delete a comment (authenticated)
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Create a reply to a comment (authenticated)
     */
    @PostMapping("/comments/{commentId}/replies")
    public ResponseEntity<ReplyDTO> createReply(
            @PathVariable Long commentId,
            @Valid @RequestBody CreateReplyRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(commentService.createReply(commentId, request, userId));
    }
    
    /**
     * Update a reply (authenticated)
     */
    @PutMapping("/replies/{replyId}")
    public ResponseEntity<ReplyDTO> updateReply(
            @PathVariable Long replyId,
            @Valid @RequestBody CreateReplyRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(commentService.updateReply(replyId, request, userId));
    }
    
    /**
     * Delete a reply (authenticated)
     */
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(
            @PathVariable Long replyId,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        commentService.deleteReply(replyId, userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Extract userId from JWT authentication
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.getDetails() instanceof Long) {
            return (Long) authentication.getDetails();
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
