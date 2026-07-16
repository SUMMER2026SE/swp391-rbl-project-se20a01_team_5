-- UniBus demo data until 2026-08-31.
-- Idempotent by design: master rows are upserted; generated demo scenario rows
-- with DEMO_DATA markers are deleted and recreated.
-- Login password for created demo accounts: Password123!

SET TIME ZONE 'Asia/Ho_Chi_Minh';

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('unibus-demo-baseline-v2'));

DO $$
DECLARE
    v_end_date date := DATE '2026-08-31';
    v_admin_user_id integer;
    v_supported_university_id integer;
    v_supported_campus_id integer;
    v_dtu_university_id integer;
    v_route_supported_id integer;
    v_route_full_id integer;
    v_boarding_supported_id integer;
    v_alighting_supported_id integer;
    v_boarding_full_id integer;
    v_alighting_full_id integer;
    v_full_direction integer;
    v_bus_id integer;
    v_driver_user_id integer;
    v_conductor_user_id integer;
    v_dispatcher_user_id integer;
    v_driver_id integer;
    v_conductor_id integer;
    v_dispatcher_id integer;
    v_policy_id integer;
    v_trip_today_supported_id integer;
    v_trip_today_full_id integer;
    v_payment_id integer;
    v_monthly_pass_id integer;
    v_single_ticket_id integer;
    v_order_id bigint;
    v_supported_single_amount numeric := 5000;
    v_supported_monthly_amount numeric := 100000;
    v_supported_monthly_subsidy numeric := 50000;
    v_supported_monthly_final numeric := 50000;
    v_supported_single_subsidy numeric := 2500;
    v_supported_single_final numeric := 2500;
    v_full_single_amount numeric := 5000;
    v_full_monthly_amount numeric := 100000;
    v_supported_boarding_label text := 'Trạm lên Duy Tân';
    v_supported_alighting_label text := 'Trạm xuống Duy Tân';
    v_full_boarding_label text := 'Trạm lên tuyến công khai';
    v_full_alighting_label text := 'Trạm xuống tuyến công khai';
    v_student record;
    v_baseline_student_emails text[] := ARRAY[
        'student.supported@unibus.local', 'student.fullprice@unibus.local',
        'student.monthly@unibus.local', 'student.day@unibus.local',
        'student.unpaid@unibus.local', 'student.history@unibus.local',
        'student.ute.monthly@unibus.local', 'student.ute.single@unibus.local',
        'student.ute.unpaid@unibus.local', 'student.ute.history@unibus.local',
        'student.vku.monthly@unibus.local', 'student.vku.single@unibus.local',
        'student.vku.unpaid@unibus.local', 'student.vku.history@unibus.local',
        'student.fpt.monthly@unibus.local', 'student.fpt.single@unibus.local',
        'student.fpt.unpaid@unibus.local', 'student.fpt.history@unibus.local'
    ];
