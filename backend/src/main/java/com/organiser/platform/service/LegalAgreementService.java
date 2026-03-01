package com.organiser.platform.service;

import com.organiser.platform.dto.admin.AgreementVersionDTO;
import com.organiser.platform.dto.admin.UpdateAgreementRequest;
import com.organiser.platform.enums.AgreementType;
import com.organiser.platform.model.AgreementVersion;
import com.organiser.platform.repository.AgreementVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for admin management of legal agreements
 * Provides functionality for viewing and updating terms and conditions
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LegalAgreementService {
    
    private final AgreementVersionRepository agreementVersionRepository;
    private final EnhancedLegalService enhancedLegalService;
    
    /**
     * Get all agreement versions for admin dashboard
     */
    public List<AgreementVersionDTO> getAllAgreementVersions() {
        return agreementVersionRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get current active agreement by type
     */
    public AgreementVersionDTO getCurrentAgreement(AgreementType agreementType) {
        AgreementVersion currentVersion = enhancedLegalService.getCurrentAgreementVersion(agreementType);
        return mapToDTO(currentVersion);
    }
    
    /**
     * Update agreement text and create new version
     * Automatically generates version number based on current date
     */
    @Transactional
    public AgreementVersionDTO updateAgreement(UpdateAgreementRequest request, String adminEmail) {
        log.info("Admin {} updating {} agreement", adminEmail, request.getAgreementType().getValue());
        
        // Validate request
        if (request.getAgreementText() == null || request.getAgreementText().trim().isEmpty()) {
            throw new IllegalArgumentException("Agreement text cannot be empty");
        }
        
        // Generate version if not provided or use provided version
        String version = request.getVersion();
        if (version == null || version.trim().isEmpty()) {
            version = generateVersionNumber();
        }
        
        // Determine effective date
        LocalDateTime effectiveDate = LocalDateTime.now();
        if (request.getEffectiveDate() != null && !request.getEffectiveDate().trim().isEmpty()) {
            try {
                // Try parsing as date string (you may need to adjust format)
                effectiveDate = LocalDateTime.parse(request.getEffectiveDate());
            } catch (Exception e) {
                log.warn("Could not parse effective date: {}, using current time", request.getEffectiveDate());
            }
        }
        
        // Create audit log message
        String auditMessage = String.format("Updated by admin: %s", adminEmail);
        if (request.getChangeDescription() != null && !request.getChangeDescription().trim().isEmpty()) {
            auditMessage += " - " + request.getChangeDescription();
        }
        
        // Create new agreement version using existing service
        AgreementVersion newVersion = enhancedLegalService.createAgreementVersion(
                request.getAgreementType().getValue(),
                version,
                request.getAgreementText(),
                auditMessage
        );
        
        // Update effective date if different from default
        if (!effectiveDate.equals(newVersion.getEffectiveDate())) {
            newVersion.setEffectiveDate(effectiveDate);
            newVersion = agreementVersionRepository.save(newVersion);
        }
        
        log.info("Successfully created new {} agreement version: {} by admin: {}", 
                request.getAgreementType().getValue(), version, adminEmail);
        
        return mapToDTO(newVersion);
    }
    
    /**
     * Get agreement version history for a specific type
     */
    public List<AgreementVersionDTO> getAgreementHistory(AgreementType agreementType, int limit) {
        List<AgreementVersion> history = agreementVersionRepository
                .findByAgreementTypeOrderByEffectiveDateDesc(agreementType.getValue());
        
        return history.stream()
                .limit(limit)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Generate version number based on current date
     * Format: YYYY-MM-DD-HH-mm (e.g., "2024-03-01-15-30")
     */
    private String generateVersionNumber() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd-HH-mm"));
    }
    
    /**
     * Map AgreementVersion entity to DTO
     */
    private AgreementVersionDTO mapToDTO(AgreementVersion version) {
        AgreementVersionDTO dto = new AgreementVersionDTO();
        dto.setVersion(version.getVersion());
        dto.setAgreementType(AgreementType.fromValue(version.getAgreementType()));
        dto.setAgreementText(version.getAgreementText());
        dto.setAgreementHash(version.getAgreementHash());
        dto.setEffectiveDate(version.getEffectiveDate());
        dto.setCreatedAt(version.getCreatedAt());
        dto.setChangeDescription(version.getCreatedBy()); // createdBy field contains audit info
        return dto;
    }
}
