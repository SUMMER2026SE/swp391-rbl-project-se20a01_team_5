ALTER TABLE route_universities
    ADD COLUMN IF NOT EXISTS subsidy_enabled BOOLEAN DEFAULT TRUE NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_route_universities_active_university_route
    ON route_universities(university_id, route_id)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS ix_route_universities_subsidy
    ON route_universities(university_id, route_id, status, subsidy_enabled, active_from, active_until);

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