BEGIN
    IF CURRENT_DATE > v_end_date THEN
        RAISE EXCEPTION 'Demo baseline expired on %, current date is %. Update the scenario before seeding.', v_end_date, CURRENT_DATE;
    END IF;

    INSERT INTO users (email, password_hash, full_name, phone_number, role, status, email_verified_at, student_verification_status, created_at, updated_at)
    VALUES
        ('admin.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Nguyễn Minh Quân', '0908000001', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('driver.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Nguyễn Minh Tài', '0908000002', 'DRIVER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conductor.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Trần Gia Hân', '0908000003', 'CONDUCTOR', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('dispatcher.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Phạm Quốc Huy', '0908000004', 'DISPATCHER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('uniadmin.demo@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Lê Thu Hà', '0908000005', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.supported@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Mai Anh Thư', '0908000011', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.fullprice@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Ngô Quốc Bảo', '0908000012', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.monthly@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Đặng Minh Khoa', '0908000013', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.day@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Trần Hải Yến', '0908000014', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.unpaid@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Võ Nhật Nam', '0908000015', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.history@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Phan Gia Linh', '0908000016', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        email_verified_at = EXCLUDED.email_verified_at,
        student_verification_status = EXCLUDED.student_verification_status,
        updated_at = CURRENT_TIMESTAMP;


    -- One-time migration from technical demo student codes to realistic school formats.
    DELETE FROM invoices WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM payments WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM travel_history WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM feedback WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM driver_ratings WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM monthly_passes WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM single_trip_tickets WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM tb_transactions WHERE matched_order_id IN (SELECT id FROM tb_orders WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST'));
    DELETE FROM tb_orders WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM route_registrations WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM university_student_rosters WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    DELETE FROM students WHERE student_code IN ('SV-DEMO-SUB','SV-DEMO-FULL','SV-DEMO-MONTH','SV-DEMO-DAY','SV-DEMO-UNPAID','SV-DEMO-HIST');
    SELECT user_id INTO v_admin_user_id FROM users WHERE email = 'admin.demo@unibus.local';
    SELECT user_id INTO v_driver_user_id FROM users WHERE email = 'driver.demo@unibus.local';
    SELECT user_id INTO v_conductor_user_id FROM users WHERE email = 'conductor.demo@unibus.local';
    SELECT user_id INTO v_dispatcher_user_id FROM users WHERE email = 'dispatcher.demo@unibus.local';

    SELECT university_id INTO v_dtu_university_id
    FROM universities
    WHERE name = 'Trường Đại học Duy Tân'
    ORDER BY university_id
    LIMIT 1;

    IF v_dtu_university_id IS NULL THEN
        SELECT university_id INTO v_dtu_university_id
        FROM universities
        WHERE name ILIKE '%Duy Tan%'
           OR name ILIKE '%Duy Tân%'
           OR name ILIKE '%DuyTan%'
        ORDER BY CASE WHEN name = 'Trường Đại học Duy Tân' THEN 0 ELSE 1 END, university_id
        LIMIT 1;
    END IF;

    IF v_dtu_university_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy Trường Đại học Duy Tân. Không tạo trường giả thay thế.';
    END IF;

    v_supported_university_id := v_dtu_university_id;

    INSERT INTO campuses (university_id, code, name, address, latitude, longitude, status, created_at, updated_at)
    VALUES (v_supported_university_id, 'DTU_MAIN', 'Cơ sở Nguyễn Văn Linh', '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng', 16.0600568, 108.2096704, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (university_id, code) DO UPDATE
    SET name = EXCLUDED.name,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP;

    SELECT campus_id INTO v_supported_campus_id FROM campuses WHERE university_id = v_supported_university_id AND code = 'DTU_MAIN';

    UPDATE university_domains
    SET university_id = v_supported_university_id,
        status = 'ACTIVE',
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE domain = 'demo.unibus.local';

    INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
    SELECT v_supported_university_id, 'demo.unibus.local', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM university_domains WHERE domain = 'demo.unibus.local');
    INSERT INTO universities (code, name, short_name, status)
    VALUES
        ('DTU', 'Trường Đại học Duy Tân', 'DTU', 'ACTIVE'),
        ('DUT', 'Trường Đại học Bách khoa - Đại học Đà Nẵng', 'DUT', 'ACTIVE'),
        ('UTE', 'Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng', 'UTE', 'ACTIVE'),
        ('UED', 'Trường Đại học Sư phạm - Đại học Đà Nẵng', 'UED', 'ACTIVE'),
        ('VKU', 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'VKU', 'ACTIVE'),
        ('DUE', 'Trường Đại học Kinh tế - Đại học Đà Nẵng', 'DUE', 'ACTIVE'),
        ('UFLS', 'Trường Đại học Ngoại ngữ - Đại học Đà Nẵng', 'UFLS', 'ACTIVE'),
        ('UDN', 'Đại học Đà Nẵng', 'UDN', 'ACTIVE'),
        ('UDA', 'Trường Đại học Đông Á', 'UDA', 'ACTIVE'),
        ('FPTDN', 'Trường Đại học FPT Đà Nẵng', 'FPT', 'ACTIVE')
    ON CONFLICT (name) DO UPDATE
    SET code = EXCLUDED.code,
        short_name = EXCLUDED.short_name,
        status = 'ACTIVE',
        updated_at = CURRENT_TIMESTAMP;

    WITH domain_payload(university_name, domain) AS (VALUES
        ('Trường Đại học Duy Tân', 'duytan.edu.vn'),
        ('Trường Đại học Duy Tân', 'dtu.edu.vn'),
        ('Trường Đại học Bách khoa - Đại học Đà Nẵng', 'dut.udn.vn'),
        ('Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng', 'ute.udn.vn'),
        ('Trường Đại học Sư phạm - Đại học Đà Nẵng', 'ued.udn.vn'),
        ('Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'vku.udn.vn'),
        ('Trường Đại học Kinh tế - Đại học Đà Nẵng', 'due.udn.vn'),
        ('Trường Đại học Ngoại ngữ - Đại học Đà Nẵng', 'ufl.udn.vn'),
        ('Đại học Đà Nẵng', 'udn.vn'),
        ('Trường Đại học Đông Á', 'donga.edu.vn'),
        ('Trường Đại học FPT Đà Nẵng', 'fpt.edu.vn')
    )
    UPDATE university_domains d
    SET university_id = u.university_id,
        status = 'ACTIVE',
        verified_at = COALESCE(d.verified_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    FROM domain_payload payload
    JOIN universities u ON u.name = payload.university_name
    WHERE d.domain = payload.domain;

    WITH domain_payload(university_name, domain) AS (VALUES
        ('Trường Đại học Duy Tân', 'duytan.edu.vn'),
        ('Trường Đại học Duy Tân', 'dtu.edu.vn'),
        ('Trường Đại học Bách khoa - Đại học Đà Nẵng', 'dut.udn.vn'),
        ('Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng', 'ute.udn.vn'),
        ('Trường Đại học Sư phạm - Đại học Đà Nẵng', 'ued.udn.vn'),
        ('Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'vku.udn.vn'),
        ('Trường Đại học Kinh tế - Đại học Đà Nẵng', 'due.udn.vn'),
        ('Trường Đại học Ngoại ngữ - Đại học Đà Nẵng', 'ufl.udn.vn'),
        ('Đại học Đà Nẵng', 'udn.vn'),
        ('Trường Đại học Đông Á', 'donga.edu.vn'),
        ('Trường Đại học FPT Đà Nẵng', 'fpt.edu.vn')
    )
    INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
    SELECT u.university_id, payload.domain, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM domain_payload payload
    JOIN universities u ON u.name = payload.university_name
    WHERE NOT EXISTS (SELECT 1 FROM university_domains d WHERE d.domain = payload.domain);

    INSERT INTO university_admins (user_id, university_id, status, permissions, title, assigned_at, assigned_by_user_id, updated_at)
    SELECT user_id, v_supported_university_id, 'ACTIVE', 'FINANCE,STUDENTS,REPORTS', 'Quản trị viên trường', CURRENT_TIMESTAMP, v_admin_user_id, CURRENT_TIMESTAMP
    FROM users
    WHERE email = 'uniadmin.demo@unibus.local'
    ON CONFLICT (user_id) DO UPDATE
    SET university_id = EXCLUDED.university_id,
        status = EXCLUDED.status,
        permissions = EXCLUDED.permissions,
        title = EXCLUDED.title,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO students (student_code, user_id, university, faculty, academic_year, date_of_birth, university_id)
    SELECT payload.student_code, users.user_id, payload.university, payload.faculty, payload.academic_year, payload.date_of_birth::date, payload.university_id
    FROM (VALUES
        ('27211200001', 'student.supported@unibus.local', 'Trường Đại học Duy Tân', 'Công nghệ thông tin', 2023, '2005-03-10', v_supported_university_id),
        ('27212100002', 'student.fullprice@unibus.local', 'Trường Đại học Duy Tân', 'Kinh tế', 2022, '2004-08-12', v_supported_university_id),
        ('27211200003', 'student.monthly@unibus.local', 'Trường Đại học Duy Tân', 'Kỹ thuật phần mềm', 2021, '2003-04-22', v_supported_university_id),
        ('27217100004', 'student.day@unibus.local', 'Trường Đại học Duy Tân', 'Du lịch', 2024, '2006-01-19', v_supported_university_id),
        ('27212100005', 'student.unpaid@unibus.local', 'Trường Đại học Duy Tân', 'Tài chính', 2023, '2005-05-05', v_supported_university_id),
        ('27217200006', 'student.history@unibus.local', 'Trường Đại học Duy Tân', 'Logistics', 2022, '2004-11-30', v_supported_university_id)
    ) AS payload(student_code, email, university, faculty, academic_year, date_of_birth, university_id)
    JOIN users ON users.email = payload.email
    ON CONFLICT (student_code) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        university = EXCLUDED.university,
        faculty = EXCLUDED.faculty,
        academic_year = EXCLUDED.academic_year,
        date_of_birth = EXCLUDED.date_of_birth,
        university_id = EXCLUDED.university_id;

    IF EXISTS (SELECT 1 FROM users WHERE email = 'khanhnv20a02@gmail.com') AND v_dtu_university_id IS NOT NULL THEN
        UPDATE users
        SET status = 'ACTIVE', student_verification_status = 'VERIFIED', email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
        WHERE email = 'khanhnv20a02@gmail.com';

        INSERT INTO students (student_code, user_id, university, faculty, academic_year, date_of_birth, university_id)
        SELECT 'DTU202032312', user_id, 'Trường Đại học Duy Tân', 'Công nghệ thông tin', 2020, DATE '2002-01-01', v_dtu_university_id
        FROM users
        WHERE email = 'khanhnv20a02@gmail.com'
        ON CONFLICT (student_code) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            university = EXCLUDED.university,
            faculty = COALESCE(students.faculty, EXCLUDED.faculty),
            academic_year = COALESCE(students.academic_year, EXCLUDED.academic_year),
            date_of_birth = COALESCE(students.date_of_birth, EXCLUDED.date_of_birth),
            university_id = EXCLUDED.university_id;
    END IF;

    INSERT INTO university_student_rosters (university_id, student_code, full_name, email, status, faculty, academic_year, matched_user_id, created_at, updated_at)
    SELECT s.university_id,
           s.student_code,
           u.full_name,
           u.email,
           'ACTIVE',
           s.faculty,
           s.academic_year,
           u.user_id,
           CURRENT_TIMESTAMP,
           CURRENT_TIMESTAMP
    FROM students s
    JOIN users u ON u.user_id = s.user_id
    WHERE s.university_id = v_supported_university_id
      AND (
          u.email IN (
              'student.supported@unibus.local',
              'student.fullprice@unibus.local',
              'student.monthly@unibus.local',
              'student.day@unibus.local',
              'student.unpaid@unibus.local',
              'student.history@unibus.local'
          )
          OR s.student_code = 'DTU202032312'
      )
    ON CONFLICT (university_id, student_code) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        status = 'ACTIVE',
        faculty = EXCLUDED.faculty,
        academic_year = EXCLUDED.academic_year,
        matched_user_id = EXCLUDED.matched_user_id,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO drivers (user_id, license_number, years_experience, average_rating, work_status)
    VALUES (v_driver_user_id, 'DEMO-DL-2026-01', 6, 4.80, 'READY')
    ON CONFLICT (user_id) DO UPDATE
    SET license_number = EXCLUDED.license_number,
        years_experience = EXCLUDED.years_experience,
        average_rating = EXCLUDED.average_rating,
        work_status = EXCLUDED.work_status;

    INSERT INTO conductors (user_id, employee_code)
    VALUES (v_conductor_user_id, 'DEMO-CON-2026-01')
    ON CONFLICT (user_id) DO UPDATE
    SET employee_code = EXCLUDED.employee_code;

    INSERT INTO dispatchers (user_id, employee_code, department)
    VALUES (v_dispatcher_user_id, 'DEMO-DSP-2026-01', 'O')
    ON CONFLICT (user_id) DO UPDATE
    SET employee_code = EXCLUDED.employee_code,
        department = EXCLUDED.department;

    SELECT driver_id INTO v_driver_id FROM drivers WHERE user_id = v_driver_user_id;
    SELECT conductor_id INTO v_conductor_id FROM conductors WHERE user_id = v_conductor_user_id;
    SELECT dispatcher_id INTO v_dispatcher_id FROM dispatchers WHERE user_id = v_dispatcher_user_id;

    INSERT INTO buses (license_plate, seat_count, bus_type, manufacture_year, status)
    VALUES ('43B-80808', 40, 'Xe buýt demo UniBus', 2024, 'READY')
    ON CONFLICT (license_plate) DO UPDATE
    SET seat_count = EXCLUDED.seat_count,
        bus_type = EXCLUDED.bus_type,
        manufacture_year = EXCLUDED.manufacture_year,
        status = EXCLUDED.status;

    SELECT bus_id INTO v_bus_id FROM buses WHERE license_plate = '43B-80808';

    INSERT INTO buses (license_plate, seat_count, bus_type, manufacture_year, status)
    SELECT '43B-' || (82000 + fleet_no)::text, 40, 'Xe buýt UniBus', 2024, 'READY'
    FROM generate_series(1, 12) AS fleet_no
    ON CONFLICT (license_plate) DO UPDATE
    SET seat_count = EXCLUDED.seat_count,
        bus_type = EXCLUDED.bus_type,
        manufacture_year = EXCLUDED.manufacture_year,
        status = EXCLUDED.status;

    SELECT route_id INTO v_route_supported_id
    FROM routes
    WHERE route_code = '16'
      AND status = 'ACTIVE'
      AND COALESCE(external_source, '') = 'BUSMAP_DN'
      AND (SELECT count(*) FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = routes.route_id) >= 2
    ORDER BY route_id
    LIMIT 1;

    IF v_route_supported_id IS NULL THEN
        SELECT route_id INTO v_route_supported_id
        FROM routes
        WHERE route_code IN ('12', '01', '06')
          AND status = 'ACTIVE'
          AND COALESCE(external_source, '') = 'BUSMAP_DN'
          AND (SELECT count(*) FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = routes.route_id) >= 2
        ORDER BY CASE route_code WHEN '12' THEN 0 WHEN '01' THEN 1 WHEN '06' THEN 2 ELSE 3 END, route_id
        LIMIT 1;
    END IF;

    IF v_route_supported_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy tuyến BUSMAP thật 16/12/01/06 đang hoạt động cho kịch bản trợ giá Duy Tân.';
    END IF;

    SELECT r.route_id INTO v_route_full_id
    FROM routes r
    WHERE r.route_code IN ('02', '06')
      AND r.status = 'ACTIVE'
      AND COALESCE(r.external_source, '') = 'BUSMAP_DN'
      AND (SELECT count(*) FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = r.route_id) >= 2
      AND r.route_id <> v_route_supported_id
      AND NOT EXISTS (
          SELECT 1
          FROM route_universities ru
          WHERE ru.route_id = r.route_id
            AND ru.university_id = v_supported_university_id
            AND ru.status = 'ACTIVE'
            AND ru.active_from <= CURRENT_DATE
            AND (ru.active_until IS NULL OR ru.active_until >= CURRENT_DATE)
      )
    ORDER BY CASE r.route_code WHEN '02' THEN 0 WHEN '06' THEN 1 ELSE 2 END, r.route_id
    LIMIT 1;

    IF v_route_full_id IS NULL THEN
        SELECT r.route_id INTO v_route_full_id
        FROM routes r
        WHERE r.status = 'ACTIVE'
          AND COALESCE(r.external_source, '') = 'BUSMAP_DN'
          AND r.route_id <> v_route_supported_id
          AND r.route_code NOT LIKE 'UB-DN-%'
          AND (SELECT count(*) FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = r.route_id) >= 2
          AND NOT EXISTS (
              SELECT 1
              FROM route_universities ru
              WHERE ru.route_id = r.route_id
                AND ru.university_id = v_supported_university_id
                AND ru.status = 'ACTIVE'
                AND ru.active_from <= CURRENT_DATE
                AND (ru.active_until IS NULL OR ru.active_until >= CURRENT_DATE)
          )
        ORDER BY r.route_id
        LIMIT 1;
    END IF;

    IF v_route_full_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy tuyến BUSMAP công khai chưa liên kết Duy Tân cho kịch bản giá thường.';
    END IF;

    IF EXISTS (SELECT 1 FROM routes WHERE route_id IN (v_route_supported_id, v_route_full_id) AND route_code LIKE 'UB-DN-%') THEN
        RAISE EXCEPTION 'Demo không được dùng tuyến UB-DN-* làm kịch bản chính.';
    END IF;

    SELECT rs.stop_id INTO v_boarding_supported_id
    FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id
    WHERE rs.route_id = v_route_supported_id
    ORDER BY CASE WHEN rs.stop_id = 729 OR lower(st.stop_name) = lower('E144 Trần Đại Nghĩa') THEN 0 ELSE 1 END, rs.stop_order ASC
    LIMIT 1;
    SELECT rs.stop_id INTO v_alighting_supported_id
    FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id
    WHERE rs.route_id = v_route_supported_id
    ORDER BY CASE WHEN rs.stop_id = 751 OR lower(st.stop_name) = lower('10 Lý Thái Tổ') THEN 0 ELSE 1 END, rs.stop_order DESC
    LIMIT 1;
    SELECT rs.station_direction INTO v_full_direction
    FROM route_stops rs
    WHERE rs.route_id = v_route_full_id
    GROUP BY rs.station_direction
    HAVING count(DISTINCT rs.stop_id) >= 2
    ORDER BY count(*) DESC, rs.station_direction
    LIMIT 1;
    SELECT rs.stop_id INTO v_boarding_full_id FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = v_route_full_id AND rs.station_direction = v_full_direction ORDER BY rs.stop_order ASC LIMIT 1;
    SELECT rs.stop_id INTO v_alighting_full_id FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = v_route_full_id AND rs.station_direction = v_full_direction AND rs.stop_id <> v_boarding_full_id ORDER BY rs.stop_order DESC LIMIT 1;
    IF v_boarding_supported_id IS NULL OR v_alighting_supported_id IS NULL OR v_boarding_supported_id = v_alighting_supported_id THEN
        RAISE EXCEPTION 'Supported demo route % does not have enough route stops.', v_route_supported_id;
    END IF;
    IF v_boarding_full_id IS NULL OR v_alighting_full_id IS NULL OR v_boarding_full_id = v_alighting_full_id THEN
        RAISE EXCEPTION 'Full-price demo route % does not have enough route stops.', v_route_full_id;
    END IF;

    SELECT COALESCE(s.stop_name, 'Trạm lên Duy Tân') INTO v_supported_boarding_label FROM stops s WHERE s.stop_id = v_boarding_supported_id;
    SELECT COALESCE(s.stop_name, 'Trạm xuống Duy Tân') INTO v_supported_alighting_label FROM stops s WHERE s.stop_id = v_alighting_supported_id;
    SELECT COALESCE(s.stop_name, 'Trạm lên tuyến công khai') INTO v_full_boarding_label FROM stops s WHERE s.stop_id = v_boarding_full_id;
    SELECT COALESCE(s.stop_name, 'Trạm xuống tuyến công khai') INTO v_full_alighting_label FROM stops s WHERE s.stop_id = v_alighting_full_id;

    INSERT INTO fares (route_id, fare_type, amount, effective_from, effective_until, adjusted_by_user_id, notes)
    SELECT v_route_supported_id, 'SINGLE', 5000, DATE '2026-01-01', DATE '2026-12-31', v_admin_user_id, 'DEMO Duy Tân supported BUSMAP fare fallback'
    WHERE NOT EXISTS (SELECT 1 FROM fares WHERE route_id = v_route_supported_id AND fare_type = 'SINGLE' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE));
    INSERT INTO fares (route_id, fare_type, amount, effective_from, effective_until, adjusted_by_user_id, notes)
    SELECT v_route_supported_id, 'MONTHLY', 100000, DATE '2026-01-01', DATE '2026-12-31', v_admin_user_id, 'DEMO Duy Tân supported BUSMAP fare fallback'
    WHERE NOT EXISTS (SELECT 1 FROM fares WHERE route_id = v_route_supported_id AND fare_type = 'MONTHLY' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE));
    INSERT INTO fares (route_id, fare_type, amount, effective_from, effective_until, adjusted_by_user_id, notes)
    SELECT v_route_full_id, 'SINGLE', 5000, DATE '2026-01-01', DATE '2026-12-31', v_admin_user_id, 'DEMO Duy Tân full-price BUSMAP fare fallback'
    WHERE NOT EXISTS (SELECT 1 FROM fares WHERE route_id = v_route_full_id AND fare_type = 'SINGLE' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE));
    INSERT INTO fares (route_id, fare_type, amount, effective_from, effective_until, adjusted_by_user_id, notes)
    SELECT v_route_full_id, 'MONTHLY', 100000, DATE '2026-01-01', DATE '2026-12-31', v_admin_user_id, 'DEMO Duy Tân full-price BUSMAP fare fallback'
    WHERE NOT EXISTS (SELECT 1 FROM fares WHERE route_id = v_route_full_id AND fare_type = 'MONTHLY' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE));

    SELECT amount INTO v_supported_single_amount
    FROM fares
    WHERE route_id = v_route_supported_id AND fare_type = 'SINGLE' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
    ORDER BY effective_from DESC, fare_id DESC
    LIMIT 1;
    SELECT amount INTO v_supported_monthly_amount
    FROM fares
    WHERE route_id = v_route_supported_id AND fare_type = 'MONTHLY' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
    ORDER BY effective_from DESC, fare_id DESC
    LIMIT 1;
    SELECT amount INTO v_full_single_amount
    FROM fares
    WHERE route_id = v_route_full_id AND fare_type = 'SINGLE' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
    ORDER BY effective_from DESC, fare_id DESC
    LIMIT 1;
    SELECT amount INTO v_full_monthly_amount
    FROM fares
    WHERE route_id = v_route_full_id AND fare_type = 'MONTHLY' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
    ORDER BY effective_from DESC, fare_id DESC
    LIMIT 1;

    v_supported_monthly_subsidy := LEAST(ROUND(v_supported_monthly_amount * 0.5), 90000);
    v_supported_monthly_final := v_supported_monthly_amount - v_supported_monthly_subsidy;
    v_supported_single_subsidy := LEAST(ROUND(v_supported_single_amount * 0.5), 90000);
    v_supported_single_final := v_supported_single_amount - v_supported_single_subsidy;

    INSERT INTO route_universities (route_id, university_id, campus_id, active_from, active_until, status, created_at, updated_at)
    SELECT v_route_supported_id, v_supported_university_id, v_supported_campus_id, CURRENT_DATE, v_end_date, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
        SELECT 1 FROM route_universities
        WHERE route_id = v_route_supported_id AND university_id = v_supported_university_id AND status = 'ACTIVE'
    );

    UPDATE route_universities
    SET campus_id = v_supported_campus_id, active_from = LEAST(active_from, CURRENT_DATE), active_until = v_end_date, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
    WHERE route_id = v_route_supported_id AND university_id = v_supported_university_id AND status = 'ACTIVE';

    INSERT INTO subsidy_policies (university_id, campus_id, policy_name, subsidy_type, value, max_amount, active_from, active_until, status, created_at, updated_at)
    SELECT v_supported_university_id, NULL, 'Demo trợ giá 50% đến 31/08/2026', 'PERCENTAGE', 50, 90000, CURRENT_DATE, v_end_date, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
        SELECT 1
        FROM subsidy_policies
        WHERE university_id = v_supported_university_id
          AND policy_name = 'Demo trợ giá 50% đến 31/08/2026'
    );

    SELECT subsidy_policy_id INTO v_policy_id
    FROM subsidy_policies
    WHERE university_id = v_supported_university_id
      AND policy_name = 'Demo trợ giá 50% đến 31/08/2026'
    ORDER BY subsidy_policy_id DESC
    LIMIT 1;

    UPDATE subsidy_policies
    SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
    WHERE university_id = v_supported_university_id
      AND subsidy_policy_id <> v_policy_id
      AND policy_name = 'Demo trợ giá 50% đến 31/08/2026';

    UPDATE subsidy_policies
    SET campus_id = NULL, subsidy_type = 'PERCENTAGE', value = 50, max_amount = 90000, active_from = CURRENT_DATE, active_until = v_end_date, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
    WHERE subsidy_policy_id = v_policy_id;

    DELETE FROM travel_history
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    DELETE FROM vehicle_locations
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    DELETE FROM internal_messages
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    DELETE FROM feedback
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    DELETE FROM incidents
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    DELETE FROM driver_ratings
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    DELETE FROM lost_item_reports
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    UPDATE single_trip_tickets
    SET used_on_trip_id = NULL, scanned_by_conductor_id = NULL
    WHERE used_on_trip_id IN (SELECT trip_id FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%'));

    DELETE FROM trips WHERE (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%');
    DELETE FROM bus_schedules
    WHERE assigned_by_user_id = v_admin_user_id
      AND bus_id = v_bus_id
      AND driver_id = v_driver_id
      AND conductor_id = v_conductor_id
      AND (
          (route_id = v_route_supported_id AND departure_time = TIME '07:30')
          OR (route_id = v_route_full_id AND departure_time = TIME '17:30')
      );

    INSERT INTO bus_schedules (route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, end_time, status, assigned_by_user_id, assigned_at)
    SELECT v_route_supported_id, v_bus_id, v_driver_id, v_conductor_id, weekday_number, TIME '07:30', TIME '08:30', 'ACTIVE', v_admin_user_id, CURRENT_TIMESTAMP
    FROM generate_series(1, 7) AS weekday_number;

    INSERT INTO bus_schedules (route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, end_time, status, assigned_by_user_id, assigned_at)
    SELECT v_route_full_id, v_bus_id, v_driver_id, v_conductor_id, weekday_number, TIME '17:30', TIME '18:30', 'ACTIVE', v_admin_user_id, CURRENT_TIMESTAMP
    FROM generate_series(1, 7) AS weekday_number;

    INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
    SELECT bs.schedule_id, v_route_supported_id, v_bus_id, v_driver_id, v_conductor_id, d::date,
           CASE
               WHEN d::date < CURRENT_DATE THEN d::date + TIME '07:30'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '07:30' THEN d::date + TIME '07:30'
               ELSE NULL
           END,
           CASE
               WHEN d::date < CURRENT_DATE THEN d::date + TIME '08:25'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '08:25' THEN d::date + TIME '08:25'
               ELSE NULL
           END,
           CASE
               WHEN d::date < CURRENT_DATE THEN 'COMPLETED'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '08:25' THEN 'COMPLETED'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '07:30' THEN 'RUNNING'
               ELSE 'NOT_STARTED'
           END,
           'DEMO_DATA supported morning trip'
    FROM generate_series(CURRENT_DATE - INTERVAL '7 days', v_end_date, INTERVAL '1 day') AS d
    JOIN bus_schedules bs ON bs.route_id = v_route_supported_id
        AND bs.bus_id = v_bus_id
        AND bs.driver_id = v_driver_id
        AND bs.conductor_id = v_conductor_id
        AND bs.weekday_number = EXTRACT(ISODOW FROM d::date)::int
        AND bs.departure_time = TIME '07:30'
        AND bs.status = 'ACTIVE'
        AND bs.assigned_by_user_id = v_admin_user_id
    WHERE CURRENT_DATE <= v_end_date;

    INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
    SELECT bs.schedule_id, v_route_full_id, v_bus_id, v_driver_id, v_conductor_id, d::date,
           CASE
               WHEN d::date < CURRENT_DATE THEN d::date + TIME '17:30'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '17:30' THEN d::date + TIME '17:30'
               ELSE NULL
           END,
           CASE
               WHEN d::date < CURRENT_DATE THEN d::date + TIME '18:25'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '18:25' THEN d::date + TIME '18:25'
               ELSE NULL
           END,
           CASE
               WHEN d::date < CURRENT_DATE THEN 'COMPLETED'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '18:25' THEN 'COMPLETED'
               WHEN d::date = CURRENT_DATE AND CURRENT_TIME >= TIME '17:30' THEN 'RUNNING'
               ELSE 'NOT_STARTED'
           END,
           'DEMO_DATA full-price afternoon trip'
    FROM generate_series(CURRENT_DATE - INTERVAL '7 days', v_end_date, INTERVAL '1 day') AS d
    JOIN bus_schedules bs ON bs.route_id = v_route_full_id
        AND bs.bus_id = v_bus_id
        AND bs.driver_id = v_driver_id
        AND bs.conductor_id = v_conductor_id
        AND bs.weekday_number = EXTRACT(ISODOW FROM d::date)::int
        AND bs.departure_time = TIME '17:30'
        AND bs.status = 'ACTIVE'
        AND bs.assigned_by_user_id = v_admin_user_id
    WHERE CURRENT_DATE <= v_end_date;

    SELECT trip_id INTO v_trip_today_supported_id FROM trips WHERE notes = 'DEMO_DATA supported morning trip' AND service_date = CURRENT_DATE ORDER BY trip_id LIMIT 1;
    SELECT trip_id INTO v_trip_today_full_id FROM trips WHERE notes = 'DEMO_DATA full-price afternoon trip' AND service_date = CURRENT_DATE ORDER BY trip_id LIMIT 1;

    DELETE FROM invoices WHERE student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM payments WHERE student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM travel_history WHERE student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM monthly_passes WHERE student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM single_trip_tickets WHERE student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM tb_transactions WHERE matched_order_id IN (SELECT o.id FROM tb_orders o JOIN students s ON s.student_code = o.student_code JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM tb_orders WHERE student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM route_registrations WHERE student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id = s.user_id WHERE u.email = ANY(v_baseline_student_emails));
    DELETE FROM feedback WHERE student_code = '27211200001';
    DELETE FROM driver_ratings WHERE student_code = '27211200001';
    DELETE FROM lost_item_reports WHERE reported_by_user_id = (SELECT user_id FROM users WHERE email = 'student.supported@unibus.local');
    DELETE FROM notifications WHERE recipient_user_id = (SELECT user_id FROM users WHERE email = 'student.supported@unibus.local');

    FOR v_student IN
        SELECT student_code,
               CASE WHEN student_code = '27212100002' THEN v_route_full_id ELSE v_route_supported_id END AS route_id,
               CASE WHEN student_code = '27212100002' THEN v_boarding_full_id ELSE v_boarding_supported_id END AS boarding_stop_id,
               CASE WHEN student_code = '27212100002' THEN v_alighting_full_id ELSE v_alighting_supported_id END AS alighting_stop_id
        FROM students s
        JOIN users u ON u.user_id = s.user_id
        WHERE u.email IN (
            'student.fullprice@unibus.local',
            'student.monthly@unibus.local',
            'student.day@unibus.local',
            'student.unpaid@unibus.local',
            'student.history@unibus.local'
        )
    LOOP
        INSERT INTO route_registrations (student_code, route_id, boarding_stop_id, alighting_stop_id, registered_at, effective_date, status, approved_by_user_id, approved_at)
        VALUES (v_student.student_code, v_student.route_id, v_student.boarding_stop_id, v_student.alighting_stop_id, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_DATE, 'APPROVED', v_admin_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day');
    END LOOP;

    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status)
    VALUES ('27211200003', v_route_supported_id, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, date_trunc('month', CURRENT_DATE)::date, CURRENT_TIMESTAMP - INTERVAL '1 day', (v_end_date + INTERVAL '1 day')::date, v_supported_monthly_final, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final, v_policy_id, 'DEMO-MONTH-27211200003', 'ACTIVE')
    RETURNING monthly_pass_id INTO v_monthly_pass_id;

    INSERT INTO payments (student_code, amount, method, status, transaction_code, created_at, monthly_pass_id, notes)
    VALUES ('27211200003', v_supported_monthly_final, 'BANK_TRANSFER', 'PAID', 'DEMO-PAY-MONTH', CURRENT_TIMESTAMP - INTERVAL '1 day', v_monthly_pass_id, 'Thanh toán demo vé tháng')
    RETURNING payment_id INTO v_payment_id;

    INSERT INTO invoices (payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount, issued_at)
    VALUES (v_payment_id, '27211200003', 'Hóa đơn demo vé tháng', v_supported_monthly_final, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final, CURRENT_TIMESTAMP - INTERVAL '1 day');

    INSERT INTO single_trip_tickets (student_code, route_id, boarding_stop_id, alighting_stop_id, fare_amount, qr_code, purchased_at, expires_at, status)
    VALUES ('27217100004', v_route_supported_id, v_boarding_supported_id, v_alighting_supported_id, v_supported_single_final, 'DEMO-DAY-27217100004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '12 hours', 'UNUSED')
    RETURNING single_trip_ticket_id INTO v_single_ticket_id;

    INSERT INTO payments (student_code, amount, method, status, transaction_code, created_at, single_trip_ticket_id, notes)
    VALUES ('27217100004', v_supported_single_final, 'BANK_TRANSFER', 'PAID', 'DEMO-PAY-DAY', CURRENT_TIMESTAMP, v_single_ticket_id, 'Thanh toán demo vé ngày')
    RETURNING payment_id INTO v_payment_id;

    INSERT INTO invoices (payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount, issued_at)
    VALUES (v_payment_id, '27217100004', 'Hóa đơn demo vé ngày', v_supported_single_final, v_supported_single_amount, v_supported_single_subsidy, v_supported_single_final, CURRENT_TIMESTAMP);

    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, last_scanned_at, scans_today, status)
    VALUES ('27217200006', v_route_supported_id, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, date_trunc('month', CURRENT_DATE)::date, CURRENT_TIMESTAMP - INTERVAL '3 days', (v_end_date + INTERVAL '1 day')::date, v_supported_monthly_final, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final, v_policy_id, 'DEMO-HIST-27217200006', CURRENT_TIMESTAMP - INTERVAL '2 hours', 1, 'ACTIVE');

    INSERT INTO travel_history (student_code, trip_id, registration_id, boarding_stop_id, alighting_stop_id, boarded_at, alighted_at, confirmation_method, confirmed_by_conductor_id)
    SELECT '27217200006', v_trip_today_supported_id, rr.registration_id, v_boarding_supported_id, v_alighting_supported_id, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 20 minutes', 'QR_SCAN', v_conductor_id
    FROM route_registrations rr
    WHERE rr.student_code = '27217200006'
    ORDER BY rr.registration_id DESC
    LIMIT 1;

    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status)
    VALUES ('27212100002', v_route_full_id, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, date_trunc('month', CURRENT_DATE)::date, CURRENT_TIMESTAMP - INTERVAL '1 hour', (v_end_date + INTERVAL '1 day')::date, v_full_monthly_amount, v_full_monthly_amount, 0, v_full_monthly_amount, NULL, 'DEMO-FULL-27212100002', 'ACTIVE');

    INSERT INTO tb_orders (student_code, ticket_type, route_id, total, payment_status, name, paid_at, created_at, updated_at, order_mode, ticket_period, origin_label, destination_label, original_amount, subsidy_amount, final_amount)
    VALUES ('27212100005', 'monthly', v_route_supported_id, v_supported_monthly_final, 'Unpaid', 'Đơn demo vé tháng chưa thanh toán', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'single-route', 'month', v_supported_boarding_label, v_supported_alighting_label, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final);

    INSERT INTO tb_orders (student_code, ticket_type, route_id, total, payment_status, name, paid_at, created_at, updated_at, order_mode, ticket_period, origin_label, destination_label, original_amount, subsidy_amount, final_amount)
    VALUES ('27211200003', 'monthly', v_route_supported_id, v_supported_monthly_final, 'Paid', 'Đơn demo vé tháng đã thanh toán', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, 'single-route', 'month', v_supported_boarding_label, v_supported_alighting_label, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final)
    RETURNING id INTO v_order_id;

    INSERT INTO tb_transactions (sepay_transaction_id, gateway, transaction_date, amount_in, amount_out, accumulated, code, transaction_content, reference_number, body, raw_payload, matched_order_id, created_at)
    VALUES (9000008001, 'SEPAY', CURRENT_TIMESTAMP - INTERVAL '1 day', v_supported_monthly_final, 0, v_supported_monthly_final, 'DEMOPAID', 'Giao dịch demo đã khớp', 'DEMO-REF-PAID', 'Nội dung giao dịch demo', '{"source":"DEMO_DATA"}'::jsonb, v_order_id, CURRENT_TIMESTAMP - INTERVAL '1 day')
    ON CONFLICT (sepay_transaction_id) DO UPDATE
    SET gateway = EXCLUDED.gateway,
        transaction_date = EXCLUDED.transaction_date,
        amount_in = EXCLUDED.amount_in,
        transaction_content = EXCLUDED.transaction_content,
        matched_order_id = EXCLUDED.matched_order_id,
        raw_payload = EXCLUDED.raw_payload;

    INSERT INTO notifications (recipient_user_id, sender_user_id, title, content, notification_type, is_read, sent_at)
    SELECT u.user_id, v_admin_user_id, 'Dữ liệu demo sẵn sàng', 'Kịch bản demo đã sẵn sàng đến 31/08/2026.', 'SYSTEM', false, CURRENT_TIMESTAMP
    FROM users u
    WHERE u.email IN (
        'student.fullprice@unibus.local',
        'student.monthly@unibus.local',
        'student.day@unibus.local',
        'student.unpaid@unibus.local',
        'student.history@unibus.local',
        'driver.demo@unibus.local',
        'conductor.demo@unibus.local',
        'dispatcher.demo@unibus.local',
        'uniadmin.demo@unibus.local'
    )
    AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.recipient_user_id = u.user_id
          AND n.title = 'Dữ liệu demo sẵn sàng'
          AND n.content LIKE 'Kịch bản demo đã sẵn sàng%'
    );
END $$;


-- Production-like deterministic baseline for DTU, UTE, VKU and FPT.
DO $baseline$
DECLARE
    v_password_hash text := '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu';
    v_admin_user_id integer;
    v_dtu_id integer;
    v_old_campus_id integer;
    v_main_campus_id integer;
    v_school record;
    v_account record;
    v_student_code text;
    v_student_codes text[];
    v_names text[] := ARRAY[
        'Nguyễn Minh Anh', 'Trần Gia Bảo', 'Lê Hoàng Nam', 'Phạm Thu Trang', 'Võ Quốc Huy',
        'Đặng Ngọc Hà', 'Bùi Thanh Tùng', 'Đỗ Khánh Linh', 'Phan Đức Anh', 'Hồ Mai Phương',
        'Nguyễn Nhật Minh', 'Trần Bảo Châu', 'Lê Quốc Khánh', 'Võ Thảo Vy', 'Phạm Minh Khang'
    ];
    v_faculties text[];
    v_route_id integer;
    v_boarding_id integer;
    v_alighting_id integer;
    v_boarding_name text;
    v_alighting_name text;
    v_policy_id integer;
    v_monthly_amount numeric;
    v_single_amount numeric;
    v_original numeric;
    v_subsidy numeric;
    v_final numeric;
    v_ticket_type text;
    v_payment_status text;
    v_order_id bigint;
    v_ticket_id integer;
    v_payment_id integer;
    v_trip_id integer;
    v_conductor_id integer;
    v_registration_id integer;
    v_ticket_status text;
    v_i integer;
    v_student_index integer;
    v_baseline_student_emails text[] := ARRAY[
        'student.supported@unibus.local', 'student.fullprice@unibus.local',
        'student.monthly@unibus.local', 'student.day@unibus.local',
        'student.unpaid@unibus.local', 'student.history@unibus.local',
        'student.ute.monthly@unibus.local', 'student.ute.single@unibus.local',
        'student.ute.unpaid@unibus.local', 'student.ute.history@unibus.local',
        'student.vku.monthly@unibus.local', 'student.vku.single@unibus.local',
        'student.vku.unpaid@unibus.local', 'student.vku.history@unibus.local',
        'student.fpt.monthly@unibus.local', 'student.fpt.single@unibus.local',
        'student.fpt.unpaid@unibus.local', 'student.fpt.history@unibus.local'
    ];
BEGIN
    SELECT user_id INTO v_admin_user_id FROM users WHERE email = 'admin.demo@unibus.local';
    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Missing admin.demo@unibus.local before production baseline extension.';
    END IF;

    INSERT INTO users (email, password_hash, full_name, phone_number, role, status, email_verified_at, student_verification_status, created_at, updated_at)
    VALUES
        ('admin.operations.demo@unibus.local', v_password_hash, 'Nguyễn Hoàng Nam', '0910000001', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('finance.dtu.demo@unibus.local', v_password_hash, 'Trần Ngọc Mai', '0910000002', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('uniadmin.ute.demo@unibus.local', v_password_hash, 'Nguyễn Thị Minh Châu', '0910000003', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('finance.ute.demo@unibus.local', v_password_hash, 'Lê Quốc Anh', '0910000004', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('uniadmin.vku.demo@unibus.local', v_password_hash, 'Phạm Khánh Linh', '0910000005', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('finance.vku.demo@unibus.local', v_password_hash, 'Đỗ Thành Công', '0910000006', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('uniadmin.fpt.demo@unibus.local', v_password_hash, 'Vũ Ngọc Hà', '0910000007', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('finance.fpt.demo@unibus.local', v_password_hash, 'Nguyễn Đức Long', '0910000008', 'UNIVERSITY_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('dispatcher.morning.demo@unibus.local', v_password_hash, 'Bùi Minh Tuấn', '0910000009', 'DISPATCHER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('dispatcher.evening.demo@unibus.local', v_password_hash, 'Nguyễn Thanh Phong', '0910000010', 'DISPATCHER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('driver.02.demo@unibus.local', v_password_hash, 'Trần Quốc Việt', '0910000011', 'DRIVER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('driver.03.demo@unibus.local', v_password_hash, 'Võ Anh Khoa', '0910000012', 'DRIVER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('driver.04.demo@unibus.local', v_password_hash, 'Lê Đức Thành', '0910000013', 'DRIVER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('driver.05.demo@unibus.local', v_password_hash, 'Phan Hoàng Long', '0910000014', 'DRIVER', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conductor.02.demo@unibus.local', v_password_hash, 'Nguyễn Mỹ Linh', '0910000015', 'CONDUCTOR', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conductor.03.demo@unibus.local', v_password_hash, 'Đỗ Minh Anh', '0910000016', 'CONDUCTOR', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('conductor.04.demo@unibus.local', v_password_hash, 'Võ Thanh Hà', '0910000017', 'CONDUCTOR', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.ute.monthly@unibus.local', v_password_hash, 'Nguyễn Thảo Vy', '0910000021', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.ute.single@unibus.local', v_password_hash, 'Lê Minh Hoàng', '0910000022', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.ute.unpaid@unibus.local', v_password_hash, 'Trần Gia Bảo', '0910000023', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.ute.history@unibus.local', v_password_hash, 'Phạm Ngọc Anh', '0910000024', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.vku.monthly@unibus.local', v_password_hash, 'Võ Khánh Duy', '0910000025', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.vku.single@unibus.local', v_password_hash, 'Nguyễn Hà My', '0910000026', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.vku.unpaid@unibus.local', v_password_hash, 'Lê Trung Kiên', '0910000027', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.vku.history@unibus.local', v_password_hash, 'Đặng Thu Trang', '0910000028', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.fpt.monthly@unibus.local', v_password_hash, 'Phan Minh Đức', '0910000029', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.fpt.single@unibus.local', v_password_hash, 'Trần Bảo Ngọc', '0910000030', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.fpt.unpaid@unibus.local', v_password_hash, 'Nguyễn Quốc Hưng', '0910000031', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('student.fpt.history@unibus.local', v_password_hash, 'Lê Hoài An', '0910000032', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        email_verified_at = EXCLUDED.email_verified_at,
        student_verification_status = EXCLUDED.student_verification_status,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO universities (code, name, short_name, status)
    VALUES
        ('DTU', 'Trường Đại học Duy Tân', 'DTU', 'ACTIVE'),
        ('UTE', 'Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng', 'UTE', 'ACTIVE'),
        ('VKU', 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'VKU', 'ACTIVE'),
        ('FPTDN', 'Trường Đại học FPT Đà Nẵng', 'FPT', 'ACTIVE')
    ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name, short_name = EXCLUDED.short_name, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP;

    INSERT INTO campuses (university_id, code, name, address, status, created_at, updated_at)
    SELECT university_id, campus_code, campus_name, campus_address, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM universities u
    JOIN (VALUES
        ('DTU', 'DTU_MAIN', 'Cơ sở Nguyễn Văn Linh', '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng'),
        ('UTE', 'UTE_MAIN', 'Cơ sở Cao Thắng', '48 Cao Thắng, Hải Châu, Đà Nẵng'),
        ('VKU', 'VKU_MAIN', 'Cơ sở Ngũ Hành Sơn', '470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng'),
        ('FPTDN', 'FPTDN_MAIN', 'Cơ sở FPT City', 'Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng')
    ) payload(university_code, campus_code, campus_name, campus_address) ON payload.university_code = u.code
    ON CONFLICT (university_id, code) DO UPDATE
    SET name = EXCLUDED.name, address = EXCLUDED.address, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP;

    SELECT university_id INTO v_dtu_id FROM universities WHERE code = 'DTU';
    SELECT campus_id INTO v_main_campus_id FROM campuses WHERE university_id = v_dtu_id AND code = 'DTU_MAIN';
    UPDATE campuses
    SET latitude = 16.0600568, longitude = 108.2096704, updated_at = CURRENT_TIMESTAMP
    WHERE campus_id = v_main_campus_id;
    SELECT campus_id INTO v_old_campus_id FROM campuses WHERE university_id = v_dtu_id AND code = 'DTU_DEMO_MAIN';
    IF v_old_campus_id IS NOT NULL AND v_old_campus_id <> v_main_campus_id THEN
        UPDATE route_universities SET campus_id = v_main_campus_id, updated_at = CURRENT_TIMESTAMP WHERE campus_id = v_old_campus_id;
        UPDATE subsidy_policies SET campus_id = v_main_campus_id, updated_at = CURRENT_TIMESTAMP WHERE campus_id = v_old_campus_id;
        DELETE FROM campuses WHERE campus_id = v_old_campus_id;
    END IF;

    UPDATE university_domains d
    SET university_id = u.university_id, status = 'ACTIVE', verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    FROM universities u
    JOIN (VALUES
        ('DTU', 'dtu.edu.vn'), ('DTU', 'duytan.edu.vn'),
        ('UTE', 'ute.udn.vn'), ('VKU', 'vku.udn.vn'), ('FPTDN', 'fpt.edu.vn')
    ) payload(university_code, domain) ON payload.university_code = u.code
    WHERE lower(d.domain) = lower(payload.domain);

    INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
    SELECT u.university_id, payload.domain, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM universities u
    JOIN (VALUES
        ('DTU', 'dtu.edu.vn'), ('DTU', 'duytan.edu.vn'),
        ('UTE', 'ute.udn.vn'), ('VKU', 'vku.udn.vn'), ('FPTDN', 'fpt.edu.vn')
    ) payload(university_code, domain) ON payload.university_code = u.code
    WHERE NOT EXISTS (SELECT 1 FROM university_domains d WHERE lower(d.domain) = lower(payload.domain));

    FOR v_account IN
        SELECT * FROM (VALUES
            ('uniadmin.demo@unibus.local', 'DTU', 'Quản trị viên trường'),
            ('finance.dtu.demo@unibus.local', 'DTU', 'Chuyên viên tài chính'),
            ('uniadmin.ute.demo@unibus.local', 'UTE', 'Quản trị viên trường'),
            ('finance.ute.demo@unibus.local', 'UTE', 'Chuyên viên tài chính'),
            ('uniadmin.vku.demo@unibus.local', 'VKU', 'Quản trị viên trường'),
            ('finance.vku.demo@unibus.local', 'VKU', 'Chuyên viên tài chính'),
            ('uniadmin.fpt.demo@unibus.local', 'FPTDN', 'Quản trị viên trường'),
            ('finance.fpt.demo@unibus.local', 'FPTDN', 'Chuyên viên tài chính')
        ) x(email, university_code, title)
    LOOP
        INSERT INTO university_admins (user_id, university_id, status, permissions, title, assigned_at, assigned_by_user_id, updated_at)
        SELECT usr.user_id, uni.university_id, 'ACTIVE', 'ROSTER,FINANCE,SUBSIDY', v_account.title, CURRENT_TIMESTAMP, v_admin_user_id, CURRENT_TIMESTAMP
        FROM users usr CROSS JOIN universities uni
        WHERE usr.email = v_account.email AND uni.code = v_account.university_code
        ON CONFLICT (user_id) DO UPDATE
        SET university_id = EXCLUDED.university_id,
            status = 'ACTIVE',
            permissions = EXCLUDED.permissions,
            title = EXCLUDED.title,
            assigned_at = EXCLUDED.assigned_at,
            assigned_by_user_id = EXCLUDED.assigned_by_user_id,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;

    INSERT INTO students (student_code, user_id, university, faculty, academic_year, date_of_birth, university_id)
    SELECT payload.student_code, usr.user_id, uni.name, payload.faculty, payload.academic_year, payload.date_of_birth, uni.university_id
    FROM (VALUES
        ('2411505001', 'student.ute.monthly@unibus.local', 'UTE', 'Công nghệ thông tin', 2024, DATE '2006-03-12'),
        ('2411505002', 'student.ute.single@unibus.local', 'UTE', 'Cơ khí', 2024, DATE '2006-07-21'),
        ('2411505003', 'student.ute.unpaid@unibus.local', 'UTE', 'Điện - Điện tử', 2023, DATE '2005-10-08'),
        ('2411505004', 'student.ute.history@unibus.local', 'UTE', 'Công nghệ ô tô', 2022, DATE '2004-05-17'),
        ('24ITB001', 'student.vku.monthly@unibus.local', 'VKU', 'Công nghệ thông tin', 2024, DATE '2006-01-14'),
        ('24ITB002', 'student.vku.single@unibus.local', 'VKU', 'Khoa học dữ liệu', 2024, DATE '2006-09-26'),
        ('24ITB003', 'student.vku.unpaid@unibus.local', 'VKU', 'Trí tuệ nhân tạo', 2023, DATE '2005-06-11'),
        ('24ITB004', 'student.vku.history@unibus.local', 'VKU', 'Thiết kế số', 2022, DATE '2004-12-03'),
        ('DE210001', 'student.fpt.monthly@unibus.local', 'FPTDN', 'Kỹ thuật phần mềm', 2024, DATE '2006-04-18'),
        ('DE210002', 'student.fpt.single@unibus.local', 'FPTDN', 'Trí tuệ nhân tạo', 2024, DATE '2006-08-09'),
        ('DE210003', 'student.fpt.unpaid@unibus.local', 'FPTDN', 'An toàn thông tin', 2023, DATE '2005-02-22'),
        ('DE210004', 'student.fpt.history@unibus.local', 'FPTDN', 'Kinh doanh số', 2022, DATE '2004-11-15')
    ) payload(student_code, email, university_code, faculty, academic_year, date_of_birth)
    JOIN users usr ON usr.email = payload.email
    JOIN universities uni ON uni.code = payload.university_code
    ON CONFLICT (student_code) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        university = EXCLUDED.university,
        faculty = EXCLUDED.faculty,
        academic_year = EXCLUDED.academic_year,
        date_of_birth = EXCLUDED.date_of_birth,
        university_id = EXCLUDED.university_id;

    DELETE FROM university_student_rosters usr
    USING universities uni
    WHERE uni.university_id = usr.university_id
      AND uni.code IN ('DTU', 'UTE', 'VKU', 'FPTDN')
      AND (
          usr.email LIKE lower(uni.code) || '.student%@demo.unibus.local'
          OR usr.email LIKE 'student.' || lower(CASE WHEN uni.code = 'FPTDN' THEN 'fpt' ELSE uni.code END) || '.%@unibus.local'
      );

    FOR v_school IN
        SELECT * FROM (VALUES
            ('DTU', 7, ARRAY['Công nghệ thông tin','Kỹ thuật phần mềm','Du lịch','Tài chính','Logistics']::text[]),
            ('UTE', 1, ARRAY['Công nghệ thông tin','Cơ khí','Điện - Điện tử','Xây dựng','Công nghệ ô tô']::text[]),
            ('VKU', 1, ARRAY['Công nghệ thông tin','Khoa học dữ liệu','Trí tuệ nhân tạo','Thiết kế số','Quản trị kinh doanh']::text[]),
            ('FPTDN', 1, ARRAY['Kỹ thuật phần mềm','Trí tuệ nhân tạo','An toàn thông tin','Kinh doanh số','Thiết kế mỹ thuật số']::text[])
        ) x(code, start_no, faculties)
    LOOP
        v_faculties := v_school.faculties;
        FOR v_i IN v_school.start_no..15 LOOP
            v_student_code := CASE v_school.code
                WHEN 'DTU' THEN (27211200000 + v_i)::text
                WHEN 'UTE' THEN (2411505000 + v_i)::text
                WHEN 'VKU' THEN '24ITB' || lpad(v_i::text, 3, '0')
                ELSE 'DE21' || lpad(v_i::text, 4, '0')
            END;

            INSERT INTO university_student_rosters (university_id, student_code, full_name, email, status, faculty, academic_year, matched_user_id, created_at, updated_at)
            SELECT uni.university_id,
                   v_student_code,
                   COALESCE(usr.full_name, v_names[v_i]),
                   COALESCE(usr.email, lower(v_school.code) || '.student' || lpad(v_i::text, 2, '0') || '@demo.unibus.local'),
                   CASE WHEN v_i <= 12 THEN 'ACTIVE' WHEN v_i = 13 THEN 'INACTIVE' WHEN v_i = 14 THEN 'GRADUATED' ELSE 'SUSPENDED' END,
                   v_faculties[1 + ((v_i - 1) % cardinality(v_faculties))],
                   2021 + ((v_i - 1) % 5),
                   usr.user_id,
                   CURRENT_TIMESTAMP,
                   CURRENT_TIMESTAMP
            FROM universities uni
            LEFT JOIN students st ON st.student_code = v_student_code
            LEFT JOIN users usr ON usr.user_id = st.user_id
            WHERE uni.code = v_school.code
            ON CONFLICT (university_id, student_code) DO UPDATE
            SET full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                status = EXCLUDED.status,
                faculty = EXCLUDED.faculty,
                academic_year = EXCLUDED.academic_year,
                matched_user_id = EXCLUDED.matched_user_id,
                updated_at = CURRENT_TIMESTAMP;
        END LOOP;
    END LOOP;

    INSERT INTO drivers (user_id, license_number, years_experience, average_rating, work_status)
    SELECT usr.user_id, payload.license_number, payload.experience, payload.rating, 'READY'
    FROM users usr
    JOIN (VALUES
        ('driver.02.demo@unibus.local', 'DRV-DEMO-02', 5, 4.70::numeric),
        ('driver.03.demo@unibus.local', 'DRV-DEMO-03', 8, 4.85::numeric),
        ('driver.04.demo@unibus.local', 'DRV-DEMO-04', 4, 4.60::numeric),
        ('driver.05.demo@unibus.local', 'DRV-DEMO-05', 7, 4.90::numeric)
    ) payload(email, license_number, experience, rating) ON payload.email = usr.email
    ON CONFLICT (user_id) DO UPDATE
    SET license_number = EXCLUDED.license_number,
        years_experience = EXCLUDED.years_experience,
        average_rating = EXCLUDED.average_rating,
        work_status = 'READY';

    INSERT INTO conductors (user_id, employee_code)
    SELECT usr.user_id, payload.employee_code
    FROM users usr
    JOIN (VALUES
        ('conductor.02.demo@unibus.local', 'CND-DEMO-02'),
        ('conductor.03.demo@unibus.local', 'CND-DEMO-03'),
        ('conductor.04.demo@unibus.local', 'CND-DEMO-04')
    ) payload(email, employee_code) ON payload.email = usr.email
    ON CONFLICT (user_id) DO UPDATE SET employee_code = EXCLUDED.employee_code;

    INSERT INTO dispatchers (user_id, employee_code, department)
    SELECT usr.user_id, payload.employee_code, payload.department
    FROM users usr
    JOIN (VALUES
        ('dispatcher.morning.demo@unibus.local', 'DSP-DEMO-02', 'Điều phối ca sáng'),
        ('dispatcher.evening.demo@unibus.local', 'DSP-DEMO-03', 'Điều phối ca chiều')
    ) payload(email, employee_code, department) ON payload.email = usr.email
    ON CONFLICT (user_id) DO UPDATE
    SET employee_code = EXCLUDED.employee_code, department = EXCLUDED.department;

    UPDATE dispatchers SET employee_code = 'DSP-DEMO-01', department = 'Điều phối tổng' WHERE user_id = (SELECT user_id FROM users WHERE email = 'dispatcher.demo@unibus.local');
    UPDATE conductors SET employee_code = 'CND-DEMO-01' WHERE user_id = (SELECT user_id FROM users WHERE email = 'conductor.demo@unibus.local');
    UPDATE drivers SET license_number = 'DRV-DEMO-01' WHERE user_id = (SELECT user_id FROM users WHERE email = 'driver.demo@unibus.local');

    DELETE FROM bus_schedules bs
    USING buses b
    WHERE bs.bus_id = b.bus_id
      AND b.license_plate BETWEEN '43B-82001' AND '43B-82012'
      AND bs.assigned_by_user_id = v_admin_user_id;

    DELETE FROM drivers
    WHERE user_id = (SELECT user_id FROM users WHERE email = 'fleet.simulator@unibus.local')
      AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = drivers.driver_id)
      AND NOT EXISTS (SELECT 1 FROM bus_schedules bs WHERE bs.driver_id = drivers.driver_id);
    DELETE FROM users
    WHERE email = 'fleet.simulator@unibus.local'
      AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = users.user_id);

    WITH fleet_plan(fleet_no, route_code, driver_email, conductor_email, offset_minutes, is_running) AS (
        VALUES
            (1, '02', 'driver.02.demo@unibus.local', 'conductor.02.demo@unibus.local', -15, true),
            (2, '12', 'driver.03.demo@unibus.local', 'conductor.03.demo@unibus.local', -10, true),
            (3, '02', 'driver.04.demo@unibus.local', 'conductor.04.demo@unibus.local', -5, true),
            (4, '12', 'driver.demo@unibus.local', 'conductor.demo@unibus.local', 10, false),
            (5, '01', 'driver.05.demo@unibus.local', 'conductor.02.demo@unibus.local', 25, false),
            (6, '03', 'driver.02.demo@unibus.local', 'conductor.03.demo@unibus.local', 40, false),
            (7, '05', 'driver.03.demo@unibus.local', 'conductor.04.demo@unibus.local', 55, false),
            (8, '06', 'driver.04.demo@unibus.local', 'conductor.02.demo@unibus.local', 70, false),
            (9, '07', 'driver.05.demo@unibus.local', 'conductor.03.demo@unibus.local', 85, false),
            (10, '16', 'driver.02.demo@unibus.local', 'conductor.04.demo@unibus.local', 100, false),
            (11, '12', 'driver.03.demo@unibus.local', 'conductor.02.demo@unibus.local', 115, false),
            (12, '02', 'driver.04.demo@unibus.local', 'conductor.03.demo@unibus.local', 130, false)
    ), fleet_clock AS (
        SELECT local_now, date_trunc('day', local_now) AS day_start
        FROM (SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh' AS local_now) clock
    ), fleet_assignments AS (
        SELECT fp.fleet_no, fp.is_running, r.route_id, b.bus_id, d.driver_id, c.conductor_id,
               date_trunc('minute', LEAST(
                   fc.day_start + INTERVAL '23 hours 59 minutes',
                   GREATEST(fc.day_start, fc.local_now + make_interval(mins => fp.offset_minutes))
               )) AS scheduled_at
        FROM fleet_plan fp
        CROSS JOIN fleet_clock fc
        JOIN LATERAL (
            SELECT route_id FROM routes
            WHERE route_code = fp.route_code AND status = 'ACTIVE' AND COALESCE(external_source, '') = 'BUSMAP_DN'
            ORDER BY route_id LIMIT 1
        ) r ON true
        JOIN buses b ON b.license_plate = '43B-' || (82000 + fp.fleet_no)::text
        JOIN users du ON du.email = fp.driver_email
        JOIN drivers d ON d.user_id = du.user_id
        JOIN users cu ON cu.email = fp.conductor_email
        JOIN conductors c ON c.user_id = cu.user_id
    )
    INSERT INTO bus_schedules (route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, end_time, status, assigned_by_user_id, assigned_at)
    SELECT route_id, bus_id, driver_id, conductor_id,
           EXTRACT(ISODOW FROM CURRENT_DATE)::int,
           scheduled_at::time,
           (scheduled_at + INTERVAL '60 minutes')::time,
           'ACTIVE', v_admin_user_id, CURRENT_TIMESTAMP
    FROM fleet_assignments;

    WITH fleet_plan(fleet_no, route_code, driver_email, conductor_email, offset_minutes, is_running) AS (
        VALUES
            (1, '02', 'driver.02.demo@unibus.local', 'conductor.02.demo@unibus.local', -15, true),
            (2, '12', 'driver.03.demo@unibus.local', 'conductor.03.demo@unibus.local', -10, true),
            (3, '02', 'driver.04.demo@unibus.local', 'conductor.04.demo@unibus.local', -5, true),
            (4, '12', 'driver.demo@unibus.local', 'conductor.demo@unibus.local', 10, false),
            (5, '01', 'driver.05.demo@unibus.local', 'conductor.02.demo@unibus.local', 25, false),
            (6, '03', 'driver.02.demo@unibus.local', 'conductor.03.demo@unibus.local', 40, false),
            (7, '05', 'driver.03.demo@unibus.local', 'conductor.04.demo@unibus.local', 55, false),
            (8, '06', 'driver.04.demo@unibus.local', 'conductor.02.demo@unibus.local', 70, false),
            (9, '07', 'driver.05.demo@unibus.local', 'conductor.03.demo@unibus.local', 85, false),
            (10, '16', 'driver.02.demo@unibus.local', 'conductor.04.demo@unibus.local', 100, false),
            (11, '12', 'driver.03.demo@unibus.local', 'conductor.02.demo@unibus.local', 115, false),
            (12, '02', 'driver.04.demo@unibus.local', 'conductor.03.demo@unibus.local', 130, false)
    ), fleet_clock AS (
        SELECT local_now, date_trunc('day', local_now) AS day_start
        FROM (SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh' AS local_now) clock
    ), fleet_assignments AS (
        SELECT fp.fleet_no, fp.is_running, r.route_id, b.bus_id, d.driver_id, c.conductor_id,
               date_trunc('minute', LEAST(
                   fc.day_start + INTERVAL '23 hours 59 minutes',
                   GREATEST(fc.day_start, fc.local_now + make_interval(mins => fp.offset_minutes))
               )) AS scheduled_at
        FROM fleet_plan fp
        CROSS JOIN fleet_clock fc
        JOIN LATERAL (
            SELECT route_id FROM routes
            WHERE route_code = fp.route_code AND status = 'ACTIVE' AND COALESCE(external_source, '') = 'BUSMAP_DN'
            ORDER BY route_id LIMIT 1
        ) r ON true
        JOIN buses b ON b.license_plate = '43B-' || (82000 + fp.fleet_no)::text
        JOIN users du ON du.email = fp.driver_email
        JOIN drivers d ON d.user_id = du.user_id
        JOIN users cu ON cu.email = fp.conductor_email
        JOIN conductors c ON c.user_id = cu.user_id
    )
    INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
    SELECT bs.schedule_id, fa.route_id, fa.bus_id, fa.driver_id, fa.conductor_id, CURRENT_DATE,
           CASE WHEN fa.is_running THEN fa.scheduled_at ELSE NULL END,
           NULL,
           CASE WHEN fa.is_running THEN 'RUNNING' ELSE 'NOT_STARTED' END,
           'DEMO_FLEET vehicle ' || lpad(fa.fleet_no::text, 2, '0')
    FROM fleet_assignments fa
    JOIN bus_schedules bs ON bs.route_id = fa.route_id
        AND bs.bus_id = fa.bus_id
        AND bs.driver_id = fa.driver_id
        AND bs.conductor_id = fa.conductor_id
        AND bs.weekday_number = EXTRACT(ISODOW FROM CURRENT_DATE)::int
        AND bs.departure_time = fa.scheduled_at::time
        AND bs.assigned_by_user_id = v_admin_user_id;

    DELETE FROM subsidy_policies sp
    WHERE sp.policy_name IN ('dddd', 'UI QA Khanh student subsidy 25%')
      AND NOT EXISTS (SELECT 1 FROM monthly_passes mp WHERE mp.subsidy_policy_id = sp.subsidy_policy_id);

    FOR v_school IN
        SELECT * FROM (VALUES
            ('DTU', 'DTU_MAIN', '16', 50::numeric, 90000::numeric),
            ('UTE', 'UTE_MAIN', '11', 40::numeric, 70000::numeric),
            ('VKU', 'VKU_MAIN', '02', 35::numeric, 60000::numeric),
            ('FPTDN', 'FPTDN_MAIN', 'N1', 25::numeric, 50000::numeric)
        ) x(code, campus_code, primary_route_code, subsidy_percent, max_amount)
    LOOP
        SELECT route_id INTO v_route_id FROM routes WHERE route_code = v_school.primary_route_code AND status = 'ACTIVE' ORDER BY route_id LIMIT 1;
        SELECT campus_id INTO v_main_campus_id FROM campuses c JOIN universities u ON u.university_id = c.university_id WHERE u.code = v_school.code AND c.code = v_school.campus_code;
        IF v_route_id IS NULL OR v_main_campus_id IS NULL THEN
            RAISE EXCEPTION 'Missing active route/campus for university %.', v_school.code;
        END IF;

        UPDATE route_universities
        SET campus_id = v_main_campus_id, active_from = DATE '2026-01-01', active_until = DATE '2026-12-31', status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
        WHERE route_id = v_route_id AND university_id = (SELECT university_id FROM universities WHERE code = v_school.code);
        IF NOT FOUND THEN
            INSERT INTO route_universities (route_id, university_id, campus_id, active_from, active_until, status, created_at, updated_at)
            SELECT v_route_id, university_id, v_main_campus_id, DATE '2026-01-01', DATE '2026-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM universities WHERE code = v_school.code;
        END IF;

        UPDATE subsidy_policies
        SET campus_id = CASE WHEN v_school.code = 'DTU' THEN NULL ELSE v_main_campus_id END,
            policy_name = 'DEMO_BASELINE: ' || v_school.code || ' active subsidy',
            subsidy_type = 'PERCENTAGE',
            value = v_school.subsidy_percent,
            max_amount = v_school.max_amount,
            active_from = DATE '2026-01-01',
            active_until = DATE '2026-12-31',
            status = 'ACTIVE',
            updated_at = CURRENT_TIMESTAMP
        WHERE subsidy_policy_id = (
            SELECT subsidy_policy_id FROM subsidy_policies
            WHERE university_id = (SELECT university_id FROM universities WHERE code = v_school.code)
              AND (policy_name = 'DEMO_BASELINE: ' || v_school.code || ' active subsidy'
                   OR (v_school.code = 'DTU' AND policy_name LIKE 'Demo trợ giá 50% đến%'))
            ORDER BY CASE WHEN policy_name = 'DEMO_BASELINE: ' || v_school.code || ' active subsidy' THEN 0 ELSE 1 END, subsidy_policy_id
            LIMIT 1
        );
        IF NOT FOUND THEN
            INSERT INTO subsidy_policies (university_id, campus_id, policy_name, subsidy_type, value, max_amount, active_from, active_until, status, created_at, updated_at)
            SELECT university_id, CASE WHEN v_school.code = 'DTU' THEN NULL ELSE v_main_campus_id END, 'DEMO_BASELINE: ' || v_school.code || ' active subsidy', 'PERCENTAGE', v_school.subsidy_percent, v_school.max_amount, DATE '2026-01-01', DATE '2026-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM universities WHERE code = v_school.code;
        END IF;

        UPDATE subsidy_policies
        SET campus_id = v_main_campus_id, subsidy_type = 'PERCENTAGE', value = GREATEST(v_school.subsidy_percent - 10, 10), max_amount = v_school.max_amount,
            active_from = DATE '2025-01-01', active_until = DATE '2025-12-31', status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
        WHERE university_id = (SELECT university_id FROM universities WHERE code = v_school.code)
          AND policy_name = 'DEMO_BASELINE: ' || v_school.code || ' historical subsidy';
        IF NOT FOUND THEN
            INSERT INTO subsidy_policies (university_id, campus_id, policy_name, subsidy_type, value, max_amount, active_from, active_until, status, created_at, updated_at)
            SELECT university_id, v_main_campus_id, 'DEMO_BASELINE: ' || v_school.code || ' historical subsidy', 'PERCENTAGE', GREATEST(v_school.subsidy_percent - 10, 10), v_school.max_amount, DATE '2025-01-01', DATE '2025-12-31', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM universities WHERE code = v_school.code;
        END IF;
    END LOOP;

    FOR v_school IN
        SELECT * FROM (VALUES
            ('DTU', 'DTU_MAIN', '12'),
            ('UTE', 'UTE_MAIN', '01'),
            ('VKU', 'VKU_MAIN', '16'),
            ('FPTDN', 'FPTDN_MAIN', '02')
        ) x(code, campus_code, secondary_route_code)
    LOOP
        SELECT route_id INTO v_route_id FROM routes WHERE route_code = v_school.secondary_route_code AND status = 'ACTIVE' ORDER BY route_id LIMIT 1;
        SELECT campus_id INTO v_main_campus_id FROM campuses c JOIN universities u ON u.university_id = c.university_id WHERE u.code = v_school.code AND c.code = v_school.campus_code;
        IF v_route_id IS NULL THEN
            RAISE EXCEPTION 'Missing secondary active route % for university %.', v_school.secondary_route_code, v_school.code;
        END IF;
        UPDATE route_universities
        SET campus_id = v_main_campus_id, active_from = DATE '2026-01-01', active_until = DATE '2026-12-31', status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
        WHERE route_id = v_route_id AND university_id = (SELECT university_id FROM universities WHERE code = v_school.code);
        IF NOT FOUND THEN
            INSERT INTO route_universities (route_id, university_id, campus_id, active_from, active_until, status, created_at, updated_at)
            SELECT v_route_id, university_id, v_main_campus_id, DATE '2026-01-01', DATE '2026-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM universities WHERE code = v_school.code;
        END IF;
    END LOOP;

    IF (SELECT count(*) FROM routes WHERE route_code IN ('12','11','02','N1') AND status = 'ACTIVE') <> 4 THEN
        RAISE EXCEPTION 'Production baseline requires active routes 12, 11, 02 and N1.';
    END IF;

    WITH route_plan(route_code, departure_time, slot_no) AS (
        VALUES ('12', TIME '06:30', 1), ('11', TIME '09:00', 2), ('02', TIME '14:00', 3), ('N1', TIME '17:30', 4)
    ),
    service_days AS (
        SELECT d::date AS service_date, row_number() OVER (ORDER BY d)::integer - 1 AS day_no
        FROM generate_series(CURRENT_DATE - 14, CURRENT_DATE + 7, INTERVAL '1 day') d
    ),
    pools AS (
        SELECT
            (SELECT array_agg(dr.driver_id ORDER BY usr.email) FROM drivers dr JOIN users usr ON usr.user_id = dr.user_id WHERE usr.email IN ('driver.demo@unibus.local','driver.02.demo@unibus.local','driver.03.demo@unibus.local','driver.04.demo@unibus.local','driver.05.demo@unibus.local')) AS driver_ids,
            (SELECT array_agg(cn.conductor_id ORDER BY usr.email) FROM conductors cn JOIN users usr ON usr.user_id = cn.user_id WHERE usr.email IN ('conductor.demo@unibus.local','conductor.02.demo@unibus.local','conductor.03.demo@unibus.local','conductor.04.demo@unibus.local')) AS conductor_ids,
            (SELECT array_agg(b.bus_id ORDER BY b.license_plate) FROM buses b WHERE b.license_plate = '43B-80808' OR b.license_plate LIKE '43B-82%') AS bus_ids
    ),
    planned AS (
        SELECT sd.service_date, sd.day_no, rp.route_code, rp.departure_time, rp.slot_no,
               (sd.day_no * 4 + rp.slot_no - 1) AS assignment_no
        FROM service_days sd CROSS JOIN route_plan rp
    ),
    resolved AS (
        SELECT p.*, r.route_id,
               pools.driver_ids[1 + (p.assignment_no % cardinality(pools.driver_ids))] AS driver_id,
               pools.conductor_ids[1 + (p.assignment_no % cardinality(pools.conductor_ids))] AS conductor_id,
               pools.bus_ids[1 + (p.assignment_no % cardinality(pools.bus_ids))] AS bus_id,
               CASE
                   WHEN p.service_date < CURRENT_DATE AND p.assignment_no % 11 = 0 THEN 'CANCELLED'
                   WHEN p.service_date < CURRENT_DATE THEN 'COMPLETED'
                   WHEN p.service_date = CURRENT_DATE AND p.departure_time < LOCALTIME - INTERVAL '2 hours' THEN 'COMPLETED'
                   WHEN p.service_date = CURRENT_DATE AND p.departure_time <= LOCALTIME AND p.slot_no = 1 THEN 'RUNNING'
                   ELSE 'NOT_STARTED'
               END AS trip_status
        FROM planned p JOIN routes r ON r.route_code = p.route_code AND r.status = 'ACTIVE' CROSS JOIN pools
    )
    INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
    SELECT NULL, route_id, bus_id, driver_id, conductor_id, service_date,
           CASE WHEN trip_status IN ('RUNNING','COMPLETED') THEN service_date + departure_time ELSE NULL END,
           CASE WHEN trip_status = 'COMPLETED' THEN service_date + departure_time + INTERVAL '90 minutes' ELSE NULL END,
           trip_status,
           'DEMO_DATA:BASELINE:' || route_code || ':' || service_date::text || ':' || slot_no::text
    FROM resolved;

    FOR v_school IN
        SELECT * FROM (VALUES
            ('UTE', '11', ARRAY['2411505001','2411505002','2411505003','2411505004']::text[], 40::numeric, 70000::numeric),
            ('VKU', '02', ARRAY['24ITB001','24ITB002','24ITB003','24ITB004']::text[], 35::numeric, 60000::numeric),
            ('FPTDN', 'N1', ARRAY['DE210001','DE210002','DE210003','DE210004']::text[], 25::numeric, 50000::numeric)
        ) x(code, route_code, student_codes, subsidy_percent, max_amount)
    LOOP
        v_student_codes := v_school.student_codes;
        SELECT route_id INTO v_route_id FROM routes WHERE route_code = v_school.route_code AND status = 'ACTIVE' ORDER BY route_id LIMIT 1;
        SELECT rs.stop_id INTO v_boarding_id FROM route_stops rs WHERE rs.route_id = v_route_id ORDER BY rs.stop_order ASC, rs.route_stop_id ASC OFFSET 1 LIMIT 1;
        SELECT rs.stop_id INTO v_alighting_id FROM route_stops rs WHERE rs.route_id = v_route_id ORDER BY rs.stop_order DESC, rs.route_stop_id DESC OFFSET 1 LIMIT 1;
        SELECT stop_name INTO v_boarding_name FROM stops WHERE stop_id = v_boarding_id;
        SELECT stop_name INTO v_alighting_name FROM stops WHERE stop_id = v_alighting_id;
        SELECT amount INTO v_monthly_amount FROM fares WHERE route_id = v_route_id AND fare_type = 'MONTHLY' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE) ORDER BY effective_from DESC, fare_id DESC LIMIT 1;
        SELECT amount INTO v_single_amount FROM fares WHERE route_id = v_route_id AND fare_type = 'SINGLE' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE) ORDER BY effective_from DESC, fare_id DESC LIMIT 1;
        SELECT subsidy_policy_id INTO v_policy_id FROM subsidy_policies WHERE university_id = (SELECT university_id FROM universities WHERE code = v_school.code) AND policy_name = 'DEMO_BASELINE: ' || v_school.code || ' active subsidy' AND status = 'ACTIVE' ORDER BY subsidy_policy_id LIMIT 1;
        IF v_route_id IS NULL OR v_boarding_id IS NULL OR v_alighting_id IS NULL OR v_boarding_id = v_alighting_id OR v_monthly_amount IS NULL OR v_single_amount IS NULL OR v_policy_id IS NULL THEN
            RAISE EXCEPTION 'Incomplete route/fare/policy data for university %.', v_school.code;
        END IF;

        FOREACH v_student_code IN ARRAY v_student_codes LOOP
            INSERT INTO route_registrations (student_code, route_id, boarding_stop_id, alighting_stop_id, registered_at, effective_date, status, approved_by_user_id, approved_at)
            VALUES (v_student_code, v_route_id, v_boarding_id, v_alighting_id, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_DATE - 9, 'APPROVED', v_admin_user_id, CURRENT_TIMESTAMP - INTERVAL '9 days');
        END LOOP;

        FOR v_i IN 1..12 LOOP
            v_student_index := 1 + ((v_i - 1) % 4);
            v_student_code := v_student_codes[v_student_index];
            v_ticket_type := CASE WHEN v_i IN (1,2,3,7,8,10,12) THEN 'monthly' ELSE 'single' END;
            v_payment_status := CASE WHEN v_i <= 6 THEN 'Paid' WHEN v_i <= 9 THEN 'Unpaid' WHEN v_i <= 11 THEN 'Cancelled' ELSE 'Refunded' END;
            v_original := CASE WHEN v_ticket_type = 'monthly' THEN v_monthly_amount ELSE v_single_amount END;
            v_subsidy := LEAST(round(v_original * v_school.subsidy_percent / 100), v_school.max_amount);
            v_final := GREATEST(v_original - v_subsidy, 0);

            INSERT INTO tb_orders (student_code, ticket_type, route_id, total, payment_status, name, paid_at, created_at, updated_at, order_mode, ticket_period, origin_label, destination_label, legs_json, original_amount, subsidy_amount, final_amount)
            VALUES (
                v_student_code,
                v_ticket_type,
                v_route_id,
                v_final,
                v_payment_status,
                'DEMO_BASELINE:' || v_school.code || ':ORDER:' || lpad(v_i::text, 2, '0'),
                CASE WHEN v_payment_status IN ('Paid','Refunded') THEN CURRENT_TIMESTAMP - (v_i || ' days')::interval ELSE NULL END,
                CURRENT_TIMESTAMP - (v_i || ' days')::interval,
                CURRENT_TIMESTAMP,
                'single-route',
                CASE WHEN v_ticket_type = 'monthly' THEN 'month' ELSE 'single' END,
                v_boarding_name,
                v_alighting_name,
                CASE WHEN v_ticket_type = 'single' THEN jsonb_build_object('boardingStopId', v_boarding_id, 'alightingStopId', v_alighting_id) ELSE NULL END,
                v_original,
                v_subsidy,
                v_final
            ) RETURNING id INTO v_order_id;

            IF v_payment_status = 'Paid' THEN
                IF v_ticket_type = 'monthly' THEN
                    v_ticket_status := CASE v_i WHEN 1 THEN 'ACTIVE' WHEN 2 THEN 'EXPIRED' ELSE 'CANCELLED' END;
                    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status)
                    VALUES (
                        v_student_code,
                        v_route_id,
                        EXTRACT(MONTH FROM CASE WHEN v_ticket_status = 'EXPIRED' THEN CURRENT_DATE - 60 ELSE CURRENT_DATE END)::int,
                        EXTRACT(YEAR FROM CASE WHEN v_ticket_status = 'EXPIRED' THEN CURRENT_DATE - 60 ELSE CURRENT_DATE END)::int,
                        CASE WHEN v_ticket_status = 'EXPIRED' THEN CURRENT_DATE - 60 ELSE date_trunc('month', CURRENT_DATE)::date END,
                        CURRENT_TIMESTAMP - (v_i || ' days')::interval,
                        CASE WHEN v_ticket_status = 'EXPIRED' THEN CURRENT_DATE - 1 ELSE DATE '2026-09-01' END,
                        v_final,
                        v_original,
                        v_subsidy,
                        v_final,
                        v_policy_id,
                        'DEMO-' || v_school.code || '-MONTH-' || v_i || '-' || v_student_code,
                        v_ticket_status
                    ) RETURNING monthly_pass_id INTO v_ticket_id;

                    INSERT INTO payments (student_code, amount, method, status, transaction_code, created_at, monthly_pass_id, notes)
                    VALUES (v_student_code, v_final, 'BANK_TRANSFER', 'PAID', 'DEMO-PAY-' || v_school.code || '-' || v_i, CURRENT_TIMESTAMP - (v_i || ' days')::interval, v_ticket_id, 'Thanh toán baseline vé tháng')
                    RETURNING payment_id INTO v_payment_id;
                ELSE
                    v_ticket_status := CASE v_i WHEN 4 THEN 'UNUSED' WHEN 5 THEN 'USED' ELSE 'EXPIRED' END;
                    v_trip_id := NULL;
                    v_conductor_id := NULL;
                    IF v_ticket_status = 'USED' THEN
                        SELECT trip_id, conductor_id INTO v_trip_id, v_conductor_id
                        FROM trips
                        WHERE route_id = v_route_id AND status = 'COMPLETED' AND conductor_id IS NOT NULL
                        ORDER BY service_date DESC, ended_at DESC NULLS LAST, trip_id DESC LIMIT 1;
                    END IF;

                    INSERT INTO single_trip_tickets (student_code, route_id, boarding_stop_id, alighting_stop_id, used_on_trip_id, fare_amount, qr_code, purchased_at, expires_at, last_scanned_at, scanned_by_conductor_id, status)
                    VALUES (
                        v_student_code,
                        v_route_id,
                        v_boarding_id,
                        v_alighting_id,
                        v_trip_id,
                        v_final,
                        'DEMO-' || v_school.code || '-SINGLE-' || v_i || '-' || v_student_code,
                        CASE WHEN v_ticket_status = 'EXPIRED' THEN CURRENT_TIMESTAMP - INTERVAL '2 days' ELSE CURRENT_TIMESTAMP - INTERVAL '2 hours' END,
                        CASE WHEN v_ticket_status = 'EXPIRED' THEN CURRENT_TIMESTAMP - INTERVAL '1 day' ELSE (CURRENT_DATE + 1)::timestamp - INTERVAL '1 second' END,
                        CASE WHEN v_ticket_status = 'USED' THEN CURRENT_TIMESTAMP - INTERVAL '1 hour' ELSE NULL END,
                        v_conductor_id,
                        v_ticket_status
                    ) RETURNING single_trip_ticket_id INTO v_ticket_id;

                    INSERT INTO payments (student_code, amount, method, status, transaction_code, created_at, single_trip_ticket_id, notes)
                    VALUES (v_student_code, v_final, 'BANK_TRANSFER', 'PAID', 'DEMO-PAY-' || v_school.code || '-' || v_i, CURRENT_TIMESTAMP - (v_i || ' hours')::interval, v_ticket_id, 'Thanh toán baseline vé lượt')
                    RETURNING payment_id INTO v_payment_id;
                END IF;

                INSERT INTO invoices (payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount, issued_at)
                VALUES (v_payment_id, v_student_code, CASE WHEN v_ticket_type = 'monthly' THEN 'Hóa đơn vé tháng' ELSE 'Hóa đơn vé lượt' END, v_final, v_original, v_subsidy, v_final, CURRENT_TIMESTAMP - (v_i || ' hours')::interval);

                INSERT INTO tb_transactions (sepay_transaction_id, gateway, transaction_date, amount_in, amount_out, accumulated, code, transaction_content, reference_number, body, raw_payload, matched_order_id, created_at)
                VALUES (
                    9100000000 + (CASE v_school.code WHEN 'UTE' THEN 100 WHEN 'VKU' THEN 200 ELSE 300 END) + v_i,
                    'SEPAY',
                    CURRENT_TIMESTAMP - (v_i || ' hours')::interval,
                    v_final,
                    0,
                    v_final,
                    'DEMO-' || v_school.code || '-' || v_i,
                    'DH' || v_order_id,
                    'DEMO-REF-' || v_school.code || '-' || v_i,
                    'Giao dịch baseline UniBus',
                    jsonb_build_object('source','DEMO_BASELINE','school',v_school.code,'orderId',v_order_id),
                    v_order_id,
                    CURRENT_TIMESTAMP - (v_i || ' hours')::interval
                )
                ON CONFLICT (sepay_transaction_id) DO UPDATE
                SET transaction_date = EXCLUDED.transaction_date,
                    amount_in = EXCLUDED.amount_in,
                    accumulated = EXCLUDED.accumulated,
                    transaction_content = EXCLUDED.transaction_content,
                    matched_order_id = EXCLUDED.matched_order_id,
                    raw_payload = EXCLUDED.raw_payload;
            END IF;
        END LOOP;

        FOREACH v_student_code IN ARRAY v_student_codes LOOP
            SELECT registration_id INTO v_registration_id FROM route_registrations WHERE student_code = v_student_code AND route_id = v_route_id ORDER BY registration_id DESC LIMIT 1;
            INSERT INTO travel_history (student_code, trip_id, registration_id, boarding_stop_id, alighting_stop_id, boarded_at, alighted_at, confirmation_method, confirmed_by_conductor_id)
            SELECT v_student_code, t.trip_id, v_registration_id, v_boarding_id, v_alighting_id,
                   t.departed_at + INTERVAL '10 minutes', t.departed_at + INTERVAL '70 minutes', 'QR_SCAN', t.conductor_id
            FROM trips t
            WHERE t.route_id = v_route_id AND t.status = 'COMPLETED' AND t.departed_at IS NOT NULL AND t.conductor_id IS NOT NULL
            ORDER BY t.service_date DESC, t.departed_at DESC
            LIMIT 2;
        END LOOP;
    END LOOP;

    INSERT INTO feedback (student_code, trip_id, content, star_rating, submitted_at, status, response, handled_by_user_id)
    SELECT ranked.student_code,
           ranked.trip_id,
           CASE ranked.row_no % 4
               WHEN 0 THEN 'Xe chạy đúng giờ, nhân viên hỗ trợ tốt.'
               WHEN 1 THEN 'Thông tin điểm đón rõ ràng và dễ theo dõi.'
               WHEN 2 THEN 'Mong tuyến duy trì tần suất ổn định vào giờ cao điểm.'
               ELSE 'Chuyến đi an toàn, trải nghiệm tổng thể tốt.'
           END,
           3 + (ranked.row_no % 3),
           CURRENT_TIMESTAMP - (ranked.row_no || ' hours')::interval,
           CASE ranked.row_no % 3 WHEN 0 THEN 'OPEN' WHEN 1 THEN 'IN_PROGRESS' ELSE 'RESOLVED' END,
           CASE WHEN ranked.row_no % 3 = 2 THEN 'Đã tiếp nhận và phản hồi cho sinh viên.' ELSE NULL END,
           CASE WHEN ranked.row_no % 3 = 2 THEN v_admin_user_id ELSE NULL END
    FROM (
        SELECT th.student_code, th.trip_id, row_number() OVER (ORDER BY th.boarded_at DESC NULLS LAST, th.travel_history_id DESC)::integer AS row_no
        FROM travel_history th
        JOIN students st ON st.student_code = th.student_code
        JOIN users usr ON usr.user_id = st.user_id
        WHERE usr.email = ANY(v_baseline_student_emails)
        LIMIT 18
    ) ranked;

    INSERT INTO lost_item_reports (reported_by_user_id, trip_id, item_description, reported_at, status, notes, assisted_by_user_id)
    SELECT ranked.user_id,
           ranked.trip_id,
           (ARRAY['Ví màu nâu','Bình nước màu xanh','Tai nghe không dây','Thẻ sinh viên','Áo khoác màu đen','Ô gấp màu xám','Sổ tay bìa xanh','Túi đựng laptop','Chìa khóa xe'])[ranked.row_no],
           CURRENT_TIMESTAMP - (ranked.row_no || ' days')::interval,
           CASE WHEN ranked.row_no <= 3 THEN 'REPORTED' WHEN ranked.row_no <= 5 THEN 'SEARCHING' WHEN ranked.row_no <= 7 THEN 'FOUND' ELSE 'NOT_FOUND' END,
           CASE WHEN ranked.row_no >= 6 THEN 'Đã cập nhật kết quả tìm kiếm.' ELSE NULL END,
           CASE WHEN ranked.row_no >= 4 THEN ranked.conductor_user_id ELSE NULL END
    FROM (
        SELECT st.user_id, th.trip_id, conductor_user.user_id AS conductor_user_id,
               row_number() OVER (ORDER BY th.travel_history_id DESC)::integer AS row_no
        FROM travel_history th
        JOIN students st ON st.student_code = th.student_code
        JOIN users student_user ON student_user.user_id = st.user_id
        JOIN trips t ON t.trip_id = th.trip_id
        LEFT JOIN conductors c ON c.conductor_id = t.conductor_id
        LEFT JOIN users conductor_user ON conductor_user.user_id = c.user_id
        WHERE student_user.email = ANY(v_baseline_student_emails)
        LIMIT 9
    ) ranked;

    INSERT INTO incidents (conductor_id, trip_id, incident_type, description, reported_at, status, resolution, handled_by_user_id)
    SELECT ranked.conductor_id,
           ranked.trip_id,
           (ARRAY['OVERCROWDED','EMERGENCY','TECHNICAL','OTHER'])[1 + ((ranked.row_no - 1) % 4)],
           CASE ranked.row_no % 4
               WHEN 0 THEN 'Lượng hành khách tăng cao tại giờ cao điểm.'
               WHEN 1 THEN 'Hành khách cần hỗ trợ y tế nhẹ trên xe.'
               WHEN 2 THEN 'Thiết bị cửa xe cần được kiểm tra.'
               ELSE 'Phát sinh tình huống vận hành cần ghi nhận.'
           END,
           COALESCE(ranked.departed_at, CURRENT_TIMESTAMP) + INTERVAL '20 minutes',
           CASE ranked.row_no % 3 WHEN 0 THEN 'NEW' WHEN 1 THEN 'IN_PROGRESS' ELSE 'RESOLVED' END,
           CASE WHEN ranked.row_no % 3 = 2 THEN 'Điều phối đã xử lý và đóng sự cố.' ELSE NULL END,
           CASE WHEN ranked.row_no % 3 = 2 THEN v_admin_user_id ELSE NULL END
    FROM (
        SELECT t.trip_id, t.conductor_id, t.departed_at,
               row_number() OVER (ORDER BY t.service_date DESC, t.trip_id DESC)::integer AS row_no
        FROM trips t
        WHERE t.notes LIKE 'DEMO_DATA:BASELINE:%' AND t.status = 'COMPLETED' AND t.conductor_id IS NOT NULL
        LIMIT 12
    ) ranked;

    DELETE FROM notifications WHERE title LIKE 'DEMO_BASELINE:%';
    INSERT INTO notifications (recipient_user_id, sender_user_id, title, content, notification_type, is_read, sent_at)
    SELECT usr.user_id,
           v_admin_user_id,
           CASE g.n WHEN 1 THEN 'DEMO_BASELINE: Lịch vận hành' ELSE 'DEMO_BASELINE: Cập nhật tài khoản' END,
           CASE g.n WHEN 1 THEN 'Lịch trình và dữ liệu demo đã được cập nhật.' ELSE 'Bạn có dữ liệu mới cần kiểm tra trên UniBus.' END,
           CASE g.n WHEN 1 THEN 'TRIP' ELSE 'SYSTEM' END,
           g.n = 1,
           CURRENT_TIMESTAMP - (g.n || ' hours')::interval
    FROM users usr
    CROSS JOIN generate_series(1, 2) g(n)
    WHERE usr.status = 'ACTIVE'
      AND (usr.email LIKE '%.demo@unibus.local' OR usr.email = ANY(v_baseline_student_emails))
      AND usr.email <> 'student.supported@unibus.local';
END
$baseline$;


COMMIT;
