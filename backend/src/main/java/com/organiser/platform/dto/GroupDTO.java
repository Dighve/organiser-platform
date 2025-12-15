package com.organiser.platform.dto;

import com.organiser.platform.model.Group;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDTO {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private Long primaryOrganiserId;
    private String primaryOrganiserName;
    private Long activityId;
    private String activityName;
    private String location;
    private Integer maxMembers;
    private Integer currentMembers;
    private Boolean active;
    private Boolean isPublic;
    private String termsAndConditions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static GroupDTO fromEntity(Group group, Integer currentMembers) {
        return GroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .imageUrl(group.getImageUrl())
                .primaryOrganiserId(group.getPrimaryOrganiser() != null ? group.getPrimaryOrganiser().getId() : null)
                .primaryOrganiserName(group.getPrimaryOrganiser() != null ? group.getPrimaryOrganiser().getDisplayName() : null)
                .activityId(group.getActivity() != null ? group.getActivity().getId() : null)
                .activityName(group.getActivity() != null ? group.getActivity().getName() : null)
                .location(group.getLocation())
                .maxMembers(group.getMaxMembers())
                .currentMembers(currentMembers)
                .active(group.getActive())
                .isPublic(group.getIsPublic())
                .termsAndConditions(group.getTermsAndConditions())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
