-- Align databases that already applied the early V9__university_admin_roster_domains.sql
-- with the final University Linkage MVP schema used by the application.
-- Fresh databases that applied V9__university_linkage_mvp.sql should no-op through this file.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('STUDENT', 'DRIVER', 'CONDUCTOR', 'DISPATCHER', 'UNIVERSITY_ADMIN', 'ADMIN'));

ALTER TABLE university_domains
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE university_admins
    ADD COLUMN IF NOT EXISTS title VARCHAR(100),
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER;

UPDATE university_admins
SET assigned_at = CURRENT_TIMESTAMP
WHERE assigned_at IS NULL;

ALTER TABLE university_admins
    ALTER COLUMN assigned_at SET NOT NULL;

ALTER TABLE university_student_rosters
    ADD COLUMN IF NOT EXISTS faculty VARCHAR(100),
    ADD COLUMN IF NOT EXISTS academic_year INTEGER,
    ADD COLUMN IF NOT EXISTS matched_user_id INTEGER,
    ADD COLUMN IF NOT EXISTS imported_batch_id BIGINT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'university_student_rosters'
          AND column_name = 'import_batch_id'
    ) THEN
        UPDATE university_student_rosters
        SET imported_batch_id = import_batch_id
        WHERE imported_batch_id IS NULL
          AND import_batch_id IS NOT NULL;
    END IF;
END $$;

UPDATE university_import_batches
SET file_name = CONCAT('legacy-roster-import-', import_batch_id, '.csv')
WHERE file_name IS NULL;

ALTER TABLE university_import_batches
    ALTER COLUMN file_name SET NOT NULL;

DO $$
DECLARE
    fallback_user_id INTEGER;
BEGIN
    SELECT user_id
    INTO fallback_user_id
    FROM users
    ORDER BY user_id
    LIMIT 1;

    IF fallback_user_id IS NOT NULL THEN
        UPDATE university_import_batches
        SET imported_by_user_id = fallback_user_id
        WHERE imported_by_user_id IS NULL;
    END IF;
END $$;

ALTER TABLE university_import_batches
    ALTER COLUMN imported_by_user_id SET NOT NULL;

ALTER TABLE university_import_errors
    ADD COLUMN IF NOT EXISTS raw_value TEXT;

UPDATE university_import_errors
SET row_number = 0
WHERE row_number IS NULL;

ALTER TABLE university_import_errors
    ALTER COLUMN row_number SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'university_import_errors'
          AND column_name = 'error_code'
    ) THEN
        ALTER TABLE university_import_errors ALTER COLUMN error_code DROP NOT NULL;
    END IF;
END $$;

ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS university_id INTEGER,
    ADD COLUMN IF NOT EXISTS result VARCHAR(30),
    ADD COLUMN IF NOT EXISTS request_id VARCHAR(80);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_university_roster_email' AND conrelid = 'university_student_rosters'::regclass) THEN
        ALTER TABLE university_student_rosters ADD CONSTRAINT uq_university_roster_email UNIQUE (university_id, email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_university_roster_student_code' AND conrelid = 'university_student_rosters'::regclass) THEN
        ALTER TABLE university_student_rosters ADD CONSTRAINT uq_university_roster_student_code UNIQUE (university_id, student_code);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_domains_university' AND conrelid = 'university_domains'::regclass) THEN
        ALTER TABLE university_domains ADD CONSTRAINT fk_university_domains_university FOREIGN KEY (university_id) REFERENCES universities(university_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_admins_university' AND conrelid = 'university_admins'::regclass) THEN
        ALTER TABLE university_admins ADD CONSTRAINT fk_university_admins_university FOREIGN KEY (university_id) REFERENCES universities(university_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_admins_user' AND conrelid = 'university_admins'::regclass) THEN
        ALTER TABLE university_admins ADD CONSTRAINT fk_university_admins_user FOREIGN KEY (user_id) REFERENCES users(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_admins_assigned_by' AND conrelid = 'university_admins'::regclass) THEN
        ALTER TABLE university_admins ADD CONSTRAINT fk_university_admins_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_rosters_university' AND conrelid = 'university_student_rosters'::regclass) THEN
        ALTER TABLE university_student_rosters ADD CONSTRAINT fk_university_rosters_university FOREIGN KEY (university_id) REFERENCES universities(university_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_rosters_user' AND conrelid = 'university_student_rosters'::regclass) THEN
        ALTER TABLE university_student_rosters ADD CONSTRAINT fk_university_rosters_user FOREIGN KEY (matched_user_id) REFERENCES users(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_rosters_batch' AND conrelid = 'university_student_rosters'::regclass) THEN
        ALTER TABLE university_student_rosters ADD CONSTRAINT fk_university_rosters_batch FOREIGN KEY (imported_batch_id) REFERENCES university_import_batches(import_batch_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_import_batches_university' AND conrelid = 'university_import_batches'::regclass) THEN
        ALTER TABLE university_import_batches ADD CONSTRAINT fk_university_import_batches_university FOREIGN KEY (university_id) REFERENCES universities(university_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_import_batches_user' AND conrelid = 'university_import_batches'::regclass) THEN
        ALTER TABLE university_import_batches ADD CONSTRAINT fk_university_import_batches_user FOREIGN KEY (imported_by_user_id) REFERENCES users(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_university_import_errors_batch' AND conrelid = 'university_import_errors'::regclass) THEN
        ALTER TABLE university_import_errors ADD CONSTRAINT fk_university_import_errors_batch FOREIGN KEY (import_batch_id) REFERENCES university_import_batches(import_batch_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_logs_university' AND conrelid = 'audit_logs'::regclass) THEN
        ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_university FOREIGN KEY (university_id) REFERENCES universities(university_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_university_domains_university
    ON university_domains(university_id, status);

CREATE INDEX IF NOT EXISTS ix_university_admins_university
    ON university_admins(university_id, status);

CREATE INDEX IF NOT EXISTS ix_university_rosters_lookup
    ON university_student_rosters(university_id, status, email);

CREATE INDEX IF NOT EXISTS ix_university_rosters_matched_user
    ON university_student_rosters(matched_user_id);

CREATE INDEX IF NOT EXISTS ix_university_import_batches_university
    ON university_import_batches(university_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_audit_logs_university_time
    ON audit_logs(university_id, performed_at DESC);
