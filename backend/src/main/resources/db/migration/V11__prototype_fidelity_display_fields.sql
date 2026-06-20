ALTER TABLE routes
    ADD COLUMN IF NOT EXISTS route_code VARCHAR(30),
    ADD COLUMN IF NOT EXISTS color_hex VARCHAR(20),
    ADD COLUMN IF NOT EXISTS frequency_min INTEGER;

ALTER TABLE stops
    ADD COLUMN IF NOT EXISTS stop_code VARCHAR(30),
    ADD COLUMN IF NOT EXISTS has_shelter BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE vehicle_locations
    ADD COLUMN IF NOT EXISTS occupancy INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS uq_routes_route_code
    ON routes(route_code)
    WHERE route_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stops_stop_code
    ON stops(stop_code)
    WHERE stop_code IS NOT NULL;

ALTER TABLE routes
    DROP CONSTRAINT IF EXISTS ck_routes_color_hex,
    ADD CONSTRAINT ck_routes_color_hex
        CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE routes
    DROP CONSTRAINT IF EXISTS ck_routes_frequency_min,
    ADD CONSTRAINT ck_routes_frequency_min
        CHECK (frequency_min IS NULL OR frequency_min > 0);

ALTER TABLE vehicle_locations
    DROP CONSTRAINT IF EXISTS ck_vehicle_locations_occupancy,
    ADD CONSTRAINT ck_vehicle_locations_occupancy
        CHECK (occupancy IS NULL OR occupancy >= 0);
