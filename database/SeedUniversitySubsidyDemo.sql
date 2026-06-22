-- Demo data for the university subsidy Core MVP.
-- Run after Flyway V8 and the existing SeedStudentVerificationTestData.sql.
-- This script is intentionally separate from production migrations.

BEGIN;

INSERT INTO universities (code, name, short_name, contact_email, status)
VALUES (
    'DHBK_DHDN',
    'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    'ĐH Bách khoa Đà Nẵng',
    'demo-dhbk@unibus.local',
    'ACTIVE'
)
ON CONFLICT (name) DO UPDATE
SET code = EXCLUDED.code,
    short_name = EXCLUDED.short_name,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE name = 'Trường Đại học Bách khoa - Đại học Đà Nẵng'
)
INSERT INTO campuses (university_id, code, name, address, latitude, longitude, status)
SELECT university_id, 'DHBK_MAIN', 'Cơ sở Hòa Khánh', '54 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng', 16.073570, 108.151090, 'ACTIVE'
FROM university_data
ON CONFLICT (university_id, code) DO UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE name = 'Trường Đại học Bách khoa - Đại học Đà Nẵng'
)
UPDATE students s
SET university_id = u.university_id
FROM university_data u
WHERE s.student_code = 'SV-VER-001';

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE name = 'Trường Đại học Bách khoa - Đại học Đà Nẵng'
)
UPDATE student_verifications sv
SET university_id = u.university_id
FROM university_data u
WHERE sv.student_code = 'SV-VER-001';

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE name = 'Trường Đại học Bách khoa - Đại học Đà Nẵng'
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE route_name = 'Tuyến số 1 - Campus Loop'
      AND description LIKE 'Tuyến nội khu (Seed):%'
)
INSERT INTO route_universities (route_id, university_id, active_from, active_until, status)
SELECT r.route_id, u.university_id, CURRENT_DATE - INTERVAL '1 day', NULL, 'ACTIVE'
FROM route_data r
CROSS JOIN university_data u
WHERE NOT EXISTS (
    SELECT 1
    FROM route_universities ru
    WHERE ru.route_id = r.route_id
      AND ru.university_id = u.university_id
      AND ru.campus_id IS NULL
      AND ru.status = 'ACTIVE'
)
ON CONFLICT DO NOTHING;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE name = 'Trường Đại học Bách khoa - Đại học Đà Nẵng'
)
INSERT INTO subsidy_policies (
    university_id,
    policy_name,
    subsidy_type,
    "value",
    max_amount,
    active_from,
    active_until,
    status
)
SELECT university_id, 'Demo trợ giá vé tháng 50%', 'PERCENTAGE', 50, 60000, CURRENT_DATE - INTERVAL '1 day', NULL, 'ACTIVE'
FROM university_data
WHERE NOT EXISTS (
    SELECT 1
    FROM subsidy_policies sp
    WHERE sp.university_id = university_data.university_id
      AND sp.policy_name = 'Demo trợ giá vé tháng 50%'
      AND sp.status = 'ACTIVE'
);

-- Reset the demo student's route/pass state so the manual subsidy checkout can be repeated.
WITH demo_student AS (
    SELECT 'SV-VER-001'::varchar AS student_code
),
demo_payments AS (
    SELECT payment_id
    FROM payments
    WHERE student_code IN (SELECT student_code FROM demo_student)
)
DELETE FROM invoices
WHERE payment_id IN (SELECT payment_id FROM demo_payments);

DELETE FROM payments
WHERE student_code = 'SV-VER-001';

DELETE FROM monthly_passes
WHERE student_code = 'SV-VER-001';

DELETE FROM route_registrations
WHERE student_code = 'SV-VER-001';

COMMIT;
