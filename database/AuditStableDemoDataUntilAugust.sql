-- Stable demo coverage audit.
-- Returns one readable result set with PASS/WARN/FAIL rows.

WITH params AS (
    SELECT CURRENT_DATE AS today, DATE '2026-08-31' AS end_date
),
demo_accounts(email, expected_role, purpose) AS (
    VALUES
        ('admin.demo@unibus.local', 'ADMIN', 'system admin dashboard/reporting'),
        ('driver.demo@unibus.local', 'DRIVER', 'driver active trip'),
        ('conductor.demo@unibus.local', 'CONDUCTOR', 'conductor scan'),
        ('dispatcher.demo@unibus.local', 'DISPATCHER', 'route/operations management'),
        ('uniadmin.demo@unibus.local', 'UNIVERSITY_ADMIN', 'university finance/reconciliation'),
        ('student.supported@unibus.local', 'STUDENT', 'subsidized student'),
        ('student.fullprice@unibus.local', 'STUDENT', 'full-price student'),
        ('student.monthly@unibus.local', 'STUDENT', 'active monthly pass'),
        ('student.day@unibus.local', 'STUDENT', 'day ticket'),
        ('student.unpaid@unibus.local', 'STUDENT', 'unpaid order'),
        ('student.history@unibus.local', 'STUDENT', 'travel history'),
        ('khanhnv20a02@gmail.com', 'STUDENT', 'Duy Tan full-price route test')
),
account_status AS (
    SELECT
        'account' AS section,
        da.email AS subject,
        CASE
            WHEN u.user_id IS NULL THEN 'FAIL'
            WHEN u.role <> da.expected_role THEN 'FAIL'
            WHEN u.status <> 'ACTIVE' THEN 'FAIL'
            WHEN da.expected_role = 'STUDENT' AND u.student_verification_status <> 'VERIFIED' THEN 'WARN'
            ELSE 'PASS'
        END AS status,
        concat('expected=', da.expected_role, ', actual=', COALESCE(u.role, 'missing'), ', purpose=', da.purpose) AS detail
    FROM demo_accounts da
    LEFT JOIN users u ON lower(u.email) = lower(da.email)
),
student_status AS (
    SELECT
        'student_profile' AS section,
        da.email AS subject,
        CASE
            WHEN da.expected_role <> 'STUDENT' THEN 'PASS'
            WHEN s.student_code IS NULL THEN 'FAIL'
            WHEN s.university_id IS NULL THEN 'WARN'
            ELSE 'PASS'
        END AS status,
        concat('student_code=', COALESCE(s.student_code, 'missing'), ', university=', COALESCE(s.university, 'missing')) AS detail
    FROM demo_accounts da
    LEFT JOIN users u ON lower(u.email) = lower(da.email)
    LEFT JOIN students s ON s.user_id = u.user_id
),
today_trips AS (
    SELECT
        'operations' AS section,
        'demo trips today' AS subject,
        CASE WHEN count(*) FILTER (WHERE t.service_date = p.today) >= 2 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('today_trips=', count(*) FILTER (WHERE t.service_date = p.today)) AS detail
    FROM params p
    LEFT JOIN trips t ON t.notes LIKE 'STABLE_DEMO%' AND t.service_date = p.today
),
trip_coverage AS (
    SELECT
        'operations' AS section,
        'trip coverage until 2026-08-31' AS subject,
        CASE WHEN count(missing_days.day) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('missing_days=', count(missing_days.day)) AS detail
    FROM params p
    LEFT JOIN LATERAL (
        SELECT d::date AS day
        FROM generate_series(p.today, p.end_date, INTERVAL '1 day') AS d
        WHERE NOT EXISTS (
            SELECT 1 FROM trips t
            WHERE t.notes LIKE 'STABLE_DEMO%'
              AND t.service_date = d::date
        )
    ) missing_days ON true
),
subsidy_status AS (
    SELECT
        'finance' AS section,
        'demo subsidy policy' AS subject,
        CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('active_policies=', count(*)) AS detail
    FROM subsidy_policies sp
    JOIN universities u ON u.university_id = sp.university_id
    JOIN params p ON true
    WHERE u.code = 'STABLE_DEMO_U'
      AND sp.status = 'ACTIVE'
      AND sp.active_from <= p.today
      AND (sp.active_until IS NULL OR sp.active_until >= p.end_date)
),
dtu_status AS (
    SELECT
        'finance' AS section,
        'Duy Tan active linked routes' AS subject,
        CASE WHEN count(r.route_id) = 0 THEN 'PASS' ELSE 'WARN' END AS status,
        concat(
            'active_linked_routes=', count(r.route_id),
            '; route_codes=', COALESCE(string_agg(r.route_code, ', ' ORDER BY r.route_code), 'none'),
            '; expected 0 for full-price test'
        ) AS detail
    FROM universities u
    LEFT JOIN route_universities ru ON ru.university_id = u.university_id
        AND ru.status = 'ACTIVE'
        AND ru.active_from <= CURRENT_DATE
        AND (ru.active_until IS NULL OR ru.active_until >= CURRENT_DATE)
    LEFT JOIN routes r ON r.route_id = ru.route_id AND r.status = 'ACTIVE'
    WHERE u.name = 'Trường Đại học Duy Tân'
),
ticket_status AS (
    SELECT 'ticketing' AS section, 'active monthly pass' AS subject,
           CASE WHEN EXISTS (SELECT 1 FROM monthly_passes WHERE student_code = 'SV-STABLE-MONTH' AND status = 'ACTIVE') THEN 'PASS' ELSE 'FAIL' END AS status,
           'SV-STABLE-MONTH should have ACTIVE monthly pass' AS detail
    UNION ALL
    SELECT 'ticketing', 'day ticket',
           CASE WHEN EXISTS (SELECT 1 FROM single_trip_tickets WHERE student_code = 'SV-STABLE-DAY' AND status = 'UNUSED') THEN 'PASS' ELSE 'FAIL' END,
           'SV-STABLE-DAY should have UNUSED single ticket'
    UNION ALL
    SELECT 'ticketing', 'unpaid V16 order',
           CASE WHEN EXISTS (SELECT 1 FROM tb_orders WHERE student_code = 'SV-STABLE-UNPAID' AND lower(payment_status) = 'unpaid' AND original_amount > 0 AND final_amount > 0) THEN 'PASS' ELSE 'FAIL' END,
           'SV-STABLE-UNPAID should have unpaid V16 order'
    UNION ALL
    SELECT 'ticketing', 'travel history',
           CASE WHEN EXISTS (SELECT 1 FROM travel_history WHERE student_code = 'SV-STABLE-HIST') THEN 'PASS' ELSE 'FAIL' END,
           'SV-STABLE-HIST should have QR scan travel history'
)
SELECT * FROM account_status
UNION ALL SELECT * FROM student_status WHERE subject LIKE 'student.%@unibus.local' OR subject = 'khanhnv20a02@gmail.com'
UNION ALL SELECT * FROM today_trips
UNION ALL SELECT * FROM trip_coverage
UNION ALL SELECT * FROM subsidy_status
UNION ALL SELECT * FROM dtu_status
UNION ALL SELECT * FROM ticket_status
ORDER BY section, subject;



