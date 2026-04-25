package com.organiser.platform.repository;

import com.organiser.platform.model.GroupRatingSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRatingSummaryRepository extends JpaRepository<GroupRatingSummary, Long> {
    Optional<GroupRatingSummary> findByGroupId(Long groupId);
    List<GroupRatingSummary> findByGroupIdIn(Collection<Long> groupIds);
}
