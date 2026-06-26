ALTER TABLE users
    ADD COLUMN IF NOT EXISTS lock_reason VARCHAR(500);

ALTER TABLE monthly_passes
    ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS scans_today INTEGER NOT NULL DEFAULT 0;

UPDATE monthly_passes
SET qr_code = 'UB-MONTHLY-' || monthly_pass_id || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)
WHERE qr_code IS NULL OR qr_code = '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_monthly_passes_qr_code
    ON monthly_passes(qr_code)
    WHERE qr_code IS NOT NULL;

ALTER TABLE single_trip_tickets
    ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS scanned_by_conductor_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS uq_single_trip_tickets_qr_code
    ON single_trip_tickets(qr_code)
    WHERE qr_code IS NOT NULL;

ALTER TABLE vehicle_locations
    ADD COLUMN IF NOT EXISTS speed_kmh NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS ix_vehicle_locations_trip_time
    ON vehicle_locations(trip_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS ix_vehicle_locations_bus_time
    ON vehicle_locations(bus_id, updated_at DESC);
