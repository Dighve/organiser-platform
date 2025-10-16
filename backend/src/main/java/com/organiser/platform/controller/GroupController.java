package com.organiser.platform.controller;

import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.CreateGroupRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.model.Group;
import com.organiser.platform.service.EventService;
import com.organiser.platform.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {
    
    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<Group> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            Authentication authentication
                                            ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(groupService.createGroup(request, userId));
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        // In a real implementation, extract userId from JWT token claims
        // For now, this is a placeholder
        return 1L;
    }
}
