package com.organiser.platform.controller;

import com.organiser.platform.dto.ActivityDTO;
import com.organiser.platform.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {
    
    private final ActivityService activityService;
    
    /**
     * Get all active activities (public endpoint)
     */
    @GetMapping("/public")
    public ResponseEntity<List<ActivityDTO>> getAllActiveActivities() {
        return ResponseEntity.ok(activityService.getAllActiveActivities());
    }
    
    /**
     * Get activity by ID (public endpoint)
     */
    @GetMapping("/public/{id}")
    public ResponseEntity<ActivityDTO> getActivityById(@PathVariable Long id) {
        return ResponseEntity.ok(activityService.getActivityById(id));
    }
}
