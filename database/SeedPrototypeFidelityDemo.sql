-- Prototype fidelity QA data for UI v1.1.
-- Run after:
--   1. Flyway V11
--   2. database/SeedStudentVerificationTestData.sql
--   3. database/SeedUiV11MvpDemo.sql
--   4. database/SeedKhanhStudentUiTestData.sql
--
-- This script enriches the real database so the UI can look like the prototype
-- without restoring frontend mocks.

BEGIN;

INSERT INTO universities (code, name, short_name, contact_email, status)
VALUES
    ('DTU_DANANG', 'Đại học Duy Tân', 'Duy Tân', 'ctsv@duytan.edu.vn', 'ACTIVE'),
    ('VKU_DANANG', 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'VKU', 'ctsv@vku.udn.vn', 'ACTIVE')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH dtu AS (
    SELECT university_id FROM universities WHERE code = 'DTU_DANANG'
)
INSERT INTO campuses (university_id, code, name, address, latitude, longitude, status)
SELECT university_id, 'DTU_MAIN', 'Cơ sở Nguyễn Văn Linh', '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', 16.060370, 108.214240, 'ACTIVE'
FROM dtu
ON CONFLICT (university_id, code) DO UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH universities_seed AS (
    SELECT university_id, domain
    FROM universities u
    JOIN (VALUES
        ('DTU_DANANG', 'duytan.edu.vn'),
        ('DTU_DANANG', 'mydtu.duytan.edu.vn'),
        ('VKU_DANANG', 'vku.udn.vn')
    ) AS d(code, domain) ON d.code = u.code
)
INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
SELECT university_id, domain, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM universities_seed
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id,
    status = EXCLUDED.status,
    verified_at = EXCLUDED.verified_at,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (email, password_hash, full_name, phone_number, role, status, email_verified_at, student_verification_status, created_at, updated_at)
