-- Demo coverage audit.
-- Returns one readable result set with PASS/WARN/FAIL rows.

SET TIME ZONE 'Asia/Ho_Chi_Minh';

WITH params AS (
    SELECT CURRENT_DATE AS today, DATE '2026-08-31' AS end_date
),
expected_universities(code, minimum_roster, minimum_login_students, minimum_admins, minimum_orders, minimum_monthly_passes, minimum_single_tickets, minimum_invoices) AS (
    VALUES
        ('DTU', 15, 6, 2, 2, 3, 1, 2),
        ('UTE', 15, 4, 2, 12, 3, 3, 4),
        ('VKU', 15, 4, 2, 12, 3, 3, 4),
        ('FPTDN', 15, 4, 2, 12, 3, 3, 4)
),
expected_staff(email, expected_role) AS (
    VALUES
        ('admin.demo@unibus.local', 'ADMIN'),
        ('admin.operations.demo@unibus.local', 'ADMIN'),
        ('dispatcher.demo@unibus.local', 'DISPATCHER'),
        ('dispatcher.morning.demo@unibus.local', 'DISPATCHER'),
        ('dispatcher.evening.demo@unibus.local', 'DISPATCHER'),
        ('driver.demo@unibus.local', 'DRIVER'),
        ('driver.02.demo@unibus.local', 'DRIVER'),
        ('driver.03.demo@unibus.local', 'DRIVER'),
        ('driver.04.demo@unibus.local', 'DRIVER'),
        ('driver.05.demo@unibus.local', 'DRIVER'),
        ('conductor.demo@unibus.local', 'CONDUCTOR'),
        ('conductor.02.demo@unibus.local', 'CONDUCTOR'),
        ('conductor.03.demo@unibus.local', 'CONDUCTOR'),
        ('conductor.04.demo@unibus.local', 'CONDUCTOR')
),
demo_students AS (
    SELECT s.student_code, s.user_id, s.university_id, u.email
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE u.email IN (
        'student.supported@unibus.local', 'student.fullprice@unibus.local', 'student.monthly@unibus.local',
        'student.day@unibus.local', 'student.unpaid@unibus.local', 'student.history@unibus.local'
    )
       OR u.email LIKE 'student.ute.%@unibus.local'
       OR u.email LIKE 'student.vku.%@unibus.local'
       OR u.email LIKE 'student.fpt.%@unibus.local'
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
            WHEN u.user_id IS NULL AND lower(da.email) = 'khanhnv20a02@gmail.com' THEN 'WARN'
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
staff_status AS (
    SELECT
        'staff_account' AS section,
        es.email AS subject,
        CASE
            WHEN u.user_id IS NULL THEN 'FAIL'
            WHEN u.role <> es.expected_role OR u.status <> 'ACTIVE' THEN 'FAIL'
            WHEN es.expected_role = 'DRIVER'
             AND (d.driver_id IS NULL OR NULLIF(btrim(d.license_number), '') IS NULL OR NULLIF(btrim(d.work_status), '') IS NULL) THEN 'FAIL'
            WHEN es.expected_role = 'CONDUCTOR'
             AND (c.conductor_id IS NULL OR NULLIF(btrim(c.employee_code), '') IS NULL) THEN 'FAIL'
            WHEN es.expected_role = 'DISPATCHER'
             AND (dp.dispatcher_id IS NULL OR NULLIF(btrim(dp.employee_code), '') IS NULL OR NULLIF(btrim(dp.department), '') IS NULL) THEN 'FAIL'
            ELSE 'PASS'
        END AS status,
        concat(
            'expected=', es.expected_role,
            ', actual=', COALESCE(u.role, 'missing'),
            ', user_status=', COALESCE(u.status, 'missing'),
            ', profile=', CASE es.expected_role
                WHEN 'DRIVER' THEN concat('driver_id=', COALESCE(d.driver_id::text, 'missing'), ', license=', COALESCE(d.license_number, 'missing'), ', work_status=', COALESCE(d.work_status, 'missing'))
                WHEN 'CONDUCTOR' THEN concat('conductor_id=', COALESCE(c.conductor_id::text, 'missing'), ', employee_code=', COALESCE(c.employee_code, 'missing'))
                WHEN 'DISPATCHER' THEN concat('dispatcher_id=', COALESCE(dp.dispatcher_id::text, 'missing'), ', employee_code=', COALESCE(dp.employee_code, 'missing'), ', department=', COALESCE(dp.department, 'missing'))
                ELSE 'not-applicable'
            END
        ) AS detail
    FROM expected_staff es
    LEFT JOIN users u ON lower(u.email) = lower(es.email)
    LEFT JOIN drivers d ON d.user_id = u.user_id
    LEFT JOIN conductors c ON c.user_id = u.user_id
    LEFT JOIN dispatchers dp ON dp.user_id = u.user_id
),
university_density AS (
    SELECT
        'university_density' AS section,
        eu.code AS subject,
        CASE
            WHEN u.university_id IS NOT NULL
             AND counts.roster >= eu.minimum_roster
             AND counts.login_students >= eu.minimum_login_students
             AND counts.admins >= eu.minimum_admins
             AND counts.orders >= eu.minimum_orders
             AND counts.monthly_passes >= eu.minimum_monthly_passes
             AND counts.single_tickets >= eu.minimum_single_tickets
             AND counts.invoices >= eu.minimum_invoices
            THEN 'PASS' ELSE 'FAIL'
        END AS status,
        concat(
            'roster=', counts.roster, '/', eu.minimum_roster,
            ', login_students=', counts.login_students, '/', eu.minimum_login_students,
            ', admins=', counts.admins, '/', eu.minimum_admins,
            ', orders=', counts.orders, '/', eu.minimum_orders,
            ', monthly_passes=', counts.monthly_passes, '/', eu.minimum_monthly_passes,
            ', single_tickets=', counts.single_tickets, '/', eu.minimum_single_tickets,
            ', invoices=', counts.invoices, '/', eu.minimum_invoices,
            ', notifications=', counts.notifications
        ) AS detail
    FROM expected_universities eu
    LEFT JOIN universities u ON u.code = eu.code
    LEFT JOIN LATERAL (
        SELECT
            (SELECT count(*) FROM university_student_rosters usr WHERE usr.university_id = u.university_id) AS roster,
            (SELECT count(DISTINCT s.user_id) FROM students s JOIN users student_user ON student_user.user_id = s.user_id WHERE s.university_id = u.university_id AND student_user.role = 'STUDENT' AND student_user.status = 'ACTIVE') AS login_students,
            (SELECT count(DISTINCT ua.user_id) FROM university_admins ua JOIN users admin_user ON admin_user.user_id = ua.user_id WHERE ua.university_id = u.university_id AND ua.status = 'ACTIVE' AND admin_user.role = 'UNIVERSITY_ADMIN' AND admin_user.status = 'ACTIVE') AS admins,
            (SELECT count(DISTINCT o.id) FROM students s JOIN tb_orders o ON o.student_code = s.student_code WHERE s.university_id = u.university_id) AS orders,
            (SELECT count(DISTINCT mp.monthly_pass_id) FROM students s JOIN monthly_passes mp ON mp.student_code = s.student_code WHERE s.university_id = u.university_id) AS monthly_passes,
            (SELECT count(DISTINCT st.single_trip_ticket_id) FROM students s JOIN single_trip_tickets st ON st.student_code = s.student_code WHERE s.university_id = u.university_id) AS single_tickets,
            (SELECT count(DISTINCT i.invoice_id) FROM students s JOIN invoices i ON i.student_code = s.student_code WHERE s.university_id = u.university_id) AS invoices,
            (SELECT count(*) FROM notifications n WHERE n.recipient_user_id IN (
                SELECT s.user_id FROM students s WHERE s.university_id = u.university_id
                UNION
                SELECT ua.user_id FROM university_admins ua WHERE ua.university_id = u.university_id
            )) AS notifications
    ) counts ON true
),
student_status AS (
    SELECT
        'student_profile' AS section,
        da.email AS subject,
        CASE
            WHEN da.expected_role <> 'STUDENT' THEN 'PASS'
            WHEN s.student_code IS NULL AND lower(da.email) = 'khanhnv20a02@gmail.com' THEN 'WARN'
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
        CASE WHEN ua.university_id = d.university_id AND ua.status = 'ACTIVE' AND ua.title = 'Quản trị viên trường' THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('managed_university=', COALESCE(u.name, 'missing'), ', university_id=', COALESCE(ua.university_id::text, 'missing'), ', title=', COALESCE(ua.title, 'missing')) AS detail
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
dtu_demo_campus_status AS (
    SELECT
        'route_policy' AS section,
        'Duy Tân Nguyễn Văn Linh campus' AS subject,
        CASE WHEN c.address = '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng'
                  AND abs(c.latitude - 16.0600568) < 0.000001
                  AND abs(c.longitude - 108.2096704) < 0.000001 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('address=', COALESCE(c.address, 'missing'), '; lat=', COALESCE(c.latitude::text, 'missing'), '; lng=', COALESCE(c.longitude::text, 'missing')) AS detail
    FROM dtu d
    LEFT JOIN campuses c ON c.university_id = d.university_id AND c.code = 'DTU_MAIN'
),
route_16_status AS (
    SELECT
        'route_policy' AS section,
        'DTU route 16 demo path' AS subject,
        CASE WHEN r.external_source = 'BUSMAP_DN'
                  AND EXISTS (SELECT 1 FROM linked_routes lr WHERE lr.route_id = r.route_id)
                  AND count(DISTINCT f.fare_type) FILTER (WHERE f.fare_type IN ('SINGLE', 'MONTHLY')) = 2
                  AND count(DISTINCT rs.stop_id) FILTER (WHERE rs.stop_id IN (729, 751) OR st.stop_name IN ('E144 Trần Đại Nghĩa', '10 Lý Thái Tổ')) = 2
             THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('route_id=', COALESCE(r.route_id::text, 'missing'), '; source=', COALESCE(r.external_source, 'missing'),
               '; fares=', count(DISTINCT f.fare_type) FILTER (WHERE f.fare_type IN ('SINGLE', 'MONTHLY')),
               '; demo_stops=', count(DISTINCT rs.stop_id) FILTER (WHERE rs.stop_id IN (729, 751) OR st.stop_name IN ('E144 Trần Đại Nghĩa', '10 Lý Thái Tổ'))) AS detail
    FROM routes r
    LEFT JOIN fares f ON f.route_id = r.route_id AND f.effective_from <= CURRENT_DATE AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
    LEFT JOIN route_stops rs ON rs.route_id = r.route_id
    LEFT JOIN stops st ON st.stop_id = rs.stop_id
    WHERE r.route_code = '16' AND r.status = 'ACTIVE'
    GROUP BY r.route_id, r.external_source
),
supported_route_status AS (
    SELECT
        'route_policy' AS section,
        'Duy Tân supported BUSMAP route' AS subject,
        CASE WHEN count(*) FILTER (WHERE external_source = 'BUSMAP_DN' AND route_code NOT LIKE 'UB-DN-%' AND NULLIF(btrim(route_name), '') IS NOT NULL) >= 1 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('linked_routes=', count(*), '; routes=', COALESCE(string_agg(route_code || ':' || COALESCE(NULLIF(btrim(route_name), ''), 'missing-name'), ', ' ORDER BY route_code), 'none')) AS detail
    FROM linked_routes
),
subsidy_status AS (
    SELECT
        'route_policy' AS section,
        'Duy Tân active subsidy policy' AS subject,
        CASE WHEN count(*) FILTER (WHERE sp.campus_id IS NULL) > 0 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('active_policies=', count(*), '; university_wide=', count(*) FILTER (WHERE sp.campus_id IS NULL), '; policy_names=', COALESCE(string_agg(sp.policy_name, ', ' ORDER BY sp.policy_name), 'none')) AS detail
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
    WHERE s.student_code = '27212100002'
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
demo_assignment_status AS (
    SELECT
        'operations' AS section,
        'demo crew assignment today' AS subject,
        CASE
            WHEN count(t.trip_id) >= 2
             AND count(t.trip_id) FILTER (WHERE driver_user.user_id IS NOT NULL AND conductor_user.user_id IS NOT NULL) = count(t.trip_id)
            THEN 'PASS' ELSE 'FAIL'
        END AS status,
        concat('trips=', count(t.trip_id), '; correctly_assigned=', count(t.trip_id) FILTER (WHERE driver_user.user_id IS NOT NULL AND conductor_user.user_id IS NOT NULL)) AS detail
    FROM params p
    LEFT JOIN trips t ON t.notes LIKE 'DEMO_DATA%' AND t.service_date = p.today
    LEFT JOIN drivers d ON d.driver_id = t.driver_id
    LEFT JOIN users driver_user ON driver_user.user_id = d.user_id
    LEFT JOIN conductors c ON c.conductor_id = t.conductor_id
    LEFT JOIN users conductor_user ON conductor_user.user_id = c.user_id
),
schedule_weekday_status AS (
    SELECT
        'operations' AS section,
        'demo schedule weekday alignment' AS subject,
        CASE
            WHEN count(*) >= 2
             AND count(*) FILTER (WHERE bs.weekday_number = EXTRACT(ISODOW FROM t.service_date)::int) = count(*)
            THEN 'PASS' ELSE 'FAIL'
        END AS status,
        concat('scheduled_trips=', count(*), '; mismatched=', count(*) FILTER (WHERE bs.weekday_number <> EXTRACT(ISODOW FROM t.service_date)::int)) AS detail
    FROM trips t
    JOIN bus_schedules bs ON bs.schedule_id = t.schedule_id
    JOIN params p ON t.service_date BETWEEN p.today AND p.end_date
    WHERE t.notes LIKE 'DEMO_DATA%'
),
fleet_status AS (
    SELECT
        'operations' AS section,
        'fleet trip mix today' AS subject,
        CASE
            WHEN count(*) = 12
             AND count(*) FILTER (WHERE t.status = 'RUNNING') = 3
             AND count(*) FILTER (WHERE t.status = 'NOT_STARTED') = 9
             AND count(*) FILTER (WHERE t.schedule_id IS NOT NULL AND t.driver_id IS NOT NULL AND t.conductor_id IS NOT NULL) = 12
            THEN 'PASS' ELSE 'FAIL'
        END AS status,
        concat(
            'fleet_trips=', count(*),
            '; running=', count(*) FILTER (WHERE t.status = 'RUNNING'),
            '; waiting=', count(*) FILTER (WHERE t.status = 'NOT_STARTED'),
            '; fully_assigned=', count(*) FILTER (WHERE t.schedule_id IS NOT NULL AND t.driver_id IS NOT NULL AND t.conductor_id IS NOT NULL)
        ) AS detail
    FROM trips t
    JOIN params p ON t.service_date = p.today
    WHERE t.notes LIKE 'DEMO_FLEET%'
    UNION ALL
    SELECT
        'operations',
        'live fleet vehicle count today',
        CASE WHEN count(DISTINCT t.bus_id) = 13 THEN 'PASS' ELSE 'FAIL' END,
        concat('distinct_buses=', count(DISTINCT t.bus_id), '; trip_rows=', count(*))
    FROM trips t
    JOIN params p ON t.service_date = p.today
    WHERE t.notes LIKE 'DEMO_DATA%' OR t.notes LIKE 'DEMO_FLEET%'
    UNION ALL
    SELECT
        'operations',
        'driver running trip uniqueness',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('drivers_with_multiple_running_trips=', count(*), '; driver_ids=', COALESCE(string_agg(driver_id::text, ', ' ORDER BY driver_id), 'none'))
    FROM (
        SELECT t.driver_id
        FROM trips t
        WHERE (t.notes LIKE 'DEMO_DATA%' OR t.notes LIKE 'DEMO_FLEET%')
          AND t.status = 'RUNNING'
        GROUP BY t.driver_id
        HAVING count(*) > 1
    ) duplicate_running
    UNION ALL
    SELECT
        'operations',
        'demo trip lifecycle timestamps',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('invalid_trips=', count(*), '; trip_ids=', COALESCE(string_agg(t.trip_id::text, ', ' ORDER BY t.trip_id), 'none'))
    FROM trips t
    WHERE (t.notes LIKE 'DEMO_DATA%' OR t.notes LIKE 'DEMO_FLEET%')
      AND (
          (t.status = 'RUNNING' AND (t.departed_at IS NULL OR t.ended_at IS NOT NULL))
          OR (t.status = 'NOT_STARTED' AND (t.departed_at IS NOT NULL OR t.ended_at IS NOT NULL))
          OR (t.status = 'COMPLETED' AND (t.departed_at IS NULL OR t.ended_at IS NULL))
      )
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
           CASE WHEN EXISTS (SELECT 1 FROM monthly_passes WHERE student_code = '27211200003' AND status = 'ACTIVE') THEN 'PASS' ELSE 'FAIL' END AS status,
           '27211200003 should have ACTIVE monthly pass' AS detail
    UNION ALL
    SELECT 'ticketing', 'fresh Duy Tan student',
           CASE WHEN NOT EXISTS (SELECT 1 FROM route_registrations WHERE student_code = '27211200001')
                  AND NOT EXISTS (SELECT 1 FROM monthly_passes WHERE student_code = '27211200001')
                  AND NOT EXISTS (SELECT 1 FROM single_trip_tickets WHERE student_code = '27211200001')
                  AND NOT EXISTS (SELECT 1 FROM tb_orders WHERE student_code = '27211200001')
                  AND NOT EXISTS (SELECT 1 FROM travel_history WHERE student_code = '27211200001')
                THEN 'PASS' ELSE 'FAIL' END,
           '27211200001 should be a fresh Duy Tan student without registration, ticket, order or travel history'
    UNION ALL
    SELECT 'ticketing', 'day ticket',
           CASE WHEN EXISTS (SELECT 1 FROM single_trip_tickets WHERE student_code = '27217100004' AND status = 'UNUSED' AND expires_at >= CURRENT_TIMESTAMP) THEN 'PASS' ELSE 'FAIL' END,
           '27217100004 should have an unexpired UNUSED single ticket'
    UNION ALL
    SELECT 'ticketing', 'unpaid V16 order',
           CASE WHEN EXISTS (SELECT 1 FROM tb_orders WHERE student_code = '27212100005' AND lower(payment_status) = 'unpaid' AND original_amount > 0 AND final_amount > 0 AND order_mode = 'single-route') THEN 'PASS' ELSE 'FAIL' END,
           '27212100005 should have unpaid V16 order'
    UNION ALL
    SELECT 'ticketing', 'paid order transaction',
           CASE WHEN EXISTS (SELECT 1 FROM tb_orders o JOIN tb_transactions tx ON tx.matched_order_id = o.id WHERE o.student_code = '27211200003' AND lower(o.payment_status) = 'paid') THEN 'PASS' ELSE 'FAIL' END,
           '27211200003 should have paid order matched to SePay transaction'
    UNION ALL
    SELECT 'ticketing', 'travel history',
           CASE WHEN EXISTS (SELECT 1 FROM travel_history WHERE student_code = '27217200006') THEN 'PASS' ELSE 'FAIL' END,
           '27217200006 should have QR scan travel history'
    UNION ALL
    SELECT 'ticketing', 'demo monthly scan validity',
           CASE WHEN count(*) FILTER (WHERE expires_on <= (SELECT end_date FROM params)) = 0 AND count(*) >= 4 THEN 'PASS' ELSE 'FAIL' END,
           concat('active_demo_passes=', count(*), '; expiring_too_early=', count(*) FILTER (WHERE expires_on <= (SELECT end_date FROM params)), '; expires_on=', COALESCE(string_agg(DISTINCT expires_on::text, ', ' ORDER BY expires_on::text), 'none'))
    FROM monthly_passes
    WHERE student_code IN (SELECT student_code FROM demo_students)
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
    LEFT JOIN students s ON s.university_id = d.university_id AND (s.student_code IN (SELECT student_code FROM demo_students) OR s.student_code = 'DTU202032312')
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
integrity_status AS (
    SELECT
        'integrity' AS section,
        'paid order amounts' AS subject,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('invalid_orders=', count(*), '; order_ids=', COALESCE(string_agg(o.id::text, ', ' ORDER BY o.id), 'none')) AS detail
    FROM tb_orders o
    WHERE lower(o.payment_status) = 'paid'
      AND o.student_code IN (SELECT student_code FROM demo_students)
      AND (
          COALESCE(o.original_amount, 0) <> COALESCE(o.subsidy_amount, 0) + COALESCE(o.final_amount, 0)
          OR COALESCE(o.total, 0) <> COALESCE(o.final_amount, 0)
      )
    UNION ALL
    SELECT
        'integrity',
        'unique DEMO QR codes',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('duplicates=', count(*), '; qr_codes=', COALESCE(string_agg(q.qr_code || ':' || q.occurrences, ', ' ORDER BY q.qr_code), 'none'))
    FROM (
        SELECT qr_code, count(*) AS occurrences
        FROM (
            SELECT qr_code FROM monthly_passes WHERE qr_code LIKE 'DEMO-%'
            UNION ALL
            SELECT qr_code FROM single_trip_tickets WHERE qr_code LIKE 'DEMO-%'
        ) demo_qr
        GROUP BY qr_code
        HAVING count(*) > 1
    ) q
    UNION ALL
    SELECT
        'integrity',
        'active ticket dates',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('invalid_tickets=', count(*), '; tickets=', COALESCE(string_agg(ticket_ref, ', ' ORDER BY ticket_ref), 'none'))
    FROM (
        SELECT 'monthly:' || mp.monthly_pass_id AS ticket_ref
        FROM monthly_passes mp
        WHERE mp.student_code IN (SELECT student_code FROM demo_students) AND mp.status = 'ACTIVE' AND mp.expires_on < CURRENT_DATE
        UNION ALL
        SELECT 'single:' || st.single_trip_ticket_id
        FROM single_trip_tickets st
        WHERE st.student_code IN (SELECT student_code FROM demo_students) AND st.status = 'UNUSED' AND st.expires_at < CURRENT_TIMESTAMP
    ) invalid_tickets
    UNION ALL
    SELECT
        'integrity',
        'DEMO_DATA trip assignments',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('invalid_trips=', count(*), '; trip_ids=', COALESCE(string_agg(t.trip_id::text, ', ' ORDER BY t.trip_id), 'none'))
    FROM trips t
    WHERE t.notes LIKE 'DEMO_DATA%'
      AND (t.route_id IS NULL OR t.bus_id IS NULL OR t.driver_id IS NULL OR t.conductor_id IS NULL)
    UNION ALL
    SELECT
        'integrity',
        'unique demo account emails',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('duplicates=', count(*), '; emails=', COALESCE(string_agg(duplicate_email, ', ' ORDER BY duplicate_email), 'none'))
    FROM (
        SELECT lower(email) AS duplicate_email
        FROM users
        WHERE lower(email) LIKE '%@unibus.local'
        GROUP BY lower(email)
        HAVING count(*) > 1
    ) duplicate_emails
    UNION ALL
    SELECT
        'integrity',
        'no demo registrations on UB-DN routes',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('registrations=', count(*), '; routes=', COALESCE(string_agg(DISTINCT r.route_code, ', ' ORDER BY r.route_code), 'none'))
    FROM route_registrations rr
    JOIN routes r ON r.route_id = rr.route_id
    WHERE rr.student_code IN (SELECT student_code FROM demo_students)
      AND r.route_code LIKE 'UB-DN-%'
    UNION ALL
    SELECT
        'integrity',
        'cross-university student registrations',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('invalid_registrations=', count(*), '; records=', COALESCE(string_agg(invalid_record, ', ' ORDER BY invalid_record), 'none'))
    FROM (
        SELECT u.email || ':' || r.route_code AS invalid_record
        FROM route_registrations rr
        JOIN students s ON s.student_code = rr.student_code
        JOIN users u ON u.user_id = s.user_id
        JOIN routes r ON r.route_id = rr.route_id
        WHERE rr.status = 'APPROVED'
          AND (
              (u.email LIKE 'student.ute.%@unibus.local' AND r.route_code <> '11')
              OR (u.email LIKE 'student.vku.%@unibus.local' AND r.route_code <> '02')
              OR (u.email LIKE 'student.fpt.%@unibus.local' AND r.route_code <> 'N1')
          )
    ) invalid_school_registrations
    UNION ALL
    SELECT
        'integrity',
        'realistic school student codes',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('invalid_codes=', count(*), '; records=', COALESCE(string_agg(invalid_record, ', ' ORDER BY invalid_record), 'none'))
    FROM (
        SELECT u.code || ':' || usr.student_code AS invalid_record
        FROM university_student_rosters usr
        JOIN universities u ON u.university_id = usr.university_id
        WHERE (
               usr.email IN (
                   'student.supported@unibus.local', 'student.fullprice@unibus.local',
                   'student.monthly@unibus.local', 'student.day@unibus.local',
                   'student.unpaid@unibus.local', 'student.history@unibus.local',
                   'khanhnv20a02@gmail.com'
               )
               OR usr.email LIKE 'student.ute.%@unibus.local'
               OR usr.email LIKE 'student.vku.%@unibus.local'
               OR usr.email LIKE 'student.fpt.%@unibus.local'
               OR usr.email LIKE 'dtu.student%@demo.unibus.local'
               OR usr.email LIKE 'ute.student%@demo.unibus.local'
               OR usr.email LIKE 'vku.student%@demo.unibus.local'
               OR usr.email LIKE 'fptdn.student%@demo.unibus.local'
          )
          AND NOT CASE u.code
              WHEN 'DTU' THEN usr.student_code ~ '^[0-9]{11}$' OR usr.student_code ~ '^DTU[0-9]{9}$'
              WHEN 'UTE' THEN usr.student_code ~ '^[0-9]{10}$'
              WHEN 'VKU' THEN usr.student_code ~ '^[0-9]{2}[A-Z]{3}[0-9]{3}$'
              WHEN 'FPTDN' THEN usr.student_code ~ '^[A-Z]{2}[0-9]{6}$'
              ELSE false
          END
    ) invalid_student_codes
    UNION ALL
    SELECT
        'integrity',
        'known junk absent',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
        concat('junk_rows=', count(*), '; records=', COALESCE(string_agg(junk_record, ', ' ORDER BY junk_record), 'none'))
    FROM (
        SELECT 'policy:' || sp.subsidy_policy_id || ':dddd' AS junk_record
        FROM subsidy_policies sp
        WHERE sp.policy_name = 'dddd'
        UNION ALL
        SELECT 'campus:' || c.campus_id || ':' || c.code || ':' || c.name
        FROM campuses c
        WHERE c.code = 'DTU_DEMO_MAIN' OR c.name = 'Cơ sở demo Duy Tân'
        UNION ALL
        SELECT 'account:' || u.email
        FROM users u
        WHERE u.email = 'fleet.simulator@unibus.local'
    ) junk
),
legacy_warnings AS (
    SELECT
        'legacy_warning' AS section,
        'demo students linked to target universities' AS subject,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
        concat('invalid_count=', count(*), '; students=', COALESCE(string_agg(s.student_code || ':' || COALESCE(u.code, s.university), ', ' ORDER BY s.student_code), 'none')) AS detail
    FROM students s
    LEFT JOIN universities u ON u.university_id = s.university_id
    WHERE s.student_code IN (SELECT student_code FROM demo_students)
      AND (u.code IS NULL OR u.code NOT IN ('DTU','UTE','VKU','FPTDN'))
    UNION ALL
    SELECT
        'legacy_warning',
        'demo registrations using fake UB-DN routes',
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'WARN' END,
        concat('count=', count(*), '; route_codes=', COALESCE(string_agg(DISTINCT r.route_code, ', ' ORDER BY r.route_code), 'none'))
    FROM route_registrations rr
    JOIN routes r ON r.route_id = rr.route_id
    WHERE rr.student_code IN (SELECT student_code FROM demo_students)
      AND rr.status = 'APPROVED'
      AND r.route_code LIKE 'UB-DN-%'
)
SELECT * FROM account_status
UNION ALL SELECT * FROM staff_status
UNION ALL SELECT * FROM university_density
UNION ALL SELECT * FROM student_status WHERE subject LIKE 'student.%@unibus.local' OR subject = 'khanhnv20a02@gmail.com'
UNION ALL SELECT * FROM uniadmin_status
UNION ALL SELECT * FROM dtu_demo_campus_status
UNION ALL SELECT * FROM route_16_status
UNION ALL SELECT * FROM supported_route_status
UNION ALL SELECT * FROM subsidy_status
UNION ALL SELECT * FROM full_price_route_status
UNION ALL SELECT * FROM today_trips
UNION ALL SELECT * FROM demo_assignment_status
UNION ALL SELECT * FROM schedule_weekday_status
UNION ALL SELECT * FROM fleet_status
UNION ALL SELECT * FROM trip_coverage
UNION ALL SELECT * FROM ticket_status
UNION ALL SELECT * FROM uniadmin_visibility
UNION ALL SELECT * FROM domain_status
UNION ALL SELECT * FROM integrity_status
UNION ALL SELECT * FROM legacy_warnings
ORDER BY section, subject;
