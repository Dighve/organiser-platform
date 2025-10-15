package com.organiser.platform.repository;

import com.organiser.platform.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    
    Optional<Activity> findByName(String name);
    
    List<Activity> findByActiveTrue();
}
