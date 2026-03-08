package com.organiser.platform.dto;

import lombok.Data;

import java.util.List;

@Data
public class JoinEventRequest {
    private Integer guestCount = 0;
    private List<String> guestNames;
}
