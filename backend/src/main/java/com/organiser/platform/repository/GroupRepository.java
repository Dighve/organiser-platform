package com.organiser.platform.repository;

import com.organiser.platform.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    
    List<Group> findByActiveTrue();
    
    List<Group> findByActivityId(Long activityId);
    
    List<Group> findByPrimaryOrganiserId(Long organiserId);
    
    List<Group> findByIsPublicTrueAndActiveTrue();
}
