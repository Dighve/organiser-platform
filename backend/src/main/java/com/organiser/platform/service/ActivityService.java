package com.organiser.platform.service;

// ============================================================
// IMPORTS
// ============================================================
import com.organiser.platform.dto.ActivityDTO;
import com.organiser.platform.model.Activity;
import com.organiser.platform.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

// ============================================================
// SERVICE CLASS
// ============================================================
/**
 * Service for managing activity types (Hiking, Running, Climbing, etc.).
 * 
 * @author OutMeets Platform Team
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityService {
    
    // ============================================================
    // DEPENDENCIES
    // ============================================================
    private final ActivityRepository activityRepository;
    
    // ============================================================
    // PUBLIC METHODS - Activity Retrieval
    // ============================================================
    
    /**
     * Get all active activities for public display.
     */
    public List<ActivityDTO> getAllActiveActivities() {
        return activityRepository.findByActiveTrue()
                .stream()
                .map(ActivityDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get activity by ID.
     */
    public ActivityDTO getActivityById(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found with id: " + id));
        return ActivityDTO.fromEntity(activity);
    }
}
