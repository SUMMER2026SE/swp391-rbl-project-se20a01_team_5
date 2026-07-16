BEGIN;

-- Restores columns present in the former shared RDS but missing from the V6 snapshot/migration chain.
ALTER TABLE university_admins
    ADD COLUMN IF NOT EXISTS permissions VARCHAR(500);

COMMIT;
