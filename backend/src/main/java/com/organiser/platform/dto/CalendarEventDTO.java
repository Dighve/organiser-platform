package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for calendar event data
 * Used to generate calendar links for various providers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDTO {
    private String title;
    private String description;
    private String location;
    private Instant startTime;
    private Instant endTime;
    private String organiserName;
    private String eventUrl;
}
