package com.organiser.platform.service;

import com.organiser.platform.dto.EventReviewDTO;
import com.organiser.platform.repository.EventReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final EventReviewRepository eventReviewRepository;
    
    public Page<EventReviewDTO> getEventReviews(Long eventId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return eventReviewRepository.findByEventId(eventId, pageable)
                .map(EventReviewDTO::fromEntity);
    }
    
    public Page<EventReviewDTO> getGroupReviews(Long groupId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return eventReviewRepository.findByGroupId(groupId, pageable)
                .map(EventReviewDTO::fromEntity);
    }
}
