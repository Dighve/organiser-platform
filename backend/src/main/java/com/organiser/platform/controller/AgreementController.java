package com.organiser.platform.controller;

import com.organiser.platform.enums.AgreementType;
import com.organiser.platform.model.AgreementVersion;
import com.organiser.platform.service.EnhancedLegalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for agreement-related operations
 * Provides endpoints for fetching current agreement versions and text
 * Used for frontend validation to show users exact text they're accepting
 */
@RestController
@RequestMapping("/api/v1/agreements")
@RequiredArgsConstructor
public class AgreementController {
    
    private final EnhancedLegalService enhancedLegalService;
    
    /**
     * Get current organiser agreement version and text
     * Used by frontend to display exact text user will accept
     */
    @GetMapping("/organiser/current")
    public ResponseEntity<Map<String, Object>> getCurrentOrganiserAgreement() {
        
        AgreementVersion currentVersion = enhancedLegalService.getCurrentAgreementVersion(AgreementType.ORGANISER);
        
        return ResponseEntity.ok(Map.of(
            "agreementType", currentVersion.getAgreementType(),
            "version", currentVersion.getVersion(),
            "effectiveDate", currentVersion.getEffectiveDate(),
            "agreementText", currentVersion.getAgreementText(),
            "agreementHash", currentVersion.getAgreementHash()
        ));
    }
    
    /**
     * Get current user agreement version and text
     * Used by frontend to display exact text user will accept
     */
    @GetMapping("/user/current")
    public ResponseEntity<Map<String, Object>> getCurrentUserAgreement() {
        
        AgreementVersion currentVersion = enhancedLegalService.getCurrentAgreementVersion(AgreementType.USER);
        
        return ResponseEntity.ok(Map.of(
            "agreementType", currentVersion.getAgreementType(),
            "version", currentVersion.getVersion(), 
            "effectiveDate", currentVersion.getEffectiveDate(),
            "agreementText", currentVersion.getAgreementText(),
            "agreementHash", currentVersion.getAgreementHash()
        ));
    }
    
    /**
     * Verify agreement hash before acceptance
     * Security endpoint to prevent tampering
     */
    @PostMapping("/verify-hash")
    public ResponseEntity<Map<String, Object>> verifyAgreementHash(
            @RequestBody Map<String, String> request) {
        
        String agreementText = request.get("agreementText");
        String providedHash = request.get("agreementHash");
        String agreementType = request.get("agreementType");
        
        if (agreementText == null || providedHash == null || agreementType == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "error", "Missing required fields: agreementText, agreementHash, agreementType"
            ));
        }
        
        try {
            AgreementType type = AgreementType.fromValue(agreementType);
            boolean isValid = enhancedLegalService.verifyAgreementIntegrity(type, agreementText, providedHash);
            
            return ResponseEntity.ok(Map.of(
                "valid", isValid,
                "message", isValid ? "Agreement integrity verified" : "Agreement hash mismatch - possible tampering detected"
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "error", "Invalid agreement type: " + agreementType
            ));
        }
    }
}
