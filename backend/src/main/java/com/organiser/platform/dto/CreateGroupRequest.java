package com.organiser.platform.dto;

import com.organiser.platform.model.Activity;
import com.organiser.platform.model.Event;
import com.organiser.platform.model.Member;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import lombok.Data;

@Data
public class CreateGroupRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;

    private String imageUrl;

    private Member primaryOrganiser;

    private Set<Member> coOrganisers = new HashSet<>();

    private Activity activity;
}
