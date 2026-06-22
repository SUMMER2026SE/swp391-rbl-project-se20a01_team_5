-- QA data for student account khanhnv20a02@gmail.com.
-- Run after Flyway V10 and the base route/university seed data.
-- This script keeps the existing login method/password state and only adds UI-test data.

BEGIN;

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
    'khanhnv20a02@gmail.com',
    NULL,
    'Khanh Trung',
    'STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    'VERIFIED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    role = 'STUDENT',
    status = 'ACTIVE',
    email_verified_at = COALESCE(users.email_verified_at, EXCLUDED.email_verified_at),
    student_verification_status = 'VERIFIED',
    updated_at = CURRENT_TIMESTAMP;

WITH target_user AS (
    SELECT user_id, full_name
    FROM users
    WHERE LOWER(email) = LOWER('khanhnv20a02@gmail.com')
),
target_university AS (
    SELECT COALESCE(
        (SELECT s.university_id FROM students s JOIN target_user tu ON tu.user_id = s.user_id LIMIT 1),
        (SELECT university_id FROM universities WHERE name ILIKE '%Duy%' OR short_name ILIKE '%Duy%' ORDER BY university_id LIMIT 1),
        (SELECT university_id FROM universities ORDER BY university_id LIMIT 1)
    ) AS university_id
),
university_data AS (
    SELECT u.university_id, u.name
    FROM universities u
    JOIN target_university tu ON tu.university_id = u.university_id
)
INSERT INTO students (student_code, user_id, university, university_id, faculty, academic_year, date_of_birth)
SELECT
    'DTU202032312',
    tu.user_id,
    ud.name,
    ud.university_id,
    'Software Engineering',
    3,
    DATE '2004-02-20'
FROM target_user tu
CROSS JOIN university_data ud
ON CONFLICT (student_code) DO UPDATE
SET user_id = EXCLUDED.user_id,
    university = EXCLUDED.university,
    university_id = EXCLUDED.university_id,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year,
    date_of_birth = COALESCE(students.date_of_birth, EXCLUDED.date_of_birth);

