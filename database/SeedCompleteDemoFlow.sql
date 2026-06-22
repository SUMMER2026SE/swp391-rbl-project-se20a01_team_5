-- Complete end-to-end demo account.
-- Login: student.flow@unibus.local / Password123!
--
-- This seed is additive and idempotent. It only resets transactional data for
-- SV-FLOW-001, then recreates an approved registration, paid monthly pass,
-- invoice, SePay order, and scannable QR code.

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
VALUES (
    'uni.admin@unibus.local',
    '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu',
    'University Demo Admin',
    'UNIVERSITY_ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    'NOT_SUBMITTED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    email_verified_at = EXCLUDED.email_verified_at,
    updated_at = CURRENT_TIMESTAMP;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
),
university_admin_user AS (
    SELECT user_id
    FROM users
    WHERE email = 'uni.admin@unibus.local'
),
assigned_by AS (
    SELECT user_id
    FROM users
    WHERE role = 'ADMIN'
    ORDER BY CASE WHEN email = 'admin.verify@unibus.local' THEN 0 ELSE 1 END, user_id
    LIMIT 1
)
INSERT INTO university_admins (
    university_id,
    user_id,
    title,
    status,
    assigned_at,
    assigned_by_user_id,
    updated_at
)
SELECT
    university_data.university_id,
    university_admin_user.user_id,
    'Demo Student Affairs',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    assigned_by.user_id,
    CURRENT_TIMESTAMP
FROM university_data
CROSS JOIN university_admin_user
LEFT JOIN assigned_by ON TRUE
ON CONFLICT (user_id) DO UPDATE
SET university_id = EXCLUDED.university_id,
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    assigned_by_user_id = EXCLUDED.assigned_by_user_id,
    updated_at = CURRENT_TIMESTAMP;

-- Prefer the route assigned to today's demo conductor so the generated QR can
-- be scanned immediately. Fall back to any active route with two stops and a
-- monthly fare.
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
fallback_route AS (
    SELECT r.route_id
    FROM routes r
    WHERE r.status = 'ACTIVE'
      AND EXISTS (
          SELECT 1
          FROM fares f
          WHERE f.route_id = r.route_id
            AND f.fare_type = 'MONTHLY'
            AND f.effective_from <= CURRENT_DATE
            AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
      )
      AND (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.route_id) >= 2
    ORDER BY r.route_id
    LIMIT 1
),
selected_route AS (
    SELECT route_id FROM demo_route
    UNION ALL
    SELECT route_id FROM fallback_route
    WHERE NOT EXISTS (SELECT 1 FROM demo_route)
    LIMIT 1
),
university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
)
INSERT INTO route_universities (route_id, university_id, active_from, status, created_at, updated_at)
SELECT
    selected_route.route_id,
    university_data.university_id,
    CURRENT_DATE - 1,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM selected_route
