package com.organiser.platform.service;

import com.organiser.platform.dto.ActivityDTO;
import com.organiser.platform.model.Activity;
import com.organiser.platform.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityService {
    
    private final ActivityRepository activityRepository;
    
    /**
     * Get all active activities for public display
     */
    public List<ActivityDTO> getAllActiveActivities() {
        return activityRepository.findByActiveTrue()
                .stream()
                .map(ActivityDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get activity by ID
     */
    public ActivityDTO getActivityById(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found with id: " + id));
        return ActivityDTO.fromEntity(activity);
    }
}
