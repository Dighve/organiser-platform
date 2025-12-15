package com.organiser.platform.dto;

import lombok.Data;

@Data
public class AcceptOrganiserAgreementRequest {
    private String ipAddress;
    private String userAgent;
}
