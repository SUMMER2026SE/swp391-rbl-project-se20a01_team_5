ALTER TABLE route_universities
    ADD COLUMN IF NOT EXISTS subsidy_enabled BOOLEAN DEFAULT TRUE NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_route_universities_active_university_route
    ON route_universities(university_id, route_id)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS ix_route_universities_subsidy
    ON route_universities(university_id, route_id, status, subsidy_enabled, active_from, active_until);
