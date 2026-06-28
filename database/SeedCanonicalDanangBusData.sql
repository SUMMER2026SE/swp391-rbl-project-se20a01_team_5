-- Canonical UniBus demo transport dataset.
-- Hybrid source policy:
--   - Stop names/addresses are based on public Da Nang transit/university locations.
--   - Operating window/frequency references DanaBus public guidance: 05:45-19:00, 15-30 min.
--   - Routes are UniBus demo campus routes, not claimed as official public DanaBus route numbers.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_routes_route_code
    ON routes(route_code)
    WHERE route_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stops_stop_code
    ON stops(stop_code)
    WHERE stop_code IS NOT NULL;

INSERT INTO stops (stop_name, stop_code, address, longitude, latitude, has_shelter, description, status, created_at)
VALUES
    ('Đại học Bách khoa Đà Nẵng', 'DN-ST-BKDN', '54 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng', 108.151090, 16.073570, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=verified_place', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Ký túc xá phía Tây Đà Nẵng', 'DN-ST-KTX-TAY', 'Đường Hà Huy Tập, Thanh Khê, Đà Nẵng', 108.184610, 16.065650, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=needs_periodic_review', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học Sư phạm Đà Nẵng', 'DN-ST-UED', '459 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng', 108.151850, 16.070950, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=verified_place', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học Kinh tế Đà Nẵng', 'DN-ST-DUE', '71 Ngũ Hành Sơn, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng', 108.243120, 16.047010, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=verified_place', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Cầu Rồng', 'DN-ST-CAU-RONG', 'Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 108.227120, 16.061230, FALSE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=landmark', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Bến xe Trung tâm Đà Nẵng', 'DN-ST-BXTT', '97-99 Cao Sơn Pháo, Liên Chiểu, Đà Nẵng', 108.173820, 16.074880, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus route 21 stop list; confidence=official_stop_name', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học Duy Tân - Nguyễn Văn Linh', 'DN-ST-DTU-NVL', '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', 108.214240, 16.060370, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=verified_place', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học FPT Đà Nẵng', 'DN-ST-FPT', 'Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng', 108.252360, 15.981410, TRUE, 'CANONICAL_UNIBUS_DEMO; source=university place cross-check; confidence=verified_place', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Bệnh viện Đà Nẵng', 'DN-ST-BVDN', '124 Hải Phòng, Hải Châu, Đà Nẵng', 108.214920, 16.071480, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=verified_place', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Chợ Hàn', 'DN-ST-CHO-HAN', '119 Trần Phú, Hải Châu, Đà Nẵng', 108.224120, 16.068420, FALSE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=landmark', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Công viên Biển Đông', 'DN-ST-CV-BIEN-DONG', 'Võ Nguyên Giáp, Sơn Trà, Đà Nẵng', 108.247160, 16.069840, TRUE, 'CANONICAL_UNIBUS_DEMO; source=DanaBus/BusMap cross-check; confidence=landmark', 'ACTIVE', CURRENT_TIMESTAMP),
    ('VKU Đà Nẵng', 'DN-ST-VKU', '470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng', 108.237830, 15.975840, TRUE, 'CANONICAL_UNIBUS_DEMO; source=university place cross-check; confidence=verified_place', 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT (stop_code) WHERE stop_code IS NOT NULL DO UPDATE
SET stop_name = EXCLUDED.stop_name,
    address = EXCLUDED.address,
    longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude,
    has_shelter = EXCLUDED.has_shelter,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

WITH route_rows(route_code, route_name, description, distance_km, estimated_minutes, frequency_min, color_hex) AS (
    VALUES
        ('UB-DN-01', 'UniBus 01: Bách khoa - FPT', 'CANONICAL_UNIBUS_DEMO route; sources=DanaBus/BusMap/public campus locations; not official DanaBus route number', 28.40::numeric, 58, 15, '#1565C0'),
        ('UB-DN-02', 'UniBus 02: Bến xe - Kinh tế - FPT', 'CANONICAL_UNIBUS_DEMO route; sources=DanaBus/BusMap/public campus locations; not official DanaBus route number', 24.60::numeric, 60, 20, '#00897B'),
        ('UB-DN-03', 'UniBus 03: Trung tâm - Biển Đông - Kinh tế', 'CANONICAL_UNIBUS_DEMO route; sources=DanaBus/BusMap/public stops; not official DanaBus route number', 21.40::numeric, 48, 20, '#EF6C00'),
        ('UB-DN-04', 'UniBus 04: Bách khoa - Duy Tân - VKU', 'CANONICAL_UNIBUS_DEMO route; sources=DanaBus/BusMap/public campus locations; not official DanaBus route number', 29.80::numeric, 66, 25, '#7B1FA2'),
        ('UB-DN-05', 'UniBus 05: Bến xe - Bách khoa - Sư phạm', 'CANONICAL_UNIBUS_DEMO route; sources=DanaBus route 21 plus campus locations; not official DanaBus route number', 12.80::numeric, 32, 15, '#C62828'),
        ('UB-DN-06', 'UniBus 06: FPT - VKU - Kinh tế', 'CANONICAL_UNIBUS_DEMO route; sources=public campus locations; not official DanaBus route number', 17.20::numeric, 42, 20, '#6A1B9A')
)
INSERT INTO routes (route_name, route_code, description, distance_km, estimated_minutes, frequency_min, color_hex, is_circular, status, created_at)
SELECT route_name, route_code, description, distance_km, estimated_minutes, frequency_min, color_hex, FALSE, 'ACTIVE', CURRENT_TIMESTAMP
FROM route_rows
ON CONFLICT (route_code) WHERE route_code IS NOT NULL DO UPDATE
SET route_name = EXCLUDED.route_name,
    description = EXCLUDED.description,
    distance_km = EXCLUDED.distance_km,
    estimated_minutes = EXCLUDED.estimated_minutes,
    frequency_min = EXCLUDED.frequency_min,
    color_hex = EXCLUDED.color_hex,
    is_circular = EXCLUDED.is_circular,
    status = EXCLUDED.status;

WITH route_data AS (
    SELECT route_id, route_code FROM routes WHERE route_code LIKE 'UB-DN-%'
),
fare_rows(route_code, fare_type, amount) AS (
    VALUES
        ('UB-DN-01', 'SINGLE', 7000::numeric), ('UB-DN-01', 'MONTHLY', 120000::numeric),
        ('UB-DN-02', 'SINGLE', 9000::numeric), ('UB-DN-02', 'MONTHLY', 150000::numeric),
        ('UB-DN-03', 'SINGLE', 8000::numeric), ('UB-DN-03', 'MONTHLY', 135000::numeric),
        ('UB-DN-04', 'SINGLE', 10000::numeric), ('UB-DN-04', 'MONTHLY', 165000::numeric),
        ('UB-DN-05', 'SINGLE', 6000::numeric), ('UB-DN-05', 'MONTHLY', 110000::numeric),
        ('UB-DN-06', 'SINGLE', 8000::numeric), ('UB-DN-06', 'MONTHLY', 140000::numeric)
)
INSERT INTO fares (route_id, fare_type, amount, effective_from, notes)
SELECT r.route_id, fr.fare_type, fr.amount, CURRENT_DATE - INTERVAL '1 day',
       'DEMO_POLICY; UniBus demo fare, not official DanaBus fare'
FROM fare_rows fr
JOIN route_data r ON r.route_code = fr.route_code
WHERE NOT EXISTS (
    SELECT 1
    FROM fares f
    WHERE f.route_id = r.route_id
      AND f.fare_type = fr.fare_type
      AND f.effective_until IS NULL
);

WITH route_data AS (
    SELECT route_id, route_code FROM routes WHERE route_code LIKE 'UB-DN-%'
),
stop_data AS (
    SELECT stop_id, stop_code FROM stops WHERE stop_code LIKE 'DN-ST-%'
),
route_stop_rows(route_code, stop_code, stop_order, minutes_from_previous_stop) AS (
    VALUES
        ('UB-DN-01', 'DN-ST-BKDN', 1, 0), ('UB-DN-01', 'DN-ST-UED', 2, 5), ('UB-DN-01', 'DN-ST-KTX-TAY', 3, 12), ('UB-DN-01', 'DN-ST-CAU-RONG', 4, 12), ('UB-DN-01', 'DN-ST-DUE', 5, 12), ('UB-DN-01', 'DN-ST-FPT', 6, 22),
        ('UB-DN-02', 'DN-ST-BXTT', 1, 0), ('UB-DN-02', 'DN-ST-BVDN', 2, 10), ('UB-DN-02', 'DN-ST-CHO-HAN', 3, 8), ('UB-DN-02', 'DN-ST-DUE', 4, 14), ('UB-DN-02', 'DN-ST-FPT', 5, 24),
        ('UB-DN-03', 'DN-ST-BXTT', 1, 0), ('UB-DN-03', 'DN-ST-BVDN', 2, 7), ('UB-DN-03', 'DN-ST-CHO-HAN', 3, 6), ('UB-DN-03', 'DN-ST-CV-BIEN-DONG', 4, 10), ('UB-DN-03', 'DN-ST-DUE', 5, 12),
        ('UB-DN-04', 'DN-ST-BKDN', 1, 0), ('UB-DN-04', 'DN-ST-DTU-NVL', 2, 18), ('UB-DN-04', 'DN-ST-CAU-RONG', 3, 8), ('UB-DN-04', 'DN-ST-FPT', 4, 22), ('UB-DN-04', 'DN-ST-VKU', 5, 10),
        ('UB-DN-05', 'DN-ST-BXTT', 1, 0), ('UB-DN-05', 'DN-ST-BKDN', 2, 15), ('UB-DN-05', 'DN-ST-UED', 3, 5), ('UB-DN-05', 'DN-ST-KTX-TAY', 4, 12),
        ('UB-DN-06', 'DN-ST-FPT', 1, 0), ('UB-DN-06', 'DN-ST-VKU', 2, 10), ('UB-DN-06', 'DN-ST-DUE', 3, 20), ('UB-DN-06', 'DN-ST-CV-BIEN-DONG', 4, 12)
)
INSERT INTO route_stops (route_id, stop_id, stop_order, minutes_from_previous_stop)
SELECT r.route_id, s.stop_id, rsr.stop_order, rsr.minutes_from_previous_stop
FROM route_stop_rows rsr
JOIN route_data r ON r.route_code = rsr.route_code
JOIN stop_data s ON s.stop_code = rsr.stop_code
ON CONFLICT (route_id, stop_order) DO UPDATE
SET stop_id = EXCLUDED.stop_id,
    minutes_from_previous_stop = EXCLUDED.minutes_from_previous_stop;

INSERT INTO buses (license_plate, seat_count, bus_type, manufacture_year, status)
VALUES
    ('43B-UB01', 45, 'Standard', 2024, 'READY'),
    ('43B-UB02', 45, 'Standard', 2024, 'READY'),
    ('43B-UB03', 36, 'Standard', 2023, 'READY'),
    ('43B-UB04', 29, 'Mini Bus', 2023, 'READY')
ON CONFLICT (license_plate) DO UPDATE
SET seat_count = EXCLUDED.seat_count,
    bus_type = EXCLUDED.bus_type,
    manufacture_year = EXCLUDED.manufacture_year,
    status = EXCLUDED.status;

WITH admin_user AS (
    SELECT user_id FROM users WHERE role = 'ADMIN' ORDER BY user_id LIMIT 1
),
route_data AS (
    SELECT route_id, route_code FROM routes WHERE route_code LIKE 'UB-DN-%'
),
bus_data AS (
    SELECT bus_id, license_plate FROM buses WHERE license_plate IN ('43B-UB01','43B-UB02','43B-UB03','43B-UB04')
),
driver_data AS (
    SELECT driver_id, row_number() OVER (ORDER BY driver_id) AS rn FROM drivers
),
conductor_data AS (
    SELECT conductor_id, row_number() OVER (ORDER BY conductor_id) AS rn FROM conductors
),
demo_driver AS (
    SELECT d.driver_id
    FROM drivers d
    JOIN users u ON u.user_id = d.user_id
    WHERE u.email = 'driver.demo@unibus.local'
    LIMIT 1
),
demo_conductor AS (
    SELECT c.conductor_id
    FROM conductors c
    JOIN users u ON u.user_id = c.user_id
    WHERE u.email = 'conductor.demo@unibus.local'
    LIMIT 1
),
schedule_rows(route_code, bus_plate, departure_time, end_time, staff_slot) AS (
    VALUES
        ('UB-DN-01', '43B-UB01', '06:15'::time, '07:15'::time, 1),
        ('UB-DN-01', '43B-UB01', '07:30'::time, '08:30'::time, 1),
        ('UB-DN-01', '43B-UB01', '16:30'::time, '17:30'::time, 1),
        ('UB-DN-02', '43B-UB02', '06:30'::time, '07:35'::time, 2),
        ('UB-DN-02', '43B-UB02', '17:00'::time, '18:05'::time, 2),
        ('UB-DN-03', '43B-UB03', '07:00'::time, '07:50'::time, 1),
        ('UB-DN-04', '43B-UB04', '06:45'::time, '07:55'::time, 2),
        ('UB-DN-05', '43B-UB03', '06:20'::time, '06:55'::time, 1),
        ('UB-DN-06', '43B-UB04', '07:10'::time, '07:55'::time, 2)
)
INSERT INTO bus_schedules (route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, end_time, status, assigned_by_user_id, assigned_at)
SELECT r.route_id,
       b.bus_id,
       CASE WHEN sr.route_code = 'UB-DN-01' THEN COALESCE(demo_driver.driver_id, d.driver_id) ELSE d.driver_id END,
       CASE WHEN sr.route_code = 'UB-DN-01' THEN COALESCE(demo_conductor.conductor_id, c.conductor_id) ELSE c.conductor_id END,
       EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER,
       sr.departure_time,
       sr.end_time,
       'ACTIVE',
       admin_user.user_id,
       CURRENT_TIMESTAMP
FROM schedule_rows sr
JOIN route_data r ON r.route_code = sr.route_code
JOIN bus_data b ON b.license_plate = sr.bus_plate
LEFT JOIN driver_data d ON d.rn = sr.staff_slot
LEFT JOIN conductor_data c ON c.rn = sr.staff_slot
LEFT JOIN demo_driver ON TRUE
LEFT JOIN demo_conductor ON TRUE
CROSS JOIN admin_user
WHERE NOT EXISTS (
    SELECT 1
    FROM bus_schedules existing
    WHERE existing.route_id = r.route_id
      AND existing.weekday_number = EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER
      AND existing.departure_time = sr.departure_time
);

WITH fallback_driver AS (
    SELECT d.driver_id
    FROM drivers d
    JOIN users u ON u.user_id = d.user_id
    ORDER BY CASE WHEN u.email = 'driver.demo@unibus.local' THEN 0 ELSE 1 END, d.driver_id
    LIMIT 1
),
fallback_conductor AS (
    SELECT c.conductor_id
    FROM conductors c
    JOIN users u ON u.user_id = c.user_id
    ORDER BY CASE WHEN u.email = 'conductor.demo@unibus.local' THEN 0 ELSE 1 END, c.conductor_id
    LIMIT 1
)
UPDATE bus_schedules bs
SET driver_id = COALESCE(bs.driver_id, fallback_driver.driver_id),
    conductor_id = COALESCE(bs.conductor_id, fallback_conductor.conductor_id)
FROM routes r
CROSS JOIN fallback_driver
CROSS JOIN fallback_conductor
WHERE bs.route_id = r.route_id
  AND r.route_code LIKE 'UB-DN-%'
  AND (bs.driver_id IS NULL OR bs.conductor_id IS NULL);

WITH today_schedules AS (
    SELECT bs.schedule_id, bs.route_id, bs.bus_id, bs.driver_id, bs.conductor_id,
           row_number() OVER (PARTITION BY r.route_code ORDER BY bs.departure_time) AS rn,
           r.route_code
    FROM bus_schedules bs
    JOIN routes r ON r.route_id = bs.route_id
    WHERE r.route_code IN ('UB-DN-01','UB-DN-02','UB-DN-03','UB-DN-04','UB-DN-05','UB-DN-06')
      AND bs.weekday_number = EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER
      AND bs.bus_id IS NOT NULL
      AND bs.driver_id IS NOT NULL
)
INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
SELECT schedule_id,
       route_id,
       bus_id,
       driver_id,
       conductor_id,
       CURRENT_DATE,
       CASE WHEN route_code = 'UB-DN-01' AND rn = 1 THEN CURRENT_TIMESTAMP - INTERVAL '12 minutes' ELSE NULL END,
       NULL,
       CASE WHEN route_code = 'UB-DN-01' AND rn = 1 THEN 'RUNNING' ELSE 'NOT_STARTED' END,
       'Canonical UniBus demo trip'
FROM today_schedules
WHERE rn = 1
  AND NOT EXISTS (
      SELECT 1
      FROM trips existing
      WHERE existing.schedule_id = today_schedules.schedule_id
        AND existing.service_date = CURRENT_DATE
  );

DELETE FROM vehicle_locations
WHERE trip_id IN (
    SELECT t.trip_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE t.service_date = CURRENT_DATE
      AND r.route_code IN ('UB-DN-01','UB-DN-02','UB-DN-03','UB-DN-04','UB-DN-05','UB-DN-06')
);

WITH running_trips AS (
    SELECT t.trip_id, t.bus_id, r.route_code
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE t.service_date = CURRENT_DATE
      AND r.route_code IN ('UB-DN-01','UB-DN-02','UB-DN-03','UB-DN-04','UB-DN-05','UB-DN-06')
),
location_rows(route_code, longitude, latitude, speed_kmh, occupancy) AS (
    VALUES
        ('UB-DN-01', 108.184610::numeric, 16.065650::numeric, 32::numeric, 18),
        ('UB-DN-02', 108.214920::numeric, 16.071480::numeric, 28::numeric, 12),
        ('UB-DN-03', 108.224120::numeric, 16.068420::numeric, 24::numeric, 20),
        ('UB-DN-04', 108.214240::numeric, 16.060370::numeric, 30::numeric, 9),
        ('UB-DN-05', 108.151090::numeric, 16.073570::numeric, 22::numeric, 15),
        ('UB-DN-06', 108.237830::numeric, 15.975840::numeric, 25::numeric, 11)
)
INSERT INTO vehicle_locations (bus_id, trip_id, longitude, latitude, speed_kmh, occupancy, updated_at)
SELECT rt.bus_id, rt.trip_id, lr.longitude, lr.latitude, lr.speed_kmh, lr.occupancy, CURRENT_TIMESTAMP
FROM running_trips rt
JOIN location_rows lr ON lr.route_code = rt.route_code;

WITH demo_universities AS (
    SELECT university_id FROM universities WHERE code IN ('UNIBUS_DEMO_FLOW', 'DHBK_DHDN')
),
canonical_routes AS (
    SELECT route_id FROM routes WHERE route_code LIKE 'UB-DN-%'
)
INSERT INTO route_universities (route_id, university_id, active_from, active_until, status, created_at, updated_at)
SELECT r.route_id, u.university_id, CURRENT_DATE - 1, NULL, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM canonical_routes r
CROSS JOIN demo_universities u
WHERE NOT EXISTS (
    SELECT 1
    FROM route_universities ru
    WHERE ru.route_id = r.route_id
      AND ru.university_id = u.university_id
      AND ru.status = 'ACTIVE'
);

COMMIT;
