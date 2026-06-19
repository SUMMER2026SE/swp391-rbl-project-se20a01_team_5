ALTER TABLE bus_schedules
    ALTER COLUMN bus_id DROP NOT NULL,
    ALTER COLUMN driver_id DROP NOT NULL,
    ALTER COLUMN conductor_id DROP NOT NULL;
