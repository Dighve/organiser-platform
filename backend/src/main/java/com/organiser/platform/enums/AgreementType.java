package com.organiser.platform.enums;

/**
 * Enumeration for legal agreement types to ensure type safety and prevent string-based errors
 */
public enum AgreementType {
    
    /**
     * Agreement for users who want to become organisers (create groups/events)
     */
    ORGANISER("ORGANISER", "Organiser Agreement"),
    
    /**
     * General user agreement for platform participation
     */
    USER("USER", "User Agreement");
    
    private final String value;
    private final String displayName;
    
    AgreementType(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }
    
    /**
     * Get the string value for database storage (maintains backward compatibility)
     */
    public String getValue() {
        return value;
    }
    
    /**
     * Get human-readable display name
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Parse string value back to enum (for database queries)
     */
    public static AgreementType fromValue(String value) {
        for (AgreementType type : AgreementType.values()) {
            if (type.getValue().equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown agreement type: " + value);
    }
    
    @Override
    public String toString() {
        return value;
    }
}
