package com.organiser.platform.repository;

import com.organiser.platform.model.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityTypeRepository extends JpaRepository<ActivityType, Long> {
    
    Optional<ActivityType> findByName(String name);
    
    List<ActivityType> findByActiveTrue();
}