VALUES
    ('driver.iter1@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Nguyễn Minh Tài', '0901000001', 'DRIVER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('conductor.iter1@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Trần Gia Hân', '0901000002', 'CONDUCTOR', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dispatcher.iter1@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Lê Quốc Bảo', '0901000003', 'DISPATCHER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    email_verified_at = EXCLUDED.email_verified_at,
    updated_at = CURRENT_TIMESTAMP;

WITH driver_user AS (
    SELECT user_id FROM users WHERE email = 'driver.iter1@unibus.local'
)
INSERT INTO drivers (user_id, license_number, years_experience, average_rating, work_status)
SELECT user_id, 'ITER1-DRIVER-LICENSE', 6, 4.80, 'RUNNING'
FROM driver_user
ON CONFLICT (license_number) DO UPDATE
SET user_id = EXCLUDED.user_id,
    years_experience = EXCLUDED.years_experience,
    average_rating = EXCLUDED.average_rating,
    work_status = EXCLUDED.work_status;

WITH conductor_user AS (
    SELECT user_id FROM users WHERE email = 'conductor.iter1@unibus.local'
)
INSERT INTO conductors (user_id, employee_code)
SELECT user_id, 'ITER1-CONDUCTOR'
FROM conductor_user
ON CONFLICT (employee_code) DO UPDATE
SET user_id = EXCLUDED.user_id;

WITH dispatcher_user AS (
    SELECT user_id FROM users WHERE email = 'dispatcher.iter1@unibus.local'
)
INSERT INTO dispatchers (user_id, employee_code, department)
SELECT user_id, 'ITER1-DISPATCHER', 'Operations'
FROM dispatcher_user
ON CONFLICT (employee_code) DO UPDATE
SET user_id = EXCLUDED.user_id,
    department = EXCLUDED.department;

WITH dtu AS (
    SELECT university_id, name FROM universities WHERE code = 'DTU_DANANG'
),
khanh AS (
    SELECT u.user_id, s.student_code
    FROM users u
    JOIN students s ON s.user_id = u.user_id
    WHERE LOWER(u.email) = 'khanhnv20a02@gmail.com'
)
UPDATE students s
SET university = dtu.name,
    university_id = dtu.university_id,
    faculty = COALESCE(s.faculty, 'Software Engineering'),
    academic_year = COALESCE(s.academic_year, 3)
FROM dtu
CROSS JOIN khanh
WHERE khanh.student_code = s.student_code;

WITH dtu AS (
    SELECT university_id FROM universities WHERE code = 'DTU_DANANG'
),
khanh AS (
    SELECT u.user_id, u.email, u.full_name, s.student_code
    FROM users u
    JOIN students s ON s.user_id = u.user_id
    WHERE LOWER(u.email) = 'khanhnv20a02@gmail.com'
)
INSERT INTO university_student_rosters (university_id, email, student_code, full_name, faculty, academic_year, status, matched_user_id, created_at, updated_at)
SELECT dtu.university_id, LOWER(khanh.email), khanh.student_code, khanh.full_name, 'Software Engineering', 3, 'ACTIVE', khanh.user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM dtu
CROSS JOIN khanh
ON CONFLICT (university_id, email) DO UPDATE
SET student_code = EXCLUDED.student_code,
    full_name = EXCLUDED.full_name,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year,
    status = 'ACTIVE',
    matched_user_id = EXCLUDED.matched_user_id,
    updated_at = CURRENT_TIMESTAMP;

WITH stop_updates(stop_name, stop_code, has_shelter) AS (
    VALUES
        ('Đại học Bách khoa Đà Nẵng', 'ST-01', TRUE),
        ('Ký túc xá phía Tây Đà Nẵng', 'ST-02', TRUE),
        ('Đại học Sư phạm Đà Nẵng', 'ST-03', TRUE),
        ('Đại học Kinh tế Đà Nẵng', 'ST-04', TRUE),
        ('Cầu Rồng', 'ST-05', FALSE),
        ('Bến xe Trung tâm Đà Nẵng', 'ST-06', TRUE),
        ('Đại học Duy Tân', 'ST-07', TRUE),
        ('Đại học FPT Đà Nẵng', 'ST-08', TRUE)
)
UPDATE stops s
SET stop_code = su.stop_code,
    has_shelter = su.has_shelter
FROM stop_updates su
WHERE s.stop_name = su.stop_name;

WITH new_stops(stop_code, stop_name, address, longitude, latitude, has_shelter) AS (
    VALUES
        ('ST-09', 'Bệnh viện Đà Nẵng', '124 Hải Phòng, Hải Châu, Đà Nẵng', 108.214920::numeric, 16.071480::numeric, TRUE),
        ('ST-10', 'Chợ Hàn', '119 Trần Phú, Hải Châu, Đà Nẵng', 108.224120::numeric, 16.068420::numeric, FALSE),
        ('ST-11', 'Công viên Biển Đông', 'Võ Nguyên Giáp, Sơn Trà, Đà Nẵng', 108.247160::numeric, 16.069840::numeric, TRUE),
        ('ST-12', 'VKU Đà Nẵng', '470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng', 108.237830::numeric, 15.975840::numeric, TRUE)
)
INSERT INTO stops (stop_name, stop_code, address, longitude, latitude, has_shelter, description, status, created_at)
SELECT stop_name, stop_code, address, longitude, latitude, has_shelter, 'Prototype fidelity seed stop', 'ACTIVE', CURRENT_TIMESTAMP
FROM new_stops ns
WHERE NOT EXISTS (SELECT 1 FROM stops s WHERE s.stop_code = ns.stop_code);

UPDATE routes
SET route_name = 'DN-01 Campus Loop',
    route_code = 'DN-01',
    color_hex = '#1565C0',
    frequency_min = 8
WHERE description LIKE 'ITER1 seed route:%Campus Loop%'
   OR description ILIKE 'ITER1 seed route:%campus loop%'
   OR route_name = 'ITER1 - Campus Loop';

UPDATE routes
SET route_name = 'DN-02 City Connector',
    route_code = 'DN-02',
    color_hex = '#00897B',
    frequency_min = 12
WHERE description LIKE 'ITER1 seed route:%City Connector%'
   OR description ILIKE 'ITER1 seed route:%city connector%'
   OR route_name = 'ITER1 - City Connector';

WITH new_routes(route_code, route_name, description, distance_km, estimated_minutes, frequency_min, color_hex) AS (
    VALUES
        ('DN-03', 'DN-03 Beach Express', 'Prototype fidelity seed route: beach express', 21.40::numeric, 48, 15, '#EF6C00'),
        ('DN-04', 'DN-04 Tech Park Shuttle', 'Prototype fidelity seed route: tech park shuttle', 29.80::numeric, 66, 20, '#7B1FA2')
)
INSERT INTO routes (route_name, route_code, description, distance_km, estimated_minutes, frequency_min, color_hex, is_circular, status, created_at)
SELECT route_name, route_code, description, distance_km, estimated_minutes, frequency_min, color_hex, FALSE, 'ACTIVE', CURRENT_TIMESTAMP
FROM new_routes nr
WHERE NOT EXISTS (SELECT 1 FROM routes r WHERE r.route_code = nr.route_code);

WITH route_data AS (
    SELECT route_id, route_code FROM routes WHERE route_code IN ('DN-01', 'DN-02', 'DN-03', 'DN-04')
),
fare_rows(route_code, fare_type, amount) AS (
    VALUES
        ('DN-01', 'SINGLE', 7000::numeric),
        ('DN-01', 'MONTHLY', 120000::numeric),
        ('DN-02', 'SINGLE', 9000::numeric),
        ('DN-02', 'MONTHLY', 150000::numeric),
        ('DN-03', 'SINGLE', 8000::numeric),
        ('DN-03', 'MONTHLY', 135000::numeric),
        ('DN-04', 'SINGLE', 10000::numeric),
        ('DN-04', 'MONTHLY', 165000::numeric)
)
INSERT INTO fares (route_id, fare_type, amount, effective_from, notes)
SELECT r.route_id, fr.fare_type, fr.amount, CURRENT_DATE - INTERVAL '1 day', 'Prototype fidelity fare'
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
    SELECT route_id, route_code FROM routes WHERE route_code IN ('DN-01', 'DN-02', 'DN-03', 'DN-04')
),
stop_data AS (
    SELECT stop_id, stop_code FROM stops WHERE stop_code IN ('ST-01','ST-02','ST-03','ST-04','ST-05','ST-06','ST-07','ST-08','ST-09','ST-10','ST-11','ST-12')
),
route_stop_rows(route_code, stop_code, stop_order, minutes_from_previous_stop) AS (
    VALUES
        ('DN-03', 'ST-06', 1, 0),
        ('DN-03', 'ST-09', 2, 7),
        ('DN-03', 'ST-10', 3, 6),
        ('DN-03', 'ST-11', 4, 10),
        ('DN-03', 'ST-04', 5, 12),
        ('DN-04', 'ST-01', 1, 0),
        ('DN-04', 'ST-07', 2, 14),
        ('DN-04', 'ST-05', 3, 8),
        ('DN-04', 'ST-08', 4, 22),
        ('DN-04', 'ST-12', 5, 10)
)
INSERT INTO route_stops (route_id, stop_id, stop_order, minutes_from_previous_stop)
SELECT r.route_id, s.stop_id, rsr.stop_order, rsr.minutes_from_previous_stop
FROM route_stop_rows rsr
JOIN route_data r ON r.route_code = rsr.route_code
JOIN stop_data s ON s.stop_code = rsr.stop_code
WHERE NOT EXISTS (
    SELECT 1
    FROM route_stops existing
    WHERE existing.route_id = r.route_id
      AND existing.stop_id = s.stop_id
);

