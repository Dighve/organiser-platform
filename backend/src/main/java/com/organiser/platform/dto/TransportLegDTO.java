package com.organiser.platform.dto;

import com.organiser.platform.model.EventTransportLeg;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransportLegDTO {
    private Long id;
    private EventTransportLeg.Direction direction;  // OUTBOUND | RETURN
    private EventTransportLeg.TransportMode mode;   // TRAIN | CAR | BUS | WALK | OTHER
    private String departureLocation;
    private String arrivalLocation;
    private String departureTime;
    private String arrivalTime;
    private Boolean openReturn;
    private String notes;
    private Integer sortOrder;
}
