-- Prepare a brand-new verified student for the complete live demo.
-- Login: student.flow@unibus.local / Password123!
--
-- The account is linked to UniBus Demo University and is VERIFIED, but has:
--   - no route registration
--   - no ticket or monthly pass
--   - no SePay order/payment/invoice
--   - no scan/travel history
--
-- The script also links the university to the route assigned to today's
-- conductor.demo trip and enables a 25% subsidy. This lets the presenter
-- perform the entire flow in the UI and lets conductor.demo scan the new QR.

BEGIN;

INSERT INTO universities (code, name, short_name, contact_email, status)
VALUES (
    'UNIBUS_DEMO_FLOW',
    'UniBus Demo University',
    'UniBus Demo',
    'demo-flow@unibus.local',
    'ACTIVE'
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
INSERT INTO campuses (university_id, code, name, address, latitude, longitude, status)
SELECT
    university_id,
    'DEMO_MAIN',
    'Demo Main Campus',
    'Da Nang, Viet Nam',
    16.054400,
    108.202200,
    'ACTIVE'
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
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
UPDATE university_domains ud
SET university_id = university_data.university_id,
    status = 'ACTIVE',
    verified_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
FROM university_data
WHERE ud.domain = 'demo.unibus.local';

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
SELECT university_id, 'demo.unibus.local', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM university_data
WHERE NOT EXISTS (
    SELECT 1
    FROM university_domains
    WHERE domain = 'demo.unibus.local'
);

INSERT INTO users (
    email,
    password_hash,
    full_name,
    phone_number,
    role,
    status,
    email_verified_at,
    student_verification_status,
    created_at,
    updated_at
)
VALUES (
    'student.flow@unibus.local',
    '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu',
    'Demo Flow Student',
    '0901000099',
    'STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    'VERIFIED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    email_verified_at = EXCLUDED.email_verified_at,
    student_verification_status = EXCLUDED.student_verification_status,
    updated_at = CURRENT_TIMESTAMP;

WITH flow_user AS (
    SELECT user_id
    FROM users
    WHERE email = 'student.flow@unibus.local'
),
university_data AS (
    SELECT university_id, name
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
INSERT INTO students (
    student_code,
    user_id,
    university,
    university_id,
    faculty,
    academic_year
)
SELECT
    'SV-FLOW-001',
    flow_user.user_id,
    university_data.name,
    university_data.university_id,
    'Software Engineering',
    3
FROM flow_user
CROSS JOIN university_data
ON CONFLICT (student_code) DO UPDATE
SET user_id = EXCLUDED.user_id,
    university = EXCLUDED.university,
    university_id = EXCLUDED.university_id,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year;

WITH flow_user AS (
    SELECT user_id, full_name
    FROM users
    WHERE email = 'student.flow@unibus.local'
),
university_data AS (
    SELECT university_id, name
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
),
reviewer AS (
    SELECT user_id
    FROM users
    WHERE role = 'ADMIN'
    ORDER BY CASE WHEN email = 'admin.verify@unibus.local' THEN 0 ELSE 1 END, user_id
    LIMIT 1
)
INSERT INTO student_verifications (
    user_id,
    university_id,
    university,
    student_code,
    ocr_full_name,
    ocr_student_code,
    ocr_university,
    ocr_raw_text,
    ocr_confidence_score,
    status,
    reviewer_user_id,
    reviewed_at,
    submitted_at,
    created_at,
    updated_at,
    is_current
)
SELECT
    flow_user.user_id,
    university_data.university_id,
    university_data.name,
    'SV-FLOW-001',
    flow_user.full_name,
    'SV-FLOW-001',
    university_data.name,
    'DEMO STUDENT CARD / Demo Flow Student / SV-FLOW-001 / UniBus Demo University',
    0.9900,
    'VERIFIED',
    reviewer.user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    TRUE
FROM flow_user
CROSS JOIN university_data
LEFT JOIN reviewer ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM student_verifications sv
    WHERE sv.user_id = flow_user.user_id
      AND sv.is_current = TRUE
);

WITH flow_user AS (
    SELECT user_id, full_name
    FROM users
    WHERE email = 'student.flow@unibus.local'
),
university_data AS (
    SELECT university_id, name
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
UPDATE student_verifications sv
SET university_id = university_data.university_id,
    university = university_data.name,
    student_code = 'SV-FLOW-001',
    ocr_full_name = flow_user.full_name,
    ocr_student_code = 'SV-FLOW-001',
    ocr_university = university_data.name,
    ocr_raw_text = 'DEMO STUDENT CARD / Demo Flow Student / SV-FLOW-001 / UniBus Demo University',
    ocr_confidence_score = 0.9900,
    status = 'VERIFIED',
    rejection_reason = NULL,
    reviewed_at = COALESCE(sv.reviewed_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
FROM flow_user
CROSS JOIN university_data
WHERE sv.user_id = flow_user.user_id
  AND sv.is_current = TRUE;

WITH flow_user AS (
    SELECT user_id, full_name, email
    FROM users
    WHERE email = 'student.flow@unibus.local'
),
university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
INSERT INTO university_student_rosters (
    university_id,
    email,
    student_code,
    full_name,
    faculty,
    academic_year,
    status,
    matched_user_id,
    created_at,
    updated_at
)
SELECT
    university_data.university_id,
    flow_user.email,
    'SV-FLOW-001',
    flow_user.full_name,
    'Software Engineering',
    3,
    'ACTIVE',
    flow_user.user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM flow_user
CROSS JOIN university_data
ON CONFLICT (university_id, email) DO UPDATE
SET student_code = EXCLUDED.student_code,
    full_name = EXCLUDED.full_name,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year,
    status = EXCLUDED.status,
    matched_user_id = EXCLUDED.matched_user_id,
    updated_at = CURRENT_TIMESTAMP;

-- Make today's conductor.demo route available to the demo university.
WITH demo_route AS (
    SELECT t.route_id
    FROM trips t
    JOIN conductors c ON c.conductor_id = t.conductor_id
    JOIN users u ON u.user_id = c.user_id
    WHERE t.service_date = CURRENT_DATE
      AND u.email = 'conductor.demo@unibus.local'
    ORDER BY CASE t.status WHEN 'RUNNING' THEN 0 WHEN 'NOT_STARTED' THEN 1 ELSE 2 END, t.trip_id
    LIMIT 1
),
university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
INSERT INTO route_universities (route_id, university_id, active_from, status, created_at, updated_at)
SELECT
    demo_route.route_id,
    university_data.university_id,
    CURRENT_DATE - 1,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM demo_route
CROSS JOIN university_data
WHERE NOT EXISTS (
    SELECT 1
    FROM route_universities ru
    WHERE ru.route_id = demo_route.route_id
      AND ru.university_id = university_data.university_id
      AND ru.status = 'ACTIVE'
);

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
INSERT INTO subsidy_policies (
    university_id,
    policy_name,
    subsidy_type,
    "value",
    max_amount,
    active_from,
    status,
    created_at,
    updated_at
)
SELECT
    university_id,
    'Complete demo flow subsidy 25%',
    'PERCENTAGE',
    25,
    50000,
    CURRENT_DATE - 1,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM university_data
WHERE NOT EXISTS (
    SELECT 1
    FROM subsidy_policies sp
    WHERE sp.university_id = university_data.university_id
      AND sp.policy_name = 'Complete demo flow subsidy 25%'
      AND sp.status = 'ACTIVE'
);

-- Return only this student to the brand-new transactional state.
DELETE FROM invoices
WHERE payment_id IN (
    SELECT payment_id
    FROM payments
    WHERE student_code = 'SV-FLOW-001'
);

DELETE FROM payments
WHERE student_code = 'SV-FLOW-001';

DELETE FROM travel_history
WHERE student_code = 'SV-FLOW-001';

DELETE FROM monthly_passes
WHERE student_code = 'SV-FLOW-001';

DELETE FROM single_trip_tickets
WHERE student_code = 'SV-FLOW-001';

DELETE FROM tb_transactions
WHERE matched_order_id IN (
    SELECT id
    FROM tb_orders
    WHERE student_code = 'SV-FLOW-001'
);

DELETE FROM tb_orders
WHERE student_code = 'SV-FLOW-001';

DELETE FROM route_registrations
WHERE student_code = 'SV-FLOW-001';

DELETE FROM notifications
WHERE recipient_user_id = (
    SELECT user_id
    FROM users
    WHERE email = 'student.flow@unibus.local'
);

COMMIT;
