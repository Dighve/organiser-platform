package com.organiser.platform.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateContactInfoRequest {

    @NotNull(message = "Contacts list is required")
    @Valid
    private List<ContactEntry> contacts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactEntry {
        @NotNull(message = "Platform is required")
        private String platform;       // WHATSAPP, TELEGRAM, etc.

        @NotNull(message = "Contact value is required")
        private String contactValue;   // phone/username/link

        private String displayLabel;   // optional custom label

        private String visibility;     // EVERYONE, GROUP_MEMBERS, EVENT_ATTENDEES, NOBODY (default: GROUP_MEMBERS)

        private Integer displayOrder;  // optional ordering
    }
}
