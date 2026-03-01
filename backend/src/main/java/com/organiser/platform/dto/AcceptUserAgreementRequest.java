package com.organiser.platform.dto;

import lombok.Data;

@Data
public class AcceptUserAgreementRequest {
    
    private String agreementText; // Optional - sent for audit trail but not used for blocking validation
    
    private String ipAddress;
    private String userAgent;
    private String sessionId;
    private String referrerUrl;
    private String browserFingerprint;
}
