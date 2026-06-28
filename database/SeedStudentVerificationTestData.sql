-- Test data for Student Verification and OAuth flows.
-- Default password for password-based seed accounts: Password123!

BEGIN;

WITH seed_students(student_code) AS (
    VALUES
        ('SV-VER-001'),
        ('SV-PEN-001'),
        ('SV-REJ-001'),
        ('SV-RES-001')
)
DELETE FROM travel_history
WHERE student_code IN (SELECT student_code FROM seed_students);

WITH seed_students(student_code) AS (
    VALUES
        ('SV-VER-001'),
        ('SV-PEN-001'),
        ('SV-REJ-001'),
        ('SV-RES-001')
)
DELETE FROM route_registrations
WHERE student_code IN (SELECT student_code FROM seed_students);

WITH seed_students(student_code) AS (
    VALUES
        ('SV-VER-001'),
        ('SV-PEN-001'),
        ('SV-REJ-001'),
        ('SV-RES-001')
),
seed_payments AS (
    SELECT payment_id
    FROM payments
    WHERE student_code IN (SELECT student_code FROM seed_students)
)
DELETE FROM invoices
WHERE payment_id IN (SELECT payment_id FROM seed_payments);

WITH seed_students(student_code) AS (
    VALUES
        ('SV-VER-001'),
        ('SV-PEN-001'),
        ('SV-REJ-001'),
        ('SV-RES-001')
)
DELETE FROM payments
WHERE student_code IN (SELECT student_code FROM seed_students);

WITH seed_students(student_code) AS (
    VALUES
        ('SV-VER-001'),
        ('SV-PEN-001'),
        ('SV-REJ-001'),
        ('SV-RES-001')
)
DELETE FROM monthly_passes
WHERE student_code IN (SELECT student_code FROM seed_students);

WITH seed_users(email) AS (
    VALUES
        ('admin.verify@unibus.local'),
        ('driver.demo@unibus.local'),
        ('conductor.demo@unibus.local'),
        ('dispatcher.demo@unibus.local'),
        ('student.verified@unibus.local'),
        ('student.pending@unibus.local'),
        ('student.rejected@unibus.local'),
        ('student.resubmit@unibus.local'),
        ('student.google@unibus.local')
)
DELETE FROM student_verifications
WHERE user_id IN (SELECT user_id FROM users WHERE email IN (SELECT email FROM seed_users));

WITH seed_users(email) AS (
    VALUES
        ('admin.verify@unibus.local'),
        ('driver.demo@unibus.local'),
        ('conductor.demo@unibus.local'),
        ('dispatcher.demo@unibus.local'),
        ('student.verified@unibus.local'),
        ('student.pending@unibus.local'),
        ('student.rejected@unibus.local'),
        ('student.resubmit@unibus.local'),
        ('student.google@unibus.local')
)
DELETE FROM user_auth_providers
WHERE user_id IN (SELECT user_id FROM users WHERE email IN (SELECT email FROM seed_users));

WITH seed_users(email) AS (
    VALUES
        ('student.verified@unibus.local'),
        ('student.pending@unibus.local'),
        ('student.rejected@unibus.local'),
        ('student.resubmit@unibus.local'),
        ('student.google@unibus.local')
)
DELETE FROM students
WHERE user_id IN (SELECT user_id FROM users WHERE email IN (SELECT email FROM seed_users));

