ALTER TABLE tb_orders
    ALTER COLUMN route_id DROP NOT NULL;

ALTER TABLE verification_codes
    DROP CONSTRAINT IF EXISTS verification_codes_purpose_check;

UPDATE verification_codes
SET purpose = CASE purpose
    WHEN 'REGISTRATION' THEN 'REGISTER'
    WHEN 'PASSWORD_RESET' THEN 'RESET_PASSWORD'
    ELSE purpose
END;

ALTER TABLE verification_codes
    ADD CONSTRAINT verification_codes_purpose_check
    CHECK (purpose IN ('REGISTER', 'RESET_PASSWORD'));

ALTER TABLE complaints
    DROP CONSTRAINT IF EXISTS complaints_status_check;

ALTER TABLE complaints
    ADD CONSTRAINT complaints_status_check
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'));

ALTER TABLE violation_reports
    DROP CONSTRAINT IF EXISTS violation_reports_status_check;

ALTER TABLE violation_reports
    ADD CONSTRAINT violation_reports_status_check
    CHECK (status IN (
        'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REPORTED',
        'ACKNOWLEDGED', 'WARNED', 'LOCKED', 'DISMISSED'
    ));
