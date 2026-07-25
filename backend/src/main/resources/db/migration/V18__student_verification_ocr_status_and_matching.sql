ALTER TABLE student_verifications
    ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS ocr_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS ocr_error_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ocr_error_message VARCHAR(500),
    ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ocr_last_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ocr_attempt_count INTEGER,
    ADD COLUMN IF NOT EXISTS name_match_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS name_similarity_score NUMERIC(5, 4),
    ADD COLUMN IF NOT EXISTS student_code_match_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS student_code_similarity_score NUMERIC(5, 4),
    ADD COLUMN IF NOT EXISTS university_match_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS university_similarity_score NUMERIC(5, 4);

UPDATE student_verifications
SET ocr_status = CASE
        WHEN ocr_raw_text IS NULL OR BTRIM(ocr_raw_text) = '' THEN 'NOT_STARTED'
        ELSE 'COMPLETED'
    END,
    ocr_provider = COALESCE(ocr_provider, 'legacy'),
    ocr_processed_at = COALESCE(ocr_processed_at, submitted_at),
    ocr_last_attempt_at = COALESCE(ocr_last_attempt_at, submitted_at),
    ocr_attempt_count = COALESCE(ocr_attempt_count, 1)
WHERE ocr_status IS NULL;

CREATE INDEX IF NOT EXISTS ix_student_verifications_ocr_status
    ON student_verifications(ocr_status);
