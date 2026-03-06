package com.organiser.platform.controller;

import com.organiser.platform.dto.CreateFeedbackRequest;
import com.organiser.platform.dto.FeedbackDTO;
import com.organiser.platform.model.Feedback;
import com.organiser.platform.service.FeedbackService;
import static com.organiser.platform.controller.EventController.getUserIdFromAuth;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackDTO> submitFeedback(@Valid @RequestBody CreateFeedbackRequest request,
                                                      Authentication authentication) {
        Long memberId = null;
        if (authentication != null) {
            try {
                memberId = getUserIdFromAuth(authentication);
            } catch (Exception ignored) {
                memberId = null;
            }
        }
        FeedbackDTO dto = feedbackService.createFeedback(request, memberId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackDTO>> getAllFeedback() {
        return ResponseEntity.ok(feedbackService.getAll());
    }

    @PatchMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeedbackDTO> updateStatusPriority(
            @PathVariable Long id,
            @RequestParam(required = false) Feedback.FeedbackStatus status,
            @RequestParam(required = false) Feedback.FeedbackPriority priority
    ) {
        return ResponseEntity.ok(feedbackService.updateStatusAndPriority(id, status, priority));
    }
}
