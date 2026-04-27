package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineBundleDTO {
    private EventDTO event;
    private List<OfflineContactDTO> contacts;
    private String viewerRole; // "host" or "attendee"
    private Instant bundledAt;
}
