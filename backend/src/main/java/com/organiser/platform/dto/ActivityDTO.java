package com.organiser.platform.dto;

import com.organiser.platform.model.Activity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDTO {
    private Long id;
    private String name;
    private String description;
    private String iconUrl;
    private Boolean active;
    private LocalDateTime createdAt;
    
    public static ActivityDTO fromEntity(Activity activity) {
        return ActivityDTO.builder()
                .id(activity.getId())
                .name(activity.getName())
                .description(activity.getDescription())
                .iconUrl(activity.getIconUrl())
                .active(activity.getActive())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
