package com.organiser.platform.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContactInfoDTO {
    private Long id;
    private String platform;       // WHATSAPP, TELEGRAM, etc.
    private String contactValue;   // phone/username/link
    private String displayLabel;   // optional custom label
    private String visibility;     // EVERYONE, GROUP_MEMBERS, EVENT_ATTENDEES, NOBODY
    private Integer displayOrder;
    private String deepLink;       // Generated deep link URL for the platform
}
