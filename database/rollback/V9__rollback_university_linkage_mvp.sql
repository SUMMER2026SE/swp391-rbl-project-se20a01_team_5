DROP INDEX IF EXISTS ix_audit_logs_university_time;
DROP INDEX IF EXISTS ix_university_import_batches_university;
DROP INDEX IF EXISTS ix_university_rosters_matched_user;
DROP INDEX IF EXISTS ix_university_rosters_lookup;
DROP INDEX IF EXISTS ix_university_admins_university;
DROP INDEX IF EXISTS ix_university_domains_university;

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_university;
ALTER TABLE audit_logs
    DROP COLUMN IF EXISTS request_id,
    DROP COLUMN IF EXISTS result,
    DROP COLUMN IF EXISTS university_id;

DROP TABLE IF EXISTS university_import_errors;
DROP TABLE IF EXISTS university_student_rosters;
DROP TABLE IF EXISTS university_import_batches;
DROP TABLE IF EXISTS university_admins;
DROP TABLE IF EXISTS university_domains;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('STUDENT', 'DRIVER', 'CONDUCTOR', 'DISPATCHER', 'ADMIN'));
