package com.organiser.platform.repository;

import com.organiser.platform.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    Page<Review> findByEventId(Long eventId, Pageable pageable);
    
    Page<Review> findByUserId(Long userId, Pageable pageable);
    
    boolean existsByEventIdAndUserId(Long eventId, Long userId);
}
