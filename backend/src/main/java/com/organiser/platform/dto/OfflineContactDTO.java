package com.organiser.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineContactDTO {
    private Long memberId;
    private String memberName;
    private String profilePhotoUrl;
    private List<ContactInfoDTO> contacts;
}