WITH target_user AS (
    SELECT user_id, full_name
    FROM users
    WHERE LOWER(email) = LOWER('khanhnv20a02@gmail.com')
),
student_data AS (
    SELECT s.student_code, s.university, s.university_id
    FROM students s
    JOIN target_user tu ON tu.user_id = s.user_id
),
reviewer AS (
    SELECT user_id
    FROM (
        SELECT user_id, 1 AS priority FROM users WHERE email = 'admin.verify@unibus.local'
        UNION ALL
        SELECT user_id, 2 AS priority FROM users WHERE role = 'ADMIN'
        UNION ALL
        SELECT user_id, 3 AS priority FROM target_user
    ) actor
    ORDER BY priority
    LIMIT 1
)
UPDATE student_verifications sv
SET university = sd.university,
    university_id = sd.university_id,
    student_code = sd.student_code,
    status = 'VERIFIED',
    reviewer_user_id = reviewer.user_id,
    reviewed_at = COALESCE(sv.reviewed_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP,
    is_current = TRUE
FROM target_user tu
CROSS JOIN student_data sd
CROSS JOIN reviewer
WHERE sv.user_id = tu.user_id
  AND sv.is_current = TRUE;

WITH target_user AS (
    SELECT user_id, full_name
    FROM users
    WHERE LOWER(email) = LOWER('khanhnv20a02@gmail.com')
),
student_data AS (
    SELECT s.student_code, s.university, s.university_id
    FROM students s
    JOIN target_user tu ON tu.user_id = s.user_id
),
reviewer AS (
    SELECT user_id
    FROM (
        SELECT user_id, 1 AS priority FROM users WHERE email = 'admin.verify@unibus.local'
        UNION ALL
        SELECT user_id, 2 AS priority FROM users WHERE role = 'ADMIN'
        UNION ALL
        SELECT user_id, 3 AS priority FROM target_user
    ) actor
    ORDER BY priority
    LIMIT 1
)
INSERT INTO student_verifications (
    user_id,
    university,
    university_id,
    student_code,
    card_image_url,
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
    tu.user_id,
    sd.university,
    sd.university_id,
    sd.student_code,
    'seed/khanh-student-card-placeholder.png',
    tu.full_name,
    sd.student_code,
    sd.university,
    'QA seed verification for khanhnv20a02@gmail.com',
    0.9800,
    'VERIFIED',
    reviewer.user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    TRUE
FROM target_user tu
CROSS JOIN student_data sd
CROSS JOIN reviewer
WHERE NOT EXISTS (
    SELECT 1
    FROM student_verifications sv
    WHERE sv.user_id = tu.user_id
      AND sv.is_current = TRUE
);

WITH student_data AS (
    SELECT s.student_code, s.university_id, u.email, u.full_name
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE LOWER(u.email) = LOWER('khanhnv20a02@gmail.com')
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
    sd.university_id,
    LOWER(sd.email),
    sd.student_code,
    sd.full_name,
    'Software Engineering',
    3,
    'ACTIVE',
    (SELECT user_id FROM users WHERE LOWER(email) = LOWER('khanhnv20a02@gmail.com')),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM student_data sd
WHERE sd.university_id IS NOT NULL
ON CONFLICT (university_id, email) DO UPDATE
SET student_code = EXCLUDED.student_code,
    full_name = EXCLUDED.full_name,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year,
    status = 'ACTIVE',
    matched_user_id = EXCLUDED.matched_user_id,
    updated_at = CURRENT_TIMESTAMP;

WITH student_data AS (
    SELECT s.student_code, s.university_id
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE LOWER(u.email) = LOWER('khanhnv20a02@gmail.com')
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'Tuyến nội khu (Seed):%'
)
INSERT INTO route_universities (route_id, university_id, active_from, active_until, status)
SELECT r.route_id, sd.university_id, CURRENT_DATE - INTERVAL '1 day', NULL, 'ACTIVE'
FROM route_data r
CROSS JOIN student_data sd
WHERE sd.university_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM route_universities ru
      WHERE ru.route_id = r.route_id
        AND ru.university_id = sd.university_id
        AND ru.status = 'ACTIVE'
  );

WITH student_data AS (
    SELECT s.student_code, s.university_id
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE LOWER(u.email) = LOWER('khanhnv20a02@gmail.com')
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
SELECT
    sd.university_id,
    'UI QA Khanh student subsidy 25%',
    'PERCENTAGE',
    25,
    40000,
    CURRENT_DATE - INTERVAL '1 day',
    NULL,
    'ACTIVE'
FROM student_data sd
WHERE sd.university_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM subsidy_policies sp
      WHERE sp.university_id = sd.university_id
        AND sp.policy_name = 'UI QA Khanh student subsidy 25%'
  );

WITH student_data AS (
    SELECT s.student_code
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE LOWER(u.email) = LOWER('khanhnv20a02@gmail.com')
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE route_name = 'Tuyến số 1 - Campus Loop'
      AND description LIKE 'Tuyến nội khu (Seed):%'
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
    SELECT user_id
    FROM (
        SELECT user_id, 1 AS priority FROM users WHERE email = 'admin.verify@unibus.local'
        UNION ALL
        SELECT user_id, 2 AS priority FROM users WHERE role = 'ADMIN'
    ) actor
    ORDER BY priority
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
    approved_by_user_id,
    approved_at
)
SELECT
    sd.student_code,
    r.route_id,
    b.stop_id,
    a.stop_id,
    CURRENT_TIMESTAMP,
    CURRENT_DATE,
    'APPROVED',
    approver.user_id,
    CURRENT_TIMESTAMP
FROM student_data sd
CROSS JOIN route_data r
CROSS JOIN boarding_stop b
CROSS JOIN alighting_stop a
CROSS JOIN approver
WHERE NOT EXISTS (
    SELECT 1
    FROM route_registrations rr
    WHERE rr.student_code = sd.student_code
      AND rr.status = 'APPROVED'
);

WITH student_data AS (
    SELECT s.student_code, s.university_id
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE LOWER(u.email) = LOWER('khanhnv20a02@gmail.com')
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE route_name = 'Tuyến số 1 - Campus Loop'
      AND description LIKE 'Tuyến nội khu (Seed):%'
),
fare_data AS (
    SELECT f.amount
    FROM fares f
    JOIN route_data r ON r.route_id = f.route_id
    WHERE f.fare_type = 'MONTHLY'
      AND f.effective_from <= CURRENT_DATE
      AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
    ORDER BY f.effective_from DESC
    LIMIT 1
),
policy_data AS (
    SELECT sp.subsidy_policy_id, sp.subsidy_type, sp."value", sp.max_amount
    FROM subsidy_policies sp
    JOIN student_data sd ON sd.university_id = sp.university_id
    WHERE sp.status = 'ACTIVE'
      AND sp.active_from <= CURRENT_DATE
      AND (sp.active_until IS NULL OR sp.active_until >= CURRENT_DATE)
    ORDER BY CASE WHEN sp.policy_name = 'UI QA Khanh student subsidy 25%' THEN 0 ELSE 1 END,
             sp.active_from DESC,
             sp.subsidy_policy_id DESC
    LIMIT 1
),
amounts AS (
    SELECT
        f.amount AS original_amount,
        COALESCE(
            CASE
                WHEN p.subsidy_type = 'PERCENTAGE' THEN LEAST(ROUND(f.amount * p."value" / 100), COALESCE(p.max_amount, ROUND(f.amount * p."value" / 100)))
                WHEN p.subsidy_type = 'FIXED_AMOUNT' THEN LEAST(p."value", f.amount)
                ELSE 0
            END,
            0
        ) AS subsidy_amount,
        p.subsidy_policy_id
    FROM fare_data f
    LEFT JOIN policy_data p ON TRUE
),
inserted_pass AS (
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
        sd.student_code,
        r.route_id,
        EXTRACT(MONTH FROM CURRENT_DATE)::int,
        EXTRACT(YEAR FROM CURRENT_DATE)::int,
        date_trunc('month', CURRENT_DATE)::date,
        (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date,
        a.original_amount - a.subsidy_amount,
        a.original_amount,
        a.subsidy_amount,
        a.original_amount - a.subsidy_amount,
        a.subsidy_policy_id,
        CONCAT('UB-QA-KHANH-', sd.student_code, '-', TO_CHAR(CURRENT_DATE, 'YYYYMM')),
        'ACTIVE'
    FROM student_data sd
    CROSS JOIN route_data r
    CROSS JOIN amounts a
    WHERE NOT EXISTS (
        SELECT 1
        FROM monthly_passes mp
        WHERE mp.student_code = sd.student_code
          AND mp.route_id = r.route_id
          AND mp.effective_month = EXTRACT(MONTH FROM CURRENT_DATE)::int
          AND mp.effective_year = EXTRACT(YEAR FROM CURRENT_DATE)::int
          AND mp.status = 'ACTIVE'
    )
    RETURNING monthly_pass_id, student_code, final_fare_amount
),
pass_data AS (
    SELECT monthly_pass_id, student_code, final_fare_amount
    FROM inserted_pass
    UNION ALL
    SELECT mp.monthly_pass_id, mp.student_code, COALESCE(mp.final_fare_amount, mp.fare_amount)
    FROM monthly_passes mp
    JOIN student_data sd ON sd.student_code = mp.student_code
    JOIN route_data r ON r.route_id = mp.route_id
    WHERE mp.effective_month = EXTRACT(MONTH FROM CURRENT_DATE)::int
      AND mp.effective_year = EXTRACT(YEAR FROM CURRENT_DATE)::int
      AND mp.status = 'ACTIVE'
    ORDER BY monthly_pass_id DESC
    LIMIT 1
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
        pd.student_code,
        pd.monthly_pass_id,
        pd.final_fare_amount,
        'BANK_TRANSFER',
        'PAID',
        CONCAT('UI-QA-KHANH-MONTHLY-', TO_CHAR(CURRENT_DATE, 'YYYYMM')),
        'UI QA monthly pass payment for khanhnv20a02@gmail.com'
    FROM pass_data pd
    WHERE NOT EXISTS (
        SELECT 1
        FROM payments p
        WHERE p.monthly_pass_id = pd.monthly_pass_id
          AND p.transaction_code = CONCAT('UI-QA-KHANH-MONTHLY-', TO_CHAR(CURRENT_DATE, 'YYYYMM'))
    )
    RETURNING payment_id, student_code, amount, monthly_pass_id
)
INSERT INTO invoices (payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount)
SELECT
    np.payment_id,
    np.student_code,
    'UI QA invoice for Khanh monthly pass',
    np.amount,
    mp.original_fare_amount,
    mp.subsidy_amount,
    mp.final_fare_amount
FROM new_payment np
JOIN monthly_passes mp ON mp.monthly_pass_id = np.monthly_pass_id;

INSERT INTO invoices (payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount)
SELECT
    p.payment_id,
    p.student_code,
    'UI QA invoice for Khanh monthly pass',
    p.amount,
    mp.original_fare_amount,
    mp.subsidy_amount,
    mp.final_fare_amount
FROM payments p
JOIN monthly_passes mp ON mp.monthly_pass_id = p.monthly_pass_id
WHERE p.student_code = 'DTU202032312'
  AND p.transaction_code = CONCAT('UI-QA-KHANH-MONTHLY-', TO_CHAR(CURRENT_DATE, 'YYYYMM'))
  AND NOT EXISTS (
      SELECT 1
      FROM invoices i
      WHERE i.payment_id = p.payment_id
  );

WITH student_data AS (
    SELECT s.student_code
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE LOWER(u.email) = LOWER('khanhnv20a02@gmail.com')
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE route_name = 'Tuyến số 1 - Campus Loop'
      AND description LIKE 'Tuyến nội khu (Seed):%'
),
completed_trip AS (
    SELECT t.trip_id
    FROM trips t
    JOIN route_data r ON r.route_id = t.route_id
    WHERE t.status = 'COMPLETED'
    ORDER BY t.service_date DESC, t.trip_id DESC
    LIMIT 1
),
boarding_stop AS (
    SELECT rs.stop_id FROM route_stops rs JOIN route_data r ON r.route_id = rs.route_id WHERE rs.stop_order = 5
),
alighting_stop AS (
    SELECT rs.stop_id FROM route_stops rs JOIN route_data r ON r.route_id = rs.route_id WHERE rs.stop_order = 6
),
registration AS (
    SELECT rr.registration_id
    FROM route_registrations rr
    JOIN student_data sd ON sd.student_code = rr.student_code
    JOIN route_data r ON r.route_id = rr.route_id
    WHERE rr.status = 'APPROVED'
    ORDER BY rr.registration_id DESC
    LIMIT 1
),
conductor_data AS (
    SELECT conductor_id
    FROM conductors
    ORDER BY conductor_id
    LIMIT 1
)
INSERT INTO travel_history (
    student_code,
    trip_id,
    registration_id,
    boarding_stop_id,
    alighting_stop_id,
    boarded_at,
    alighted_at,
    confirmation_method,
    confirmed_by_conductor_id
)
SELECT
    sd.student_code,
    t.trip_id,
    registration.registration_id,
    b.stop_id,
    a.stop_id,
    CURRENT_TIMESTAMP - INTERVAL '55 minutes',
    CURRENT_TIMESTAMP - INTERVAL '8 minutes',
    'QR_SCAN',
    conductor_data.conductor_id
FROM student_data sd
CROSS JOIN completed_trip t
CROSS JOIN boarding_stop b
CROSS JOIN alighting_stop a
CROSS JOIN registration
LEFT JOIN conductor_data ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM travel_history th
    WHERE th.student_code = sd.student_code
      AND th.trip_id = t.trip_id
      AND th.confirmation_method = 'QR_SCAN'
);

WITH recipient AS (
    SELECT user_id
    FROM users
    WHERE LOWER(email) = LOWER('khanhnv20a02@gmail.com')
),
sender AS (
    SELECT user_id
    FROM (
        SELECT user_id, 1 AS priority FROM users WHERE email = 'admin.verify@unibus.local'
        UNION ALL
        SELECT user_id, 2 AS priority FROM users WHERE role = 'ADMIN'
        UNION ALL
        SELECT user_id, 3 AS priority FROM recipient
    ) actor
    ORDER BY priority
    LIMIT 1
),
notification_rows(title, content, notification_type) AS (
    VALUES
        ('UI QA Khanh: Vé tháng đã kích hoạt', 'Tài khoản đã có vé tháng thật, QR và invoice để kiểm tra trang chủ sinh viên.', 'PAYMENT'),
        ('UI QA Khanh: Tuyến Campus Loop sẵn sàng', 'Route registration, lịch sử di chuyển và dữ liệu tuyến đã được seed cho tài khoản này.', 'TRIP')
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
    nr.title,
    nr.content,
    nr.notification_type,
    FALSE,
    CURRENT_TIMESTAMP
FROM notification_rows nr
CROSS JOIN recipient
CROSS JOIN sender
WHERE NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.recipient_user_id = recipient.user_id
      AND n.title = nr.title
);

WITH student_data AS (
    SELECT s.student_code
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE LOWER(u.email) = LOWER('khanhnv20a02@gmail.com')
),
trip_data AS (
    SELECT t.trip_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.description LIKE 'Tuyến nội khu (Seed):%'
      AND t.status = 'COMPLETED'
    ORDER BY t.service_date DESC, t.trip_id DESC
    LIMIT 1
),
handler AS (
    SELECT user_id
    FROM users
    WHERE role IN ('DISPATCHER', 'ADMIN')
    ORDER BY CASE role WHEN 'DISPATCHER' THEN 0 ELSE 1 END, user_id
    LIMIT 1
)
INSERT INTO feedback (
    student_code,
    trip_id,
    content,
    star_rating,
    submitted_at,
    status,
    response,
    handled_by_user_id
)
SELECT
    sd.student_code,
    t.trip_id,
    'Chuyến đi rất thoải mái, tài xế thân thiện và đúng giờ.',
    5,
    CURRENT_TIMESTAMP,
    'RESOLVED',
    'UniBus đã ghi nhận phản hồi QA.',
    handler.user_id
FROM student_data sd
CROSS JOIN trip_data t
LEFT JOIN handler ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM feedback f
    WHERE f.student_code = sd.student_code
      AND f.content = 'Chuyến đi rất thoải mái, tài xế thân thiện và đúng giờ.'
);

COMMIT;
