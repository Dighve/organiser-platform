-- V23: Fix agreement_versions hashes to match Java's calculateAgreementHash format
-- Root cause: V19 stored hashes of placeholder strings (e.g. 'ORGANISER_AGREEMENT_2025-12-09'),
--             not of the actual agreement_text, and without the 'sha256_' prefix Java produces.
-- Fix: Recompute all hashes from the stored agreement_text using the same format:
--      'sha256_' || encode(sha256(agreement_text::bytea), 'hex')

UPDATE agreement_versions
SET agreement_hash = 'sha256_' || encode(sha256(agreement_text::bytea), 'hex')
WHERE agreement_text IS NOT NULL
  AND agreement_text != ''
  AND (
    -- Only fix rows where the stored hash does NOT match the correct computed value
    agreement_hash IS NULL
    OR agreement_hash != ('sha256_' || encode(sha256(agreement_text::bytea), 'hex'))
  );

-- Log the result
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM agreement_versions
    WHERE agreement_hash = 'sha256_' || encode(sha256(agreement_text::bytea), 'hex');

    RAISE NOTICE 'V23: % agreement_versions rows now have correct hashes', updated_count;
END $$;
