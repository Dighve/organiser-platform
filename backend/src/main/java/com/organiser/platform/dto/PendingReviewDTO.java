package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingReviewDTO {
    private Long eventId;
    private String eventTitle;
    private String groupName;
    private String imageUrl;
    private Instant eventDate;
    private Instant reviewWindowClosesAt; // eventEnd + 30 days — lets frontend show "X days left"
}
