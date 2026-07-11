-- Demo coverage audit.
-- Returns one readable result set with PASS/WARN/FAIL rows.

WITH params AS (
    SELECT CURRENT_DATE AS today, DATE '2026-08-31' AS end_date
),
dtu AS (
    SELECT university_id, name
    FROM universities
    WHERE name = 'Trường Đại học Duy Tân'
    ORDER BY university_id
    LIMIT 1
),
demo_accounts(email, expected_role, purpose) AS (
    VALUES
        ('admin.demo@unibus.local', 'ADMIN', 'system admin dashboard/reporting'),
        ('driver.demo@unibus.local', 'DRIVER', 'driver active trip'),
        ('conductor.demo@unibus.local', 'CONDUCTOR', 'conductor scan'),
        ('dispatcher.demo@unibus.local', 'DISPATCHER', 'route/operations management'),
        ('uniadmin.demo@unibus.local', 'UNIVERSITY_ADMIN', 'Duy Tân finance/reconciliation'),
        ('student.supported@unibus.local', 'STUDENT', 'Duy Tân subsidized student'),
        ('student.fullprice@unibus.local', 'STUDENT', 'Duy Tân full-price student'),
        ('student.monthly@unibus.local', 'STUDENT', 'Duy Tân active monthly pass'),
        ('student.day@unibus.local', 'STUDENT', 'Duy Tân day ticket'),
        ('student.unpaid@unibus.local', 'STUDENT', 'Duy Tân unpaid order'),
        ('student.history@unibus.local', 'STUDENT', 'Duy Tân travel history'),
        ('khanhnv20a02@gmail.com', 'STUDENT', 'real Duy Tân full-price route test')
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
            WHEN s.university_id <> d.university_id THEN 'FAIL'
            ELSE 'PASS'
        END AS status,
        concat('student_code=', COALESCE(s.student_code, 'missing'), ', university=', COALESCE(s.university, 'missing'), ', university_id=', COALESCE(s.university_id::text, 'missing')) AS detail
    FROM demo_accounts da
    LEFT JOIN users u ON lower(u.email) = lower(da.email)
    LEFT JOIN students s ON s.user_id = u.user_id
    LEFT JOIN dtu d ON true
),
uniadmin_status AS (
    SELECT
        'university_admin' AS section,
        'uniadmin.demo@unibus.local' AS subject,
        CASE WHEN ua.university_id = d.university_id AND ua.status = 'ACTIVE' THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('managed_university=', COALESCE(u.name, 'missing'), ', university_id=', COALESCE(ua.university_id::text, 'missing')) AS detail
    FROM dtu d
    LEFT JOIN users admin_user ON admin_user.email = 'uniadmin.demo@unibus.local'
    LEFT JOIN university_admins ua ON ua.user_id = admin_user.user_id
    LEFT JOIN universities u ON u.university_id = ua.university_id
),
linked_routes AS (
    SELECT r.route_id, r.route_code, r.route_name, r.external_source
    FROM dtu d
    JOIN route_universities ru ON ru.university_id = d.university_id
        AND ru.status = 'ACTIVE'
        AND ru.active_from <= CURRENT_DATE
        AND (ru.active_until IS NULL OR ru.active_until >= CURRENT_DATE)
    JOIN routes r ON r.route_id = ru.route_id AND r.status = 'ACTIVE'
),
supported_route_status AS (
    SELECT
        'route_policy' AS section,
        'Duy Tân supported BUSMAP route' AS subject,
        CASE WHEN count(*) FILTER (WHERE external_source = 'BUSMAP_DN' AND route_code NOT LIKE 'UB-DN-%') >= 1 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('linked_routes=', count(*), '; route_codes=', COALESCE(string_agg(route_code, ', ' ORDER BY route_code), 'none')) AS detail
    FROM linked_routes
),
subsidy_status AS (
    SELECT
        'route_policy' AS section,
        'Duy Tân active subsidy policy' AS subject,
        CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('active_policies=', count(*), '; policy_names=', COALESCE(string_agg(sp.policy_name, ', ' ORDER BY sp.policy_name), 'none')) AS detail
    FROM dtu d
    JOIN subsidy_policies sp ON sp.university_id = d.university_id
    JOIN params p ON true
    WHERE sp.status = 'ACTIVE'
      AND sp.active_from <= p.today
      AND (sp.active_until IS NULL OR sp.active_until >= p.today)
),
full_price_route_status AS (
    SELECT
        'route_policy' AS section,
        'full-price BUSMAP route unlinked' AS subject,
        CASE
            WHEN r.route_id IS NULL THEN 'FAIL'
            WHEN r.external_source <> 'BUSMAP_DN' OR r.route_code LIKE 'UB-DN-%' THEN 'FAIL'
            WHEN EXISTS (SELECT 1 FROM linked_routes lr WHERE lr.route_id = r.route_id) THEN 'FAIL'
            ELSE 'PASS'
        END AS status,
        concat('student.fullprice route=', COALESCE(r.route_code, 'missing'), ', source=', COALESCE(r.external_source, 'missing'), ', linked_to_dtu=', EXISTS (SELECT 1 FROM linked_routes lr WHERE lr.route_id = r.route_id)) AS detail
    FROM students s
    LEFT JOIN route_registrations rr ON rr.student_code = s.student_code AND rr.status = 'APPROVED'
    LEFT JOIN routes r ON r.route_id = rr.route_id
    WHERE s.student_code = 'SV-DEMO-FULL'
    ORDER BY rr.registration_id DESC
    LIMIT 1
),
today_trips AS (
    SELECT
        'operations' AS section,
        'demo trips today' AS subject,
        CASE WHEN count(*) FILTER (WHERE t.service_date = p.today) >= 2 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('today_trips=', count(*) FILTER (WHERE t.service_date = p.today), '; routes=', COALESCE(string_agg(DISTINCT r.route_code, ', ' ORDER BY r.route_code), 'none')) AS detail
    FROM params p
    LEFT JOIN trips t ON (t.notes LIKE 'DEMO_DATA%' OR t.notes LIKE 'DEMO_FLEET%') AND t.service_date = p.today
    LEFT JOIN routes r ON r.route_id = t.route_id
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
            WHERE (t.notes LIKE 'DEMO_DATA%' OR t.notes LIKE 'DEMO_FLEET%')
              AND t.service_date = d::date
        )
    ) missing_days ON true
),
ticket_status AS (
    SELECT 'ticketing' AS section, 'active monthly pass' AS subject,
           CASE WHEN EXISTS (SELECT 1 FROM monthly_passes WHERE student_code = 'SV-DEMO-MONTH' AND status = 'ACTIVE') THEN 'PASS' ELSE 'FAIL' END AS status,
           'SV-DEMO-MONTH should have ACTIVE monthly pass' AS detail
    UNION ALL
    SELECT 'ticketing', 'supported monthly pass',
           CASE WHEN EXISTS (SELECT 1 FROM monthly_passes mp JOIN linked_routes lr ON lr.route_id = mp.route_id WHERE mp.student_code = 'SV-DEMO-SUB' AND mp.status = 'ACTIVE') THEN 'PASS' ELSE 'FAIL' END,
           'SV-DEMO-SUB should have ACTIVE monthly pass on Duy Tân linked BUSMAP route'
    UNION ALL
    SELECT 'ticketing', 'day ticket',
           CASE WHEN EXISTS (SELECT 1 FROM single_trip_tickets WHERE student_code = 'SV-DEMO-DAY' AND status = 'UNUSED') THEN 'PASS' ELSE 'FAIL' END,
           'SV-DEMO-DAY should have UNUSED single ticket'
    UNION ALL
    SELECT 'ticketing', 'unpaid V16 order',
           CASE WHEN EXISTS (SELECT 1 FROM tb_orders WHERE student_code = 'SV-DEMO-UNPAID' AND lower(payment_status) = 'unpaid' AND original_amount > 0 AND final_amount > 0 AND order_mode = 'single-route') THEN 'PASS' ELSE 'FAIL' END,
           'SV-DEMO-UNPAID should have unpaid V16 order'
    UNION ALL
    SELECT 'ticketing', 'paid order transaction',
           CASE WHEN EXISTS (SELECT 1 FROM tb_orders o JOIN tb_transactions tx ON tx.matched_order_id = o.id WHERE o.student_code = 'SV-DEMO-MONTH' AND lower(o.payment_status) = 'paid') THEN 'PASS' ELSE 'FAIL' END,
           'SV-DEMO-MONTH should have paid order matched to SePay transaction'
    UNION ALL
    SELECT 'ticketing', 'travel history',
           CASE WHEN EXISTS (SELECT 1 FROM travel_history WHERE student_code = 'SV-DEMO-HIST') THEN 'PASS' ELSE 'FAIL' END,
           'SV-DEMO-HIST should have QR scan travel history'
    UNION ALL
    SELECT 'ticketing', 'demo monthly scan validity',
           CASE WHEN count(*) FILTER (WHERE expires_on <= (SELECT end_date FROM params)) = 0 AND count(*) >= 4 THEN 'PASS' ELSE 'FAIL' END,
           concat('active_demo_passes=', count(*), '; expiring_too_early=', count(*) FILTER (WHERE expires_on <= (SELECT end_date FROM params)), '; expires_on=', COALESCE(string_agg(DISTINCT expires_on::text, ', ' ORDER BY expires_on::text), 'none'))
    FROM monthly_passes
    WHERE student_code LIKE 'SV-DEMO-%'
      AND status = 'ACTIVE'
      AND qr_code LIKE 'DEMO-%'
),
uniadmin_visibility AS (
    SELECT
        'university_admin' AS section,
        'Duy Tân visible demo data' AS subject,
        CASE WHEN count(DISTINCT s.student_code) >= 6 AND count(DISTINCT usr.roster_id) >= 6 AND count(DISTINCT o.id) >= 2 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('students=', count(DISTINCT s.student_code), ', roster_rows=', count(DISTINCT usr.roster_id), ', orders=', count(DISTINCT o.id), ', monthly_passes=', count(DISTINCT mp.monthly_pass_id), ', single_tickets=', count(DISTINCT st.single_trip_ticket_id)) AS detail
    FROM dtu d
    LEFT JOIN students s ON s.university_id = d.university_id AND (s.student_code LIKE 'SV-DEMO-%' OR s.student_code = 'DTU202032312')
    LEFT JOIN university_student_rosters usr ON usr.university_id = d.university_id AND usr.student_code = s.student_code AND usr.status = 'ACTIVE'
    LEFT JOIN tb_orders o ON o.student_code = s.student_code
    LEFT JOIN monthly_passes mp ON mp.student_code = s.student_code
    LEFT JOIN single_trip_tickets st ON st.student_code = s.student_code
),
domain_status AS (
    SELECT
        'university_domain' AS section,
        'Đà Nẵng email domains' AS subject,
        CASE WHEN count(*) FILTER (WHERE d.status = 'ACTIVE') >= 12 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('active_domains=', count(*) FILTER (WHERE d.status = 'ACTIVE'), '; domains=', COALESCE(string_agg(d.domain, ', ' ORDER BY d.domain), 'none')) AS detail
    FROM university_domains d
    WHERE d.domain IN (
        'demo.unibus.local',
        'duytan.edu.vn',
        'dtu.edu.vn',
        'dut.udn.vn',
        'ute.udn.vn',
        'ued.udn.vn',
        'vku.udn.vn',
        'due.udn.vn',
        'ufl.udn.vn',
        'udn.vn',
        'donga.edu.vn',
        'fpt.edu.vn'
    )
),
legacy_warnings AS (
    SELECT
        'legacy_warning' AS section,
        'demo students still outside Duy Tân' AS subject,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'WARN' END AS status,
        concat('count=', count(*), '; students=', COALESCE(string_agg(s.student_code || ':' || COALESCE(u.name, s.university), ', ' ORDER BY s.student_code), 'none')) AS detail
    FROM students s
    LEFT JOIN universities u ON u.university_id = s.university_id
    LEFT JOIN dtu d ON true
    WHERE s.student_code LIKE 'SV-DEMO-%'
      AND (s.university_id IS DISTINCT FROM d.university_id)
    UNION ALL
    SELECT
        'legacy_warning',
        'demo registrations using fake UB-DN routes',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'WARN' END,
        concat('count=', count(*), '; route_codes=', COALESCE(string_agg(DISTINCT r.route_code, ', ' ORDER BY r.route_code), 'none'))
    FROM route_registrations rr
    JOIN routes r ON r.route_id = rr.route_id
    WHERE rr.student_code LIKE 'SV-DEMO-%'
      AND rr.status = 'APPROVED'
      AND r.route_code LIKE 'UB-DN-%'
)
SELECT * FROM account_status
UNION ALL SELECT * FROM student_status WHERE subject LIKE 'student.%@unibus.local' OR subject = 'khanhnv20a02@gmail.com'
UNION ALL SELECT * FROM uniadmin_status
UNION ALL SELECT * FROM supported_route_status
UNION ALL SELECT * FROM subsidy_status
UNION ALL SELECT * FROM full_price_route_status
UNION ALL SELECT * FROM today_trips
UNION ALL SELECT * FROM trip_coverage
UNION ALL SELECT * FROM ticket_status
UNION ALL SELECT * FROM uniadmin_visibility
UNION ALL SELECT * FROM domain_status
UNION ALL SELECT * FROM legacy_warnings
ORDER BY section, subject;
