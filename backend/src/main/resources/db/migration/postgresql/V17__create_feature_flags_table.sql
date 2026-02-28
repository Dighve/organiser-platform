-- Create feature flags table for managing platform features
-- This allows admins to enable/disable features like Google Maps integration

CREATE TABLE feature_flags (
    id BIGSERIAL PRIMARY KEY,
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    flag_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT REFERENCES members(id) ON DELETE SET NULL
);

-- Create index for fast lookups
CREATE INDEX idx_feature_flags_flag_key ON feature_flags(flag_key);
CREATE INDEX idx_feature_flags_is_enabled ON feature_flags(is_enabled);

-- Insert the Google Maps feature flag
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'GOOGLE_MAPS_ENABLED', 
    'Google Maps Integration', 
    'Enables Google Maps Places API for location selection and map displays in events and groups', 
    true
);

-- Insert additional location-related feature flags for granular control
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'EVENT_LOCATION_ENABLED', 
    'Event Location Fields', 
    'Enables location selection and display for events including Google Places autocomplete', 
    true
);

INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'GROUP_LOCATION_ENABLED', 
    'Group Location Fields', 
    'Enables location selection and display for groups including Google Places autocomplete', 
    true
);

INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'STATIC_MAPS_ENABLED', 
    'Static Map Display', 
    'Enables Google Static Maps API for displaying map thumbnails on event detail pages', 
    true
);
