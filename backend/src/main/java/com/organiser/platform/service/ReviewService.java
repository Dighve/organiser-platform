package com.organiser.platform.service;

import com.organiser.platform.dto.CreateReviewRequest;
import com.organiser.platform.dto.EventReviewDTO;
import com.organiser.platform.model.Event;
import com.organiser.platform.model.EventParticipant;
import com.organiser.platform.model.EventReview;
import com.organiser.platform.model.Group;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.EventParticipantRepository;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.EventReviewRepository;
import com.organiser.platform.repository.GroupRepository;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.util.EventTimingUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.organiser.platform.dto.PendingReviewDTO;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final EventReviewRepository eventReviewRepository;
    private final EventRepository eventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final MemberRepository memberRepository;
    private final GroupRepository groupRepository;

    // Statuses that count as "attended" for review eligibility.
    // CANCELLED and NO_SHOW are excluded.
    private static final List<EventParticipant.ParticipationStatus> ELIGIBLE_STATUSES = List.of(
            EventParticipant.ParticipationStatus.REGISTERED,
            EventParticipant.ParticipationStatus.CONFIRMED,
            EventParticipant.ParticipationStatus.ATTENDED
    );
    
    public List<PendingReviewDTO> getPendingReviews() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        Instant now = Instant.now();
        Instant windowStart = now.minus(31, ChronoUnit.DAYS);
        Instant windowEnd   = now.minus(1,  ChronoUnit.DAYS);

        return eventParticipantRepository
                .findEligibleForReviewPrompt(windowStart, windowEnd)
                .stream()
                .filter(ep -> ep.getMember().getId().equals(member.getId()))
                .filter(ep -> {
                    Instant eventEnd = EventTimingUtils.effectiveEnd(ep.getEvent());
                    long hours = ChronoUnit.HOURS.between(eventEnd, now);
                    return hours >= 24 && hours <= 30 * 24;
                })
                .filter(ep -> {
                    Long organiserId = ep.getEvent().getGroup().getPrimaryOrganiser().getId();
                    Long hostId = ep.getEvent().getHostMember() != null
                            ? ep.getEvent().getHostMember().getId() : null;
                    return !member.getId().equals(organiserId) && !member.getId().equals(hostId);
                })
                .map(ep -> {
                    Instant eventEnd = EventTimingUtils.effectiveEnd(ep.getEvent());
                    return PendingReviewDTO.builder()
                            .eventId(ep.getEvent().getId())
                            .eventTitle(ep.getEvent().getTitle())
                            .groupName(ep.getEvent().getGroup().getName())
                            .imageUrl(ep.getEvent().getImageUrl())
                            .eventDate(ep.getEvent().getEventDate())
                            .reviewWindowClosesAt(eventEnd.plus(30, ChronoUnit.DAYS))
                            .build();
                })
                .collect(Collectors.toList());
    }

    public Page<EventReviewDTO> getMyReviews(int page, int size) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        Pageable pageable = PageRequest.of(page, size);
        return eventReviewRepository.findByMemberId(member.getId(), pageable)
                .map(EventReviewDTO::fromEntity);
    }

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        
        // Find review by event and member
        return eventReviewRepository.findByEventIdAndMemberId(eventId, member.getId())
                .map(EventReviewDTO::fromEntity)
                .orElse(null);
    }
    
    @Transactional
    public EventReviewDTO submitReview(Long eventId, CreateReviewRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        Group group = event.getGroup();

        // --- Attendance check ---
        // Member must have registered and not cancelled/no-showed
        boolean wasParticipant = eventParticipantRepository
                .existsByEventIdAndMemberIdAndStatusIn(eventId, member.getId(), ELIGIBLE_STATUSES);
        if (!wasParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You must have attended this event to submit a review");
        }

        // --- Time window checks ---
        Instant now = Instant.now();
        Instant eventEnd = EventTimingUtils.effectiveEnd(event);

        if (!eventEnd.isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Reviews can only be submitted after the event has ended");
        }

        long hoursSinceEnd = Duration.between(eventEnd, now).toHours();
        if (hoursSinceEnd < 24) {
            long hoursRemaining = 24 - hoursSinceEnd;
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "You can review this event in " + hoursRemaining + " hour" + (hoursRemaining == 1 ? "" : "s"));
        }

        long daysSinceEnd = Duration.between(eventEnd, now).toDays();
        if (daysSinceEnd > 30) {
            throw new ResponseStatusException(HttpStatus.GONE,
                    "Review window has closed (30 days after the event)");
        }

        // --- Duplicate check ---
        if (eventReviewRepository.existsByEventIdAndMemberId(eventId, member.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You have already reviewed this event");
        }
        
        // Weighted overall rating — must match the DB trigger (calculate_overall_rating)
        double overallRating = (request.getOrganizationRating() * 0.25) +
                               (request.getRouteRating()       * 0.20) +
                               (request.getGroupRating()       * 0.20) +
                               (request.getSafetyRating()      * 0.20) +
                               (request.getValueRating()       * 0.15);
        
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        EventReview review = eventReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getMember().getId().equals(member.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own reviews");
        }
        
        // Weighted overall rating — must match the DB trigger (calculate_overall_rating)
        double overallRating = (request.getOrganizationRating() * 0.25) +
                               (request.getRouteRating()       * 0.20) +
                               (request.getGroupRating()       * 0.20) +
                               (request.getSafetyRating()      * 0.20) +
                               (request.getValueRating()       * 0.15);
        
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
    
    @Transactional
    public void deleteReview(Long reviewId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        EventReview review = eventReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getMember().getId().equals(member.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own reviews");
        }
        
        eventReviewRepository.delete(review);
    }
}
