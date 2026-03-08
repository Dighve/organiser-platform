package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSearchResponse {
    private List<EventDTO> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean pastOnly;
}
