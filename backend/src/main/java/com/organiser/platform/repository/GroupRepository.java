package com.organiser.platform.repository;

import com.organiser.platform.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    List<Group> findByActiveTrue();

    List<Group> findByActivityId(Long activityId);

    @Query("SELECT g FROM Group g LEFT JOIN FETCH g.primaryOrganiser LEFT JOIN FETCH g.activity WHERE g.primaryOrganiser.id = :organiserId")
    List<Group> findByPrimaryOrganiserId(@Param("organiserId") Long organiserId);

    @Query("SELECT g FROM Group g LEFT JOIN FETCH g.primaryOrganiser LEFT JOIN FETCH g.activity WHERE g.isPublic = true AND g.active = true")
    List<Group> findByIsPublicTrueAndActiveTrue();
    
    // Admin dashboard queries
    Long countByPrimaryOrganiserId(Long organiserId);

    boolean existsByCoOrganisers_Id(Long organiserId);
}