CROSS JOIN university_data
WHERE NOT EXISTS (
    SELECT 1
    FROM route_universities ru
    WHERE ru.route_id = selected_route.route_id
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

-- Reset only transactional records owned by the dedicated demo student.
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
fallback_route AS (
    SELECT r.route_id
    FROM routes r
    WHERE r.status = 'ACTIVE'
      AND EXISTS (
          SELECT 1
          FROM fares f
          WHERE f.route_id = r.route_id
            AND f.fare_type = 'MONTHLY'
            AND f.effective_from <= CURRENT_DATE
            AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
      )
      AND (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.route_id) >= 2
    ORDER BY r.route_id
    LIMIT 1
),
selected_route AS (
    SELECT route_id FROM demo_route
    UNION ALL
    SELECT route_id FROM fallback_route
    WHERE NOT EXISTS (SELECT 1 FROM demo_route)
    LIMIT 1
),
boarding_stop AS (
    SELECT rs.stop_id
    FROM route_stops rs
    JOIN selected_route r ON r.route_id = rs.route_id
    ORDER BY rs.stop_order
    LIMIT 1
),
alighting_stop AS (
    SELECT rs.stop_id
    FROM route_stops rs
    JOIN selected_route r ON r.route_id = rs.route_id
    ORDER BY rs.stop_order DESC
    LIMIT 1
)
INSERT INTO route_registrations (
    student_code,
    route_id,
    boarding_stop_id,
    alighting_stop_id,
    registered_at,
    effective_date,
    status,
    approved_at
)
SELECT
    'SV-FLOW-001',
    selected_route.route_id,
    boarding_stop.stop_id,
    alighting_stop.stop_id,
    CURRENT_TIMESTAMP,
    CURRENT_DATE,
    'APPROVED',
    CURRENT_TIMESTAMP
FROM selected_route
CROSS JOIN boarding_stop
CROSS JOIN alighting_stop;

WITH registration_data AS (
    SELECT route_id
    FROM route_registrations
    WHERE student_code = 'SV-FLOW-001'
      AND status = 'APPROVED'
    ORDER BY registered_at DESC
    LIMIT 1
),
fare_data AS (
    SELECT f.amount
    FROM fares f
    JOIN registration_data r ON r.route_id = f.route_id
    WHERE f.fare_type = 'MONTHLY'
      AND f.effective_from <= CURRENT_DATE
      AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
    ORDER BY f.effective_from DESC
    LIMIT 1
),
university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'UNIBUS_DEMO_FLOW'
),
policy_data AS (
    SELECT subsidy_policy_id, "value", max_amount
    FROM subsidy_policies sp
    JOIN university_data u ON u.university_id = sp.university_id
    WHERE sp.policy_name = 'Complete demo flow subsidy 25%'
      AND sp.status = 'ACTIVE'
    ORDER BY sp.subsidy_policy_id DESC
    LIMIT 1
),
amounts AS (
    SELECT
        fare_data.amount AS original_amount,
        LEAST(
            ROUND(fare_data.amount * policy_data."value" / 100),
            COALESCE(policy_data.max_amount, fare_data.amount)
        ) AS subsidy_amount,
        policy_data.subsidy_policy_id
    FROM fare_data
    CROSS JOIN policy_data
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
        original_fare_amount,
        subsidy_amount,
        final_fare_amount,
        subsidy_policy_id,
        qr_code,
        status
    )
    SELECT
        'SV-FLOW-001',
        registration_data.route_id,
        EXTRACT(MONTH FROM CURRENT_DATE)::int,
        EXTRACT(YEAR FROM CURRENT_DATE)::int,
        date_trunc('month', CURRENT_DATE)::date,
        (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date,
        amounts.original_amount - amounts.subsidy_amount,
        amounts.original_amount,
        amounts.subsidy_amount,
        amounts.original_amount - amounts.subsidy_amount,
        amounts.subsidy_policy_id,
        'UB-DEMO-FLOW-001',
        'ACTIVE'
    FROM registration_data
    CROSS JOIN amounts
    RETURNING monthly_pass_id, route_id, original_fare_amount, subsidy_amount, final_fare_amount
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
    SELECT
        'SV-FLOW-001',
        monthly_pass_id,
        final_fare_amount,
        'BANK_TRANSFER',
        'PAID',
        'DEMO-FLOW-PAID-001',
        'Complete demo flow payment'
    FROM new_pass
    RETURNING payment_id, monthly_pass_id, amount
)
INSERT INTO invoices (
    payment_id,
    student_code,
    description,
    amount,
    original_amount,
    subsidy_amount,
    final_amount
)
SELECT
    new_payment.payment_id,
    'SV-FLOW-001',
    'Complete demo flow monthly pass',
    new_payment.amount,
    new_pass.original_fare_amount,
    new_pass.subsidy_amount,
    new_pass.final_fare_amount
FROM new_payment
JOIN new_pass ON new_pass.monthly_pass_id = new_payment.monthly_pass_id;

WITH pass_data AS (
    SELECT route_id, final_fare_amount
    FROM monthly_passes
    WHERE student_code = 'SV-FLOW-001'
      AND qr_code = 'UB-DEMO-FLOW-001'
    ORDER BY monthly_pass_id DESC
    LIMIT 1
)
INSERT INTO tb_orders (
    student_code,
    ticket_type,
    route_id,
    total,
    payment_status,
    name,
    paid_at,
    created_at,
    updated_at
)
SELECT
    'SV-FLOW-001',
    'monthly',
    pass_data.route_id,
    pass_data.final_fare_amount,
    'Paid',
    'Complete demo flow monthly pass',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM pass_data;

WITH order_data AS (
    SELECT id, total
    FROM tb_orders
    WHERE student_code = 'SV-FLOW-001'
    ORDER BY id DESC
    LIMIT 1
)
INSERT INTO tb_transactions (
    sepay_transaction_id,
    gateway,
    transaction_date,
    account_number,
    amount_in,
    amount_out,
    accumulated,
    transaction_content,
    reference_number,
    body,
    matched_order_id,
    created_at
)
SELECT
    990000001,
    'MBBank',
    CURRENT_TIMESTAMP,
    '20119999988888',
    order_data.total,
    0,
    order_data.total,
    'DH' || order_data.id,
    'DEMO-FLOW-PAID-001',
    'Complete demo flow seeded transaction',
    order_data.id,
    CURRENT_TIMESTAMP
FROM order_data
ON CONFLICT (sepay_transaction_id) DO UPDATE
SET amount_in = EXCLUDED.amount_in,
    transaction_content = EXCLUDED.transaction_content,
    reference_number = EXCLUDED.reference_number,
    body = EXCLUDED.body,
    matched_order_id = EXCLUDED.matched_order_id;

WITH sender AS (
    SELECT user_id
    FROM users
    WHERE role = 'ADMIN'
    ORDER BY CASE WHEN email = 'admin.verify@unibus.local' THEN 0 ELSE 1 END, user_id
    LIMIT 1
),
recipient AS (
    SELECT user_id
    FROM users
    WHERE email = 'student.flow@unibus.local'
)
INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    title,
    content,
    notification_type,
    is_read,
    sent_at
)
SELECT
    recipient.user_id,
    sender.user_id,
    'Complete demo flow ready',
    'Your route registration, paid monthly pass, invoice, and QR are ready for the demo.',
    'PAYMENT',
    FALSE,
    CURRENT_TIMESTAMP
FROM sender
CROSS JOIN recipient
WHERE NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.recipient_user_id = recipient.user_id
      AND n.title = 'Complete demo flow ready'
);

COMMIT;
