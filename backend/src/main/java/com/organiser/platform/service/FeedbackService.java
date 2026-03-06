package com.organiser.platform.service;

import com.organiser.platform.dto.CreateFeedbackRequest;
import com.organiser.platform.dto.FeedbackDTO;
import com.organiser.platform.model.Feedback;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.FeedbackRepository;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public FeedbackDTO createFeedback(CreateFeedbackRequest request, Long memberId) {
        Member member = null;
        if (memberId != null) {
            member = memberRepository.findById(memberId).orElse(null);
        }

        Feedback feedback = Feedback.builder()
                .type(request.getType())
                .summary(request.getSummary())
                .details(request.getDetails())
                .pageUrl(request.getPageUrl())
                .email(request.getEmail())
                .allowFollowUp(Boolean.TRUE.equals(request.getAllowFollowUp()))
                .screenshotUrl(request.getScreenshotUrl())
                .member(member)
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<FeedbackDTO> getAll() {
        return feedbackRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeedbackDTO updateStatusAndPriority(Long id, Feedback.FeedbackStatus status, Feedback.FeedbackPriority priority) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));
        if (status != null) feedback.setStatus(status);
        if (priority != null) feedback.setPriority(priority);
        return toDTO(feedbackRepository.save(feedback));
    }

    private FeedbackDTO toDTO(Feedback feedback) {
        return FeedbackDTO.builder()
                .id(feedback.getId())
                .type(feedback.getType())
                .summary(feedback.getSummary())
                .details(feedback.getDetails())
                .pageUrl(feedback.getPageUrl())
                .email(feedback.getEmail())
                .allowFollowUp(feedback.getAllowFollowUp())
                .screenshotUrl(feedback.getScreenshotUrl())
                .status(feedback.getStatus())
                .priority(feedback.getPriority())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .memberId(feedback.getMember() != null ? feedback.getMember().getId() : null)
                .memberName(feedback.getMember() != null ? feedback.getMember().getDisplayName() : null)
                .build();
    }
}
