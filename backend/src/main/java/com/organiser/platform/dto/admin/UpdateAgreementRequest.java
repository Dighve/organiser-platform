package com.organiser.platform.dto.admin;

import com.organiser.platform.enums.AgreementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO for admin updating agreement text
 */
@Data
public class UpdateAgreementRequest {
    
    @NotNull(message = "Agreement type is required")
    private AgreementType agreementType;
    
    @NotBlank(message = "Agreement text cannot be empty")
    private String agreementText;
    
    @NotBlank(message = "Version is required")
    private String version;
    
    private String effectiveDate; // Optional - defaults to current date if not provided
    
    private String changeDescription; // Optional description of what changed
}
