package com.organiser.platform.service;

import com.organiser.platform.model.EventParticipant;
import com.organiser.platform.repository.EventParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists the reviewPromptSent flag in its own transaction (REQUIRES_NEW) so
 * the commit is immediate and independent of the caller's outer transaction.
 *
 * This prevents the scheduler from re-sending review emails when the outer
 * batch transaction rolls back after an email has already been delivered.
 */
@Service
@RequiredArgsConstructor
public class ReviewPromptFlagService {

    private final EventParticipantRepository eventParticipantRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markPromptSent(EventParticipant ep) {
        ep.setReviewPromptSent(true);
        eventParticipantRepository.save(ep);
    }
}
