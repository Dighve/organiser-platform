-- ============================================================
-- Migration: V42 - Backfill Display Names from Email
-- ============================================================
-- Purpose: Update all members with null or empty displayName
--          to have a privacy-focused display name generated from email
-- 
-- Privacy-First Strategy: Extract only first name to prevent email reconstruction
--   - john.doe@example.com → John
--   - sarah_smith123@gmail.com → Sarah
--   - mike-jones@company.com → Mike
--   - alice@example.com → Alice
-- ============================================================

-- Update members with null displayName
-- Extract first name (before first dot, underscore, or hyphen)
-- PostgreSQL uses SPLIT_PART instead of MySQL's SUBSTRING_INDEX
UPDATE members
SET display_name = INITCAP(
    REGEXP_REPLACE(
        SPLIT_PART(
            SPLIT_PART(
                SPLIT_PART(
                    SPLIT_PART(email, '@', 1),  -- Get local part before @
                '.', 1),                         -- Split on dot, take first
            '_', 1),                             -- Split on underscore, take first
        '-', 1),                                 -- Split on hyphen, take first
    '\d+$', ''                                   -- Remove trailing numbers
    )
)
WHERE display_name IS NULL;

-- Update members with empty displayName (just whitespace)
UPDATE members
SET display_name = INITCAP(
    REGEXP_REPLACE(
        SPLIT_PART(
            SPLIT_PART(
                SPLIT_PART(
                    SPLIT_PART(email, '@', 1),  -- Get local part before @
                '.', 1),                         -- Split on dot, take first
            '_', 1),                             -- Split on underscore, take first
        '-', 1),                                 -- Split on hyphen, take first
    '\d+$', ''                                   -- Remove trailing numbers
    )
)
WHERE TRIM(display_name) = '';

-- ============================================================
-- Privacy Protection:
-- - Only extracts first name segment (before separators)
-- - Prevents email reconstruction from display name
-- - DisplayNameGenerator.java handles new signups with same logic
-- 
-- PostgreSQL Functions Used:
-- - SPLIT_PART(string, delimiter, position) - Splits string and returns part
-- - REGEXP_REPLACE(string, pattern, replacement) - Removes trailing numbers
-- - INITCAP(string) - Capitalizes first letter of each word
-- ============================================================