INSERT INTO buses (license_plate, seat_count, bus_type, manufacture_year, status)
VALUES
    ('43B-DN01', 45, 'Standard', 2023, 'RUNNING'),
    ('43B-DN02', 36, 'Standard', 2022, 'READY'),
    ('43B-DN03', 29, 'Mini Bus', 2021, 'READY'),
    ('43B-DN04', 45, 'Standard', 2024, 'READY')
ON CONFLICT (license_plate) DO UPDATE
SET seat_count = EXCLUDED.seat_count,
    bus_type = EXCLUDED.bus_type,
    manufacture_year = EXCLUDED.manufacture_year,
    status = EXCLUDED.status;

WITH route_data AS (
    SELECT route_id, route_code FROM routes WHERE route_code IN ('DN-01', 'DN-02', 'DN-03', 'DN-04')
),
bus_data AS (
    SELECT bus_id, license_plate FROM buses WHERE license_plate IN ('43B-DN01', '43B-DN02', '43B-DN03', '43B-DN04')
),
driver_data AS (
    SELECT driver_id FROM drivers WHERE license_number = 'ITER1-DRIVER-LICENSE'
),
conductor_data AS (
    SELECT conductor_id FROM conductors WHERE employee_code = 'ITER1-CONDUCTOR'
),
schedule_rows(route_code, license_plate, departure_time, end_time) AS (
    VALUES
        ('DN-01', '43B-DN01', TIME '07:15', TIME '08:00'),
        ('DN-02', '43B-DN02', TIME '08:30', TIME '09:35'),
        ('DN-03', '43B-DN03', TIME '09:00', TIME '09:50'),
        ('DN-04', '43B-DN04', TIME '10:15', TIME '11:25')
)
INSERT INTO bus_schedules (route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, end_time, status, assigned_by_user_id, assigned_at)
SELECT r.route_id, b.bus_id, d.driver_id, c.conductor_id, EXTRACT(ISODOW FROM CURRENT_DATE)::int,
       sr.departure_time, sr.end_time, 'ACTIVE',
       (SELECT user_id FROM users WHERE email = 'dispatcher.iter1@unibus.local'),
       CURRENT_TIMESTAMP
