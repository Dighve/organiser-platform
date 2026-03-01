package com.organiser.platform.dto.admin;

import com.organiser.platform.enums.AgreementType;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for agreement version information in admin responses
 */
@Data
public class AgreementVersionDTO {
    private String version;
    private AgreementType agreementType;
    private String agreementText;
    private String agreementHash;
    private LocalDateTime effectiveDate;
    private LocalDateTime createdAt;
    private String changeDescription;
}
