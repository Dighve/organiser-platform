package com.organiser.platform.repository;

import com.organiser.platform.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    
    List<Subscription> findByMemberId(Long memberId);
    
    List<Subscription> findByGroupId(Long groupId);
    
    Optional<Subscription> findByMemberIdAndGroupId(Long memberId, Long groupId);
    
    boolean existsByMemberIdAndGroupId(Long memberId, Long groupId);
    
    long countByGroupIdAndStatus(Long groupId, Subscription.SubscriptionStatus status);
    
    // Admin dashboard queries
    Long countByMemberId(Long memberId);
}