FROM schedule_rows sr
JOIN route_data r ON r.route_code = sr.route_code
JOIN bus_data b ON b.license_plate = sr.license_plate
CROSS JOIN driver_data d
CROSS JOIN conductor_data c
WHERE NOT EXISTS (
    SELECT 1
    FROM bus_schedules bs
    WHERE bs.route_id = r.route_id
      AND bs.weekday_number = EXTRACT(ISODOW FROM CURRENT_DATE)::int
      AND bs.departure_time = sr.departure_time
);

WITH schedules AS (
    SELECT bs.schedule_id, bs.route_id, bs.bus_id, bs.driver_id, bs.conductor_id, r.route_code
    FROM bus_schedules bs
    JOIN routes r ON r.route_id = bs.route_id
    WHERE r.route_code IN ('DN-01', 'DN-02', 'DN-03', 'DN-04')
      AND bs.weekday_number = EXTRACT(ISODOW FROM CURRENT_DATE)::int
)
INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
SELECT schedule_id, route_id, bus_id, driver_id, conductor_id, CURRENT_DATE,
       CASE WHEN route_code = 'DN-01' THEN CURRENT_TIMESTAMP - INTERVAL '16 minutes'
            WHEN route_code = 'DN-03' THEN CURRENT_TIMESTAMP - INTERVAL '55 minutes'
            ELSE NULL END,
       CASE WHEN route_code = 'DN-03' THEN CURRENT_TIMESTAMP - INTERVAL '8 minutes' ELSE NULL END,
       CASE WHEN route_code = 'DN-01' THEN 'RUNNING'
            WHEN route_code = 'DN-03' THEN 'COMPLETED'
            ELSE 'NOT_STARTED' END,
       'Prototype fidelity seed trip'
FROM schedules s
WHERE NOT EXISTS (
    SELECT 1
    FROM trips t
    WHERE t.schedule_id = s.schedule_id
      AND t.service_date = CURRENT_DATE
);

WITH live_trips AS (
    SELECT t.trip_id, t.bus_id, r.route_code
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.route_code IN ('DN-01', 'DN-02', 'DN-03', 'DN-04')
      AND t.service_date = CURRENT_DATE
)
DELETE FROM vehicle_locations vl
USING live_trips lt
WHERE vl.trip_id = lt.trip_id;

WITH live_trips AS (
    SELECT t.trip_id, t.bus_id, r.route_code
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.route_code IN ('DN-01', 'DN-02', 'DN-03', 'DN-04')
      AND t.service_date = CURRENT_DATE
),
location_rows(route_code, longitude, latitude, speed_kmh, occupancy) AS (
    VALUES
        ('DN-01', 108.208900::numeric, 16.063820::numeric, 28.5::numeric, 32),
        ('DN-02', 108.173820::numeric, 16.074880::numeric, 0::numeric, 8),
        ('DN-03', 108.247160::numeric, 16.069840::numeric, 0::numeric, 18),
        ('DN-04', 108.237830::numeric, 15.975840::numeric, 0::numeric, 6)
)
INSERT INTO vehicle_locations (bus_id, trip_id, longitude, latitude, speed_kmh, occupancy, updated_at)
SELECT lt.bus_id, lt.trip_id, lr.longitude, lr.latitude, lr.speed_kmh, lr.occupancy, CURRENT_TIMESTAMP
FROM live_trips lt
JOIN location_rows lr ON lr.route_code = lt.route_code;