INSERT INTO users (
    email,
    password_hash,
    full_name,
    role,
    status,
    email_verified_at,
    student_verification_status,
    created_at,
    updated_at
)
VALUES
    ('admin.verify@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Admin Verify', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('driver.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Tài xế Nguyễn Văn A', 'DRIVER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('conductor.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Phụ xe Trần Thị B', 'CONDUCTOR', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dispatcher.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Điều hành viên Lê Văn C', 'DISPATCHER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.verified@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Verified Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.pending@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Pending Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'PENDING_REVIEW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.rejected@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Rejected Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'REJECTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.resubmit@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Resubmission Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'RESUBMISSION_REQUIRED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.google@unibus.local', NULL, 'Google Seed Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    email_verified_at = EXCLUDED.email_verified_at,
    student_verification_status = EXCLUDED.student_verification_status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO students (student_code, user_id, university, faculty, academic_year, date_of_birth)
SELECT 'SV-VER-001', user_id, 'Trường Đại học Bách khoa - Đại học Đà Nẵng', 'Software Engineering', 3, DATE '2004-01-15'
FROM users
WHERE email = 'student.verified@unibus.local'
ON CONFLICT (student_code) DO UPDATE
SET user_id = EXCLUDED.user_id,
    university = EXCLUDED.university,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year,
    date_of_birth = EXCLUDED.date_of_birth;

INSERT INTO student_verifications (
    user_id,
    university,
    student_code,
    card_image_url,
    ocr_full_name,
    ocr_student_code,
    ocr_university,
    ocr_raw_text,
    ocr_confidence_score,
    status,
    rejection_reason,
    reviewer_user_id,
    reviewed_at,
    submitted_at,
    created_at,
    updated_at,
    is_current
)
SELECT
    u.user_id,
    'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    CASE u.email
        WHEN 'student.verified@unibus.local' THEN 'SV-VER-001'
        WHEN 'student.pending@unibus.local' THEN 'SV-PEN-001'
        WHEN 'student.rejected@unibus.local' THEN 'SV-REJ-001'
        WHEN 'student.resubmit@unibus.local' THEN 'SV-RES-001'
    END,
    'seed/student-card-placeholder.png',
    u.full_name,
    CASE u.email
        WHEN 'student.verified@unibus.local' THEN 'SV-VER-001'
        WHEN 'student.pending@unibus.local' THEN 'SV-PEN-001'
        WHEN 'student.rejected@unibus.local' THEN 'SV-REJ-001'
        WHEN 'student.resubmit@unibus.local' THEN 'SV-RES-001'
    END,
    'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    CASE u.email
        WHEN 'student.verified@unibus.local' THEN 'THE SINH VIEN / Verified Student / SV-VER-001 / Truong Dai hoc Bach khoa - Dai hoc Da Nang'
        WHEN 'student.pending@unibus.local' THEN 'THE SINH VIEN / Pending Student / SV-PEN-001 / Truong Dai hoc Bach khoa - Dai hoc Da Nang'
        WHEN 'student.rejected@unibus.local' THEN 'THE SINH VIEN / Rejected Student / SV-REJ-001 / Truong Dai hoc Bach khoa - Dai hoc Da Nang'
        WHEN 'student.resubmit@unibus.local' THEN 'THE SINH VIEN / Resubmission Student / SV-RES-001 / Truong Dai hoc Bach khoa - Dai hoc Da Nang'
    END,
    0.9200,
    u.student_verification_status,
    CASE u.email
        WHEN 'student.rejected@unibus.local' THEN 'Ảnh thẻ không rõ mã sinh viên.'
        WHEN 'student.resubmit@unibus.local' THEN 'Vui lòng gửi lại ảnh thẻ rõ hơn.'
        ELSE NULL
    END,
    admin_user.user_id,
    CASE WHEN u.student_verification_status IN ('VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED') THEN CURRENT_TIMESTAMP ELSE NULL END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    TRUE
FROM users u
CROSS JOIN (
    SELECT user_id
    FROM users
    WHERE email = 'admin.verify@unibus.local'
) admin_user
WHERE u.email IN (
    'student.verified@unibus.local',
    'student.pending@unibus.local',
    'student.rejected@unibus.local',
    'student.resubmit@unibus.local'
);

INSERT INTO user_auth_providers (
    user_id,
    provider,
    provider_user_id,
    provider_email,
    provider_email_verified,
    display_name,
    avatar_url,
    created_at,
    updated_at
)
SELECT
    user_id,
    'GOOGLE',
    'google-seed-student-001',
    email,
    TRUE,
    full_name,
    avatar_url,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users
WHERE email = 'student.google@unibus.local'
ON CONFLICT (provider, provider_user_id) DO UPDATE
SET provider_email = EXCLUDED.provider_email,
    provider_email_verified = EXCLUDED.provider_email_verified,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO drivers (user_id, license_number, years_experience, average_rating, work_status)
SELECT user_id, 'DRIVER-DEMO-LICENSE', 4, 4.80, 'READY'
FROM users
WHERE email = 'driver.demo@unibus.local'
ON CONFLICT (license_number) DO UPDATE
SET user_id = EXCLUDED.user_id,
    years_experience = EXCLUDED.years_experience,
    average_rating = EXCLUDED.average_rating,
    work_status = EXCLUDED.work_status;

INSERT INTO conductors (user_id, employee_code)
SELECT user_id, 'CONDUCTOR-DEMO'
FROM users
WHERE email = 'conductor.demo@unibus.local'
ON CONFLICT (employee_code) DO UPDATE
SET user_id = EXCLUDED.user_id;

INSERT INTO dispatchers (user_id, employee_code, department)
SELECT user_id, 'DISPATCHER-DEMO', 'Operations Control'
FROM users
WHERE email = 'dispatcher.demo@unibus.local'
ON CONFLICT (employee_code) DO UPDATE
SET user_id = EXCLUDED.user_id,
    department = EXCLUDED.department;

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
),
seed_trips AS (
    SELECT trip_id
    FROM trips
    WHERE route_id IN (SELECT route_id FROM seed_routes)
)
DELETE FROM travel_history
WHERE trip_id IN (SELECT trip_id FROM seed_trips);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
),
seed_trips AS (
    SELECT trip_id
    FROM trips
    WHERE route_id IN (SELECT route_id FROM seed_routes)
)
DELETE FROM vehicle_locations
WHERE trip_id IN (SELECT trip_id FROM seed_trips);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
),
seed_registrations AS (
    SELECT registration_id
    FROM route_registrations
    WHERE route_id IN (SELECT route_id FROM seed_routes)
)
DELETE FROM travel_history
WHERE registration_id IN (SELECT registration_id FROM seed_registrations);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
),
seed_passes AS (
    SELECT monthly_pass_id
    FROM monthly_passes
    WHERE route_id IN (SELECT route_id FROM seed_routes)
),
seed_payments AS (
    SELECT payment_id
    FROM payments
    WHERE monthly_pass_id IN (SELECT monthly_pass_id FROM seed_passes)
)
DELETE FROM invoices
WHERE payment_id IN (SELECT payment_id FROM seed_payments);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
),
seed_passes AS (
    SELECT monthly_pass_id
    FROM monthly_passes
    WHERE route_id IN (SELECT route_id FROM seed_routes)
)
DELETE FROM payments
WHERE monthly_pass_id IN (SELECT monthly_pass_id FROM seed_passes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM monthly_passes
WHERE route_id IN (SELECT route_id FROM seed_routes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM single_trip_tickets
WHERE route_id IN (SELECT route_id FROM seed_routes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM daily_statistics
WHERE route_id IN (SELECT route_id FROM seed_routes);

DO $$
BEGIN
    IF to_regclass('public.route_universities') IS NOT NULL THEN
        DELETE FROM route_universities
        WHERE route_id IN (
            SELECT route_id
            FROM routes
            WHERE description LIKE 'Tuyến nội khu (Seed):%'
        );
    END IF;
END $$;

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM route_registrations
WHERE route_id IN (SELECT route_id FROM seed_routes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM trips
WHERE route_id IN (SELECT route_id FROM seed_routes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM bus_schedules
WHERE route_id IN (SELECT route_id FROM seed_routes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM fares
WHERE route_id IN (SELECT route_id FROM seed_routes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
DELETE FROM route_stops
WHERE route_id IN (SELECT route_id FROM seed_routes);

WITH seed_routes AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'ITER1 seed route:%'
)
DELETE FROM fares
WHERE route_id IN (SELECT route_id FROM seed_routes);

DELETE FROM routes
WHERE description LIKE 'Tuyến nội khu (Seed):%';

DELETE FROM stops
WHERE description = 'DEMO seed stop';

INSERT INTO stops (stop_name, address, longitude, latitude, description, status, created_at)
VALUES
    ('Đại học Bách khoa Đà Nẵng', '54 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng', 108.151090, 16.073570, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Ký túc xá phía Tây Đà Nẵng', 'Đường Hà Huy Tập, Hòa Khê, Thanh Khê, Đà Nẵng', 108.184610, 16.065650, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học Sư phạm Đà Nẵng', '459 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng', 108.151850, 16.070950, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học Kinh tế Đà Nẵng', '71 Ngũ Hành Sơn, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng', 108.243120, 16.047010, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Cầu Rồng', 'Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 108.227120, 16.061230, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Bến xe Trung tâm Đà Nẵng', '201 Tôn Đức Thắng, Hòa Minh, Liên Chiểu, Đà Nẵng', 108.173820, 16.074880, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học Duy Tân', '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', 108.214240, 16.060370, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Đại học FPT Đà Nẵng', 'Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng', 108.252360, 15.981410, 'DEMO seed stop', 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO routes (route_name, description, distance_km, estimated_minutes, is_circular, status, created_at)
VALUES
    ('Tuyến số 1 - Campus Loop', 'Tuyến nội khu (Seed): campus loop for route search and registration testing', 18.20, 45, FALSE, 'ACTIVE', CURRENT_TIMESTAMP),
    ('Tuyến số 2 - City Connector', 'Tuyến nội khu (Seed): city connector for long distance registration testing', 24.60, 60, FALSE, 'ACTIVE', CURRENT_TIMESTAMP);

INSERT INTO fares (route_id, fare_type, amount, effective_from, effective_until, notes)
SELECT route_id, fare_type, amount, CURRENT_DATE, NULL, notes
FROM (
    VALUES
        ('ITER1 - Campus Loop', 'MONTHLY', 50000, 'VNPay sandbox monthly fare for campus loop'),
        ('ITER1 - Campus Loop', 'SINGLE', 7000, 'Single trip fare for campus loop'),
        ('ITER1 - City Connector', 'MONTHLY', 65000, 'VNPay sandbox monthly fare for city connector'),
        ('ITER1 - City Connector', 'SINGLE', 10000, 'Single trip fare for city connector')
) AS items(route_name, fare_type, amount, notes)
JOIN routes r ON r.route_name = items.route_name
WHERE r.description LIKE 'ITER1 seed route:%';

WITH route_data AS (
    SELECT route_id, route_name
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
INSERT INTO fares (route_id, fare_type, amount, effective_from, notes)
SELECT route_id, fare_type, amount, CURRENT_DATE - INTERVAL '1 day', 'DEMO seed fare for demo checkout'
FROM route_data r
JOIN (
    VALUES
        ('Tuyến số 1 - Campus Loop', 'MONTHLY', 120000::numeric),
        ('Tuyến số 1 - Campus Loop', 'SINGLE', 7000::numeric),
        ('Tuyến số 2 - City Connector', 'MONTHLY', 150000::numeric),
        ('Tuyến số 2 - City Connector', 'SINGLE', 9000::numeric)
) AS items(route_name, fare_type, amount) ON items.route_name = r.route_name;

WITH route_data AS (
    SELECT route_id, route_name
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
),
stop_data AS (
    SELECT stop_id, stop_name
    FROM stops
    WHERE description = 'DEMO seed stop'
)
INSERT INTO route_stops (route_id, stop_id, stop_order, minutes_from_previous_stop)
SELECT route_id, stop_id, stop_order, minutes_from_previous_stop
FROM (
    VALUES
        ('Tuyến số 1 - Campus Loop', 'Đại học Bách khoa Đà Nẵng', 1, 0),
        ('Tuyến số 1 - Campus Loop', 'Đại học Sư phạm Đà Nẵng', 2, 5),
        ('Tuyến số 1 - Campus Loop', 'Ký túc xá phía Tây Đà Nẵng', 3, 12),
        ('Tuyến số 1 - Campus Loop', 'Bến xe Trung tâm Đà Nẵng', 4, 10),
        ('Tuyến số 1 - Campus Loop', 'Đại học Duy Tân', 5, 18),
        ('Tuyến số 1 - Campus Loop', 'Cầu Rồng', 6, 8),
        ('Tuyến số 2 - City Connector', 'Bến xe Trung tâm Đà Nẵng', 1, 0),
        ('Tuyến số 2 - City Connector', 'Cầu Rồng', 2, 20),
        ('Tuyến số 2 - City Connector', 'Đại học Kinh tế Đà Nẵng', 3, 12),
        ('Tuyến số 2 - City Connector', 'Đại học FPT Đà Nẵng', 4, 25)
) AS items(route_name, stop_name, stop_order, minutes_from_previous_stop)
JOIN route_data r ON r.route_name = items.route_name
JOIN stop_data s ON s.stop_name = items.stop_name;

INSERT INTO buses (license_plate, seat_count, bus_type, manufacture_year, status)
VALUES
    ('43B-DEMO-01', 45, 'Standard', 2022, 'READY'),
    ('43B-DEMO-02', 29, 'Mini Bus', 2021, 'READY')
ON CONFLICT (license_plate) DO UPDATE
SET seat_count = EXCLUDED.seat_count,
    bus_type = EXCLUDED.bus_type,
    manufacture_year = EXCLUDED.manufacture_year,
    status = EXCLUDED.status;

WITH driver_profile AS (
    SELECT driver_id FROM drivers WHERE license_number = 'DRIVER-DEMO-LICENSE'
),
conductor_profile AS (
    SELECT conductor_id FROM conductors WHERE employee_code = 'CONDUCTOR-DEMO'
),
route_data AS (
    SELECT route_id, route_name
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
),
bus_data AS (
    SELECT bus_id, license_plate
    FROM buses
    WHERE license_plate IN ('43B-DEMO-01', '43B-DEMO-02')
)
INSERT INTO bus_schedules (
    route_id,
    bus_id,
    driver_id,
    conductor_id,
    weekday_number,
    departure_time,
    end_time,
    status,
    assigned_by_user_id,
    assigned_at
)
SELECT r.route_id, b.bus_id, d.driver_id, c.conductor_id, items.weekday_number,
       items.departure_time::time, items.end_time::time, 'ACTIVE',
       (SELECT user_id FROM users WHERE email = 'admin.verify@unibus.local'), CURRENT_TIMESTAMP
FROM (
    VALUES
        ('Tuyến số 1 - Campus Loop', '43B-DEMO-01', EXTRACT(ISODOW FROM CURRENT_DATE)::int, '07:00', '07:45'),
        ('Tuyến số 1 - Campus Loop', '43B-DEMO-01', EXTRACT(ISODOW FROM CURRENT_DATE)::int, '17:30', '18:15'),
        ('Tuyến số 2 - City Connector', '43B-DEMO-02', EXTRACT(ISODOW FROM CURRENT_DATE)::int, '06:30', '07:30')
) AS items(route_name, license_plate, weekday_number, departure_time, end_time)
JOIN route_data r ON r.route_name = items.route_name
JOIN bus_data b ON b.license_plate = items.license_plate
CROSS JOIN driver_profile d
CROSS JOIN conductor_profile c;

WITH schedule_data AS (
    SELECT bs.schedule_id, bs.route_id, r.route_name, bs.bus_id, b.license_plate, bs.driver_id, bs.conductor_id
    FROM bus_schedules bs
    JOIN routes r ON r.route_id = bs.route_id
    JOIN buses b ON b.bus_id = bs.bus_id
    WHERE r.description LIKE 'Tuyến nội khu (Seed):%'
      AND bs.weekday_number = EXTRACT(ISODOW FROM CURRENT_DATE)::int
)
INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
SELECT s.schedule_id, s.route_id, s.bus_id, s.driver_id, s.conductor_id, CURRENT_DATE,
       items.departed_at, items.ended_at, items.status, items.notes
FROM (
    VALUES
        ('Tuyến số 1 - Campus Loop', '43B-DEMO-01', CURRENT_TIMESTAMP - INTERVAL '12 minutes', NULL::timestamptz, 'RUNNING', 'DEMO running campus loop trip'),
        ('Tuyến số 2 - City Connector', '43B-DEMO-02', CURRENT_TIMESTAMP - INTERVAL '55 minutes', CURRENT_TIMESTAMP - INTERVAL '5 minutes', 'COMPLETED', 'DEMO completed city connector trip')
) AS items(route_name, license_plate, departed_at, ended_at, status, notes)
JOIN schedule_data s ON s.route_name = items.route_name AND s.license_plate = items.license_plate;

WITH student_data AS (
    SELECT student_code
    FROM students
    WHERE student_code = 'SV-VER-001'
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE route_name = 'Tuyến số 1 - Campus Loop'
      AND description LIKE 'Tuyến nội khu (Seed):%'
),
boarding_stop AS (
    SELECT stop_id FROM stops WHERE stop_name = 'Đại học Bách khoa Đà Nẵng' AND description = 'DEMO seed stop'
),
alighting_stop AS (
    SELECT stop_id FROM stops WHERE stop_name = 'Cầu Rồng' AND description = 'DEMO seed stop'
)
INSERT INTO route_registrations (
    student_code,
    route_id,
    boarding_stop_id,
    alighting_stop_id,
    registered_at,
    effective_date,
    status,
    approved_by_user_id,
    approved_at
)
SELECT s.student_code, r.route_id, b.stop_id, a.stop_id, CURRENT_TIMESTAMP, CURRENT_DATE, 'APPROVED',
       (SELECT user_id FROM users WHERE email = 'admin.verify@unibus.local'), CURRENT_TIMESTAMP
FROM student_data s
CROSS JOIN route_data r
CROSS JOIN boarding_stop b
CROSS JOIN alighting_stop a;

WITH student_data AS (
    SELECT student_code
    FROM students
    WHERE student_code = 'SV-VER-001'
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE route_name = 'Tuyến số 1 - Campus Loop'
      AND description LIKE 'Tuyến nội khu (Seed):%'
),
fare_data AS (
    SELECT amount
    FROM fares
    WHERE route_id = (SELECT route_id FROM route_data)
      AND fare_type = 'MONTHLY'
    ORDER BY effective_from DESC
    LIMIT 1
),
new_pass AS (
    INSERT INTO monthly_passes (
        student_code,
        route_id,
        effective_month,
        effective_year,
        valid_from,
        expires_on,
        fare_amount,
        qr_code,
        status
    )
    SELECT
        s.student_code,
        r.route_id,
        EXTRACT(MONTH FROM CURRENT_DATE)::int,
        EXTRACT(YEAR FROM CURRENT_DATE)::int,
        date_trunc('month', CURRENT_DATE)::date,
        (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date,
        f.amount,
        'UB-DEMO-MONTHLY-SV-VER-001',
        'ACTIVE'
    FROM student_data s
    CROSS JOIN route_data r
    CROSS JOIN fare_data f
    RETURNING monthly_pass_id, student_code, fare_amount
),
new_payment AS (
    INSERT INTO payments (
        student_code,
        monthly_pass_id,
        amount,
        method,
        status,
        transaction_code,
        notes
    )
    SELECT student_code, monthly_pass_id, fare_amount, 'BANK_TRANSFER', 'PAID', 'MVP-DEMO-MONTHLY-SV-VER-001', 'DEMO demo monthly pass payment'
    FROM new_pass
    RETURNING payment_id, student_code, amount
)
INSERT INTO invoices (payment_id, student_code, description, amount)
SELECT payment_id, student_code, 'DEMO demo monthly bus pass invoice', amount
FROM new_payment;

WITH completed_trip AS (
    SELECT t.trip_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.route_name = 'Tuyến số 2 - City Connector'
      AND t.status = 'COMPLETED'
    ORDER BY t.trip_id DESC
    LIMIT 1
),
student_data AS (
    SELECT student_code
    FROM students
    WHERE student_code = 'SV-VER-001'
),
boarding_stop AS (
    SELECT stop_id FROM stops WHERE stop_name = 'Bến xe Trung tâm Đà Nẵng' AND description = 'DEMO seed stop'
),
alighting_stop AS (
    SELECT stop_id FROM stops WHERE stop_name = 'Đại học FPT Đà Nẵng' AND description = 'DEMO seed stop'
)
INSERT INTO travel_history (
    student_code,
    trip_id,
    boarding_stop_id,
    alighting_stop_id,
    boarded_at,
    alighted_at,
    confirmation_method,
    confirmed_by_conductor_id
)
SELECT s.student_code, t.trip_id, b.stop_id, a.stop_id,
       CURRENT_TIMESTAMP - INTERVAL '55 minutes',
       CURRENT_TIMESTAMP - INTERVAL '5 minutes',
       'QR_SCAN',
       (SELECT conductor_id FROM conductors WHERE employee_code = 'CONDUCTOR-DEMO')
FROM student_data s
CROSS JOIN completed_trip t
CROSS JOIN boarding_stop b
CROSS JOIN alighting_stop a;

WITH running_trip AS (
    SELECT t.trip_id, t.bus_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.route_name = 'Tuyến số 1 - Campus Loop'
      AND t.status = 'RUNNING'
    ORDER BY t.trip_id DESC
    LIMIT 1
)
INSERT INTO vehicle_locations (bus_id, trip_id, longitude, latitude, speed_kmh, updated_at)
SELECT bus_id, trip_id, 108.184610, 16.065650, 32.5, CURRENT_TIMESTAMP
FROM running_trip;

COMMIT;
