package com.organiser.platform.repository;

import com.organiser.platform.model.WebPushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WebPushSubscriptionRepository extends JpaRepository<WebPushSubscription, Long> {

    List<WebPushSubscription> findByMemberIdAndActiveTrue(Long memberId);

    Optional<WebPushSubscription> findByEndpoint(String endpoint);

    Optional<WebPushSubscription> findByMemberIdAndEndpoint(Long memberId, String endpoint);
}