WITH khanh AS (
    SELECT u.user_id, s.student_code, s.university_id
    FROM users u
    JOIN students s ON s.user_id = u.user_id
    WHERE LOWER(u.email) = 'khanhnv20a02@gmail.com'
),
routes_seed AS (
    SELECT route_id FROM routes WHERE route_code IN ('DN-01', 'DN-02', 'DN-03', 'DN-04')
)
INSERT INTO route_universities (route_id, university_id, active_from, active_until, status)
SELECT r.route_id, khanh.university_id, CURRENT_DATE - INTERVAL '1 day', NULL, 'ACTIVE'
FROM routes_seed r
CROSS JOIN khanh
WHERE khanh.university_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM route_universities ru
      WHERE ru.route_id = r.route_id
        AND ru.university_id = khanh.university_id
        AND ru.status = 'ACTIVE'
  );

WITH khanh AS (
    SELECT s.student_code
    FROM users u
    JOIN students s ON s.user_id = u.user_id
    WHERE LOWER(u.email) = 'khanhnv20a02@gmail.com'
),
route_data AS (
    SELECT route_id FROM routes WHERE route_code = 'DN-01'
),
boarding_stop AS (
    SELECT rs.stop_id
    FROM route_stops rs
    JOIN route_data r ON r.route_id = rs.route_id
    WHERE rs.stop_order = 5
),
alighting_stop AS (
    SELECT rs.stop_id
    FROM route_stops rs
    JOIN route_data r ON r.route_id = rs.route_id
    WHERE rs.stop_order = 6
),
approver AS (
    SELECT user_id FROM users WHERE role = 'ADMIN' ORDER BY user_id LIMIT 1
)
INSERT INTO route_registrations (student_code, route_id, boarding_stop_id, alighting_stop_id, registered_at, effective_date, status, approved_by_user_id, approved_at)
SELECT khanh.student_code, r.route_id, b.stop_id, a.stop_id, CURRENT_TIMESTAMP, CURRENT_DATE, 'APPROVED', approver.user_id, CURRENT_TIMESTAMP
FROM khanh
CROSS JOIN route_data r
CROSS JOIN boarding_stop b
CROSS JOIN alighting_stop a
LEFT JOIN approver ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM route_registrations rr
    WHERE rr.student_code = khanh.student_code
      AND rr.route_id = r.route_id
      AND rr.status = 'APPROVED'
);

WITH khanh AS (
    SELECT u.user_id, s.student_code
    FROM users u
    JOIN students s ON s.user_id = u.user_id
    WHERE LOWER(u.email) = 'khanhnv20a02@gmail.com'
),
completed_trip AS (
    SELECT t.trip_id, t.route_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.route_code = 'DN-03'
      AND t.status = 'COMPLETED'
    ORDER BY t.trip_id DESC
    LIMIT 1
),
registration AS (
    SELECT rr.registration_id, rr.boarding_stop_id, rr.alighting_stop_id
    FROM route_registrations rr
    JOIN khanh ON khanh.student_code = rr.student_code
    JOIN routes r ON r.route_id = rr.route_id
    WHERE r.route_code = 'DN-01'
    ORDER BY rr.registration_id DESC
    LIMIT 1
),
conductor_data AS (
    SELECT conductor_id FROM conductors WHERE employee_code = 'ITER1-CONDUCTOR'
)
INSERT INTO travel_history (student_code, trip_id, registration_id, boarding_stop_id, alighting_stop_id, boarded_at, alighted_at, confirmation_method, confirmed_by_conductor_id)
SELECT khanh.student_code, completed_trip.trip_id, registration.registration_id, registration.boarding_stop_id,
       registration.alighting_stop_id, CURRENT_TIMESTAMP - INTERVAL '55 minutes',
       CURRENT_TIMESTAMP - INTERVAL '8 minutes', 'QR_SCAN', conductor_data.conductor_id
