-- Manual rollback for V8__university_subsidy_foundation.sql.
-- Run only after restoring/confirming data safety. Flyway Community does not
-- execute undo migrations automatically.

BEGIN;

DROP INDEX IF EXISTS ix_subsidy_policies_lookup;
DROP INDEX IF EXISTS ix_route_universities_lookup;
DROP INDEX IF EXISTS ix_student_verifications_university;
DROP INDEX IF EXISTS ix_students_university;

ALTER TABLE monthly_passes DROP CONSTRAINT IF EXISTS fk_monthly_passes_subsidy_policy;
ALTER TABLE student_verifications DROP CONSTRAINT IF EXISTS fk_student_verifications_university;
ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_university;
ALTER TABLE subsidy_policies DROP CONSTRAINT IF EXISTS fk_subsidy_policies_campus;
ALTER TABLE subsidy_policies DROP CONSTRAINT IF EXISTS fk_subsidy_policies_university;
ALTER TABLE route_universities DROP CONSTRAINT IF EXISTS fk_route_universities_campus;
ALTER TABLE route_universities DROP CONSTRAINT IF EXISTS fk_route_universities_university;
ALTER TABLE route_universities DROP CONSTRAINT IF EXISTS fk_route_universities_route;
ALTER TABLE campuses DROP CONSTRAINT IF EXISTS fk_campuses_university;

ALTER TABLE invoices
    DROP COLUMN IF EXISTS final_amount,
    DROP COLUMN IF EXISTS subsidy_amount,
    DROP COLUMN IF EXISTS original_amount;

ALTER TABLE monthly_passes
    DROP COLUMN IF EXISTS subsidy_policy_id,
    DROP COLUMN IF EXISTS final_fare_amount,
    DROP COLUMN IF EXISTS subsidy_amount,
    DROP COLUMN IF EXISTS original_fare_amount;

ALTER TABLE student_verifications
    DROP COLUMN IF EXISTS university_id;

ALTER TABLE students
    DROP COLUMN IF EXISTS university_id;

DROP TABLE IF EXISTS subsidy_policies;
DROP TABLE IF EXISTS route_universities;
DROP TABLE IF EXISTS campuses;
DROP TABLE IF EXISTS universities;

COMMIT;
