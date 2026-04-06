package com.organiser.platform.service;

import com.organiser.platform.dto.CreateReviewRequest;
import com.organiser.platform.dto.EventReviewDTO;
import com.organiser.platform.model.Event;
import com.organiser.platform.model.EventReview;
import com.organiser.platform.model.Group;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.EventReviewRepository;
import com.organiser.platform.repository.GroupRepository;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final EventReviewRepository eventReviewRepository;
    private final EventRepository eventRepository;
    private final MemberRepository memberRepository;
    private final GroupRepository groupRepository;
    
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
    
    public EventReviewDTO getMyReviewForEvent(Long eventId) {
        // Get authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Find review by event and member
        return eventReviewRepository.findByEventIdAndMemberId(eventId, member.getId())
                .map(EventReviewDTO::fromEntity)
                .orElse(null);
    }
    
    @Transactional
    public EventReviewDTO submitReview(Long eventId, CreateReviewRequest request) {
        // Get authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Get event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Get group from event
        Group group = event.getGroup();
        
        // Check if member has already reviewed this event
        if (eventReviewRepository.existsByEventIdAndMemberId(eventId, member.getId())) {
            throw new RuntimeException("You have already reviewed this event");
        }
        
        // Calculate overall rating (average of all 5 ratings)
        double overallRating = (request.getOrganizationRating() + 
                               request.getRouteRating() + 
                               request.getGroupRating() + 
                               request.getSafetyRating() + 
                               request.getValueRating()) / 5.0;
        
        // Create review
        EventReview review = EventReview.builder()
                .event(event)
                .member(member)
                .group(group)
                .organizationRating(request.getOrganizationRating())
                .routeRating(request.getRouteRating())
                .groupRating(request.getGroupRating())
                .safetyRating(request.getSafetyRating())
                .valueRating(request.getValueRating())
                .overallRating(overallRating)
                .comment(request.getComment())
                .wouldRecommend(request.getWouldRecommend() != null ? request.getWouldRecommend() : false)
                .wouldJoinAgain(request.getWouldJoinAgain() != null ? request.getWouldJoinAgain() : false)
                .build();
        
        EventReview savedReview = eventReviewRepository.save(review);
        
        return EventReviewDTO.fromEntity(savedReview);
    }
    
    @Transactional
    public EventReviewDTO updateReview(Long reviewId, CreateReviewRequest request) {
        // Get authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Get existing review
        EventReview review = eventReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        
        // Check if the review belongs to the current user
        if (!review.getMember().getId().equals(member.getId())) {
            throw new RuntimeException("You can only update your own reviews");
        }
        
        // Calculate new overall rating
        double overallRating = (request.getOrganizationRating() + 
                               request.getRouteRating() + 
                               request.getGroupRating() + 
                               request.getSafetyRating() + 
                               request.getValueRating()) / 5.0;
        
        // Update review fields
        review.setOrganizationRating(request.getOrganizationRating());
        review.setRouteRating(request.getRouteRating());
        review.setGroupRating(request.getGroupRating());
        review.setSafetyRating(request.getSafetyRating());
        review.setValueRating(request.getValueRating());
        review.setOverallRating(overallRating);
        review.setComment(request.getComment());
        review.setWouldRecommend(request.getWouldRecommend() != null ? request.getWouldRecommend() : false);
        review.setWouldJoinAgain(request.getWouldJoinAgain() != null ? request.getWouldJoinAgain() : false);
        
        EventReview updatedReview = eventReviewRepository.save(review);
        
        return EventReviewDTO.fromEntity(updatedReview);
    }
}