FROM khanh
CROSS JOIN completed_trip
CROSS JOIN registration
CROSS JOIN conductor_data
WHERE NOT EXISTS (
    SELECT 1
    FROM travel_history th
    WHERE th.student_code = khanh.student_code
      AND th.trip_id = completed_trip.trip_id
);

WITH khanh AS (
    SELECT u.user_id
    FROM users u
    WHERE LOWER(u.email) = 'khanhnv20a02@gmail.com'
),
trip_data AS (
    SELECT t.trip_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.route_code = 'DN-01'
    ORDER BY t.trip_id DESC
    LIMIT 1
)
INSERT INTO lost_item_reports (reported_by_user_id, trip_id, item_description, status, notes, reported_at)
SELECT khanh.user_id, trip_data.trip_id, 'Bình nước màu xanh để quên ở ghế sau', 'SEARCHING', 'Đã báo phụ xe kiểm tra sau chuyến.', CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM khanh
CROSS JOIN trip_data
WHERE NOT EXISTS (
    SELECT 1
    FROM lost_item_reports li
    WHERE li.reported_by_user_id = khanh.user_id
      AND li.item_description = 'Bình nước màu xanh để quên ở ghế sau'
);

WITH khanh AS (
    SELECT user_id FROM users WHERE LOWER(email) = 'khanhnv20a02@gmail.com'
)
INSERT INTO support_tickets (submitted_by_user_id, support_type, title, content, status, response, created_at, updated_at)
SELECT khanh.user_id, 'MONTHLY_PASS', 'Cần đổi điểm xuống cho vé tháng', 'Em muốn đổi điểm xuống sang Cầu Rồng trong tuần này.', 'IN_PROGRESS', 'UniBus đang kiểm tra điều kiện đổi tuyến/điểm xuống.', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP
FROM khanh
WHERE NOT EXISTS (
    SELECT 1
    FROM support_tickets st
    WHERE st.submitted_by_user_id = khanh.user_id
      AND st.title = 'Cần đổi điểm xuống cho vé tháng'
);

WITH conductor_data AS (
    SELECT conductor_id FROM conductors WHERE employee_code = 'ITER1-CONDUCTOR'
),
trip_data AS (
    SELECT t.trip_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.route_code = 'DN-01'
    ORDER BY t.trip_id DESC
    LIMIT 1
)
INSERT INTO incidents (conductor_id, trip_id, incident_type, description, status, reported_at)
SELECT conductor_data.conductor_id, trip_data.trip_id, 'OVERCROWDED', 'Xe đông ở đoạn qua Đại học Duy Tân, cần điều phối tăng chuyến giờ cao điểm.', 'NEW', CURRENT_TIMESTAMP - INTERVAL '20 minutes'
FROM conductor_data
CROSS JOIN trip_data
WHERE NOT EXISTS (
    SELECT 1
    FROM incidents i
    WHERE i.conductor_id = conductor_data.conductor_id
      AND i.trip_id = trip_data.trip_id
      AND i.incident_type = 'OVERCROWDED'
);

WITH recipient AS (
    SELECT user_id FROM users WHERE LOWER(email) = 'khanhnv20a02@gmail.com'
),
sender AS (
    SELECT user_id FROM users WHERE email = 'dispatcher.iter1@unibus.local'
),
notification_rows(title, content, notification_type, is_read) AS (
    VALUES
        ('DN-01 đang đến gần', 'Xe 43B-DN01 còn khoảng 8 phút tới điểm đón Đại học Duy Tân.', 'TRIP', FALSE),
        ('Trợ giá Duy Tân đã áp dụng', 'Vé tháng của bạn đã hiển thị giá gốc, trợ giá và giá cuối.', 'PAYMENT', FALSE),
        ('Nhắc lịch về nhà', 'Chuyến City Connector cuối ngày khởi hành lúc 18:10 từ Bến xe Trung tâm.', 'SYSTEM', TRUE)
)
INSERT INTO notifications (recipient_user_id, sender_user_id, title, content, notification_type, is_read, sent_at)
SELECT recipient.user_id, sender.user_id, nr.title, nr.content, nr.notification_type, nr.is_read, CURRENT_TIMESTAMP
FROM notification_rows nr
CROSS JOIN recipient
CROSS JOIN sender
WHERE NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.recipient_user_id = recipient.user_id
      AND n.title = nr.title
);

COMMIT;
