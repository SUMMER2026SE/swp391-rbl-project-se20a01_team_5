-- Stable UniBus demo data until 2026-08-31.
-- Idempotent by design: master rows are upserted; generated demo scenario rows
-- with STABLE_DEMO markers are deleted and recreated.
-- Login password for created demo accounts: Password123!

BEGIN;

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
    v_bus_id integer;
    v_driver_user_id integer;
    v_conductor_user_id integer;
    v_dispatcher_user_id integer;
    v_driver_id integer;
    v_conductor_id integer;
    v_dispatcher_id integer;
    v_schedule_supported_id integer;
    v_schedule_full_id integer;
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
BEGIN
    IF CURRENT_DATE > v_end_date THEN
        RAISE NOTICE 'Demo end date % is already past current date %. Only account/master data will remain meaningful.', v_end_date, CURRENT_DATE;
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
        RAISE EXCEPTION 'Không tìm thấy Trường Đại học Duy Tân. Không tạo Đại học Demo UniBus làm trường chính.';
    END IF;

    v_supported_university_id := v_dtu_university_id;

    INSERT INTO campuses (university_id, code, name, address, latitude, longitude, status, created_at, updated_at)
    VALUES (v_supported_university_id, 'STABLE_MAIN', 'Cơ sở demo Duy Tân', 'Đà Nẵng', 16.0544, 108.2022, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (university_id, code) DO UPDATE
    SET name = EXCLUDED.name,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP;

    SELECT campus_id INTO v_supported_campus_id FROM campuses WHERE university_id = v_supported_university_id AND code = 'STABLE_MAIN';

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
    SET short_name = EXCLUDED.short_name,
        status = 'ACTIVE',
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
    SELECT u.university_id, payload.domain, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM (VALUES
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
    ) AS payload(university_name, domain)
    JOIN universities u ON u.name = payload.university_name
    ON CONFLICT (domain) DO UPDATE
    SET university_id = EXCLUDED.university_id,
        status = 'ACTIVE',
        verified_at = COALESCE(university_domains.verified_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO university_admins (user_id, university_id, status, permissions, title, assigned_at, assigned_by_user_id, updated_at)
    SELECT user_id, v_supported_university_id, 'ACTIVE', 'FINANCE,STUDENTS,REPORTS', 'Lê Thu Hà', CURRENT_TIMESTAMP, v_admin_user_id, CURRENT_TIMESTAMP
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
        ('SV-STABLE-SUB', 'student.supported@unibus.local', 'Trường Đại học Duy Tân', 'Công nghệ thông tin', 2023, '2005-03-10', v_supported_university_id),
        ('SV-STABLE-FULL', 'student.fullprice@unibus.local', 'Trường Đại học Duy Tân', 'Kinh tế', 2022, '2004-08-12', v_supported_university_id),
        ('SV-STABLE-MONTH', 'student.monthly@unibus.local', 'Trường Đại học Duy Tân', 'Kỹ thuật phần mềm', 2021, '2003-04-22', v_supported_university_id),
        ('SV-STABLE-DAY', 'student.day@unibus.local', 'Trường Đại học Duy Tân', 'Du lịch', 2024, '2006-01-19', v_supported_university_id),
        ('SV-STABLE-UNPAID', 'student.unpaid@unibus.local', 'Trường Đại học Duy Tân', 'Tài chính', 2023, '2005-05-05', v_supported_university_id),
        ('SV-STABLE-HIST', 'student.history@unibus.local', 'Trường Đại học Duy Tân', 'Logistics', 2022, '2004-11-30', v_supported_university_id)
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
      AND (s.student_code LIKE 'SV-STABLE-%' OR s.student_code = 'DTU202032312')
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

    SELECT route_id INTO v_route_supported_id
    FROM routes
    WHERE route_code = '12'
      AND status = 'ACTIVE'
      AND COALESCE(external_source, '') = 'BUSMAP_DN'
      AND (SELECT count(*) FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = routes.route_id) >= 2
    ORDER BY route_id
    LIMIT 1;

    IF v_route_supported_id IS NULL THEN
        SELECT route_id INTO v_route_supported_id
        FROM routes
        WHERE route_code IN ('01', '06')
          AND status = 'ACTIVE'
          AND COALESCE(external_source, '') = 'BUSMAP_DN'
          AND (SELECT count(*) FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = routes.route_id) >= 2
        ORDER BY CASE route_code WHEN '01' THEN 0 WHEN '06' THEN 1 ELSE 2 END, route_id
        LIMIT 1;
    END IF;

    IF v_route_supported_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy tuyến BUSMAP thật 12/01/06 đang hoạt động cho kịch bản trợ giá Duy Tân.';
    END IF;

    SELECT r.route_id INTO v_route_full_id
    FROM routes r
    WHERE r.route_code IN ('02', '16')
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
    ORDER BY CASE r.route_code WHEN '02' THEN 0 WHEN '16' THEN 1 ELSE 2 END, r.route_id
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
        RAISE EXCEPTION 'Stable demo không được dùng tuyến UB-DN-* làm kịch bản chính.';
    END IF;

    SELECT rs.stop_id INTO v_boarding_supported_id FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = v_route_supported_id ORDER BY rs.stop_order ASC LIMIT 1;
    SELECT rs.stop_id INTO v_alighting_supported_id FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = v_route_supported_id ORDER BY rs.stop_order DESC LIMIT 1;
    SELECT rs.stop_id INTO v_boarding_full_id FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = v_route_full_id ORDER BY rs.stop_order ASC LIMIT 1;
    SELECT rs.stop_id INTO v_alighting_full_id FROM route_stops rs JOIN stops st ON st.stop_id = rs.stop_id WHERE rs.route_id = v_route_full_id ORDER BY rs.stop_order DESC LIMIT 1;
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

    UPDATE route_universities
    SET status = 'INACTIVE', active_until = LEAST(COALESCE(active_until, CURRENT_DATE - 1), CURRENT_DATE - 1), updated_at = CURRENT_TIMESTAMP
    WHERE university_id = v_supported_university_id
      AND route_id <> v_route_supported_id
      AND status = 'ACTIVE'
      AND created_at >= DATE '2026-01-01';

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
    SELECT v_supported_university_id, v_supported_campus_id, 'Demo trợ giá 50% đến 31/08/2026', 'PERCENTAGE', 50, 90000, CURRENT_DATE, v_end_date, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
      AND policy_name IN ('Stable Demo 50% subsidy until Aug 2026', 'Demo trợ giá 50% đến 31/08/2026');

    UPDATE subsidy_policies
    SET campus_id = v_supported_campus_id, subsidy_type = 'PERCENTAGE', value = 50, max_amount = 90000, active_from = CURRENT_DATE, active_until = v_end_date, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
    WHERE subsidy_policy_id = v_policy_id;

    DELETE FROM travel_history
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE notes LIKE 'STABLE_DEMO%');

    UPDATE single_trip_tickets
    SET used_on_trip_id = NULL, scanned_by_conductor_id = NULL, status = 'UNUSED'
    WHERE student_code LIKE 'SV-STABLE-%'
      AND used_on_trip_id IN (SELECT trip_id FROM trips WHERE notes LIKE 'STABLE_DEMO%');

    DELETE FROM trips WHERE notes LIKE 'STABLE_DEMO%';
    DELETE FROM bus_schedules WHERE assigned_by_user_id = v_admin_user_id AND status = 'ACTIVE';

    INSERT INTO bus_schedules (route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, end_time, status, assigned_by_user_id, assigned_at)
    SELECT v_route_supported_id, v_bus_id, v_driver_id, v_conductor_id, weekday_number, TIME '07:30', TIME '08:30', 'ACTIVE', v_admin_user_id, CURRENT_TIMESTAMP
    FROM generate_series(1, 7) AS weekday_number;

    INSERT INTO bus_schedules (route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, end_time, status, assigned_by_user_id, assigned_at)
    SELECT v_route_full_id, v_bus_id, v_driver_id, v_conductor_id, weekday_number, TIME '17:30', TIME '18:30', 'ACTIVE', v_admin_user_id, CURRENT_TIMESTAMP
    FROM generate_series(1, 7) AS weekday_number;

    SELECT schedule_id INTO v_schedule_supported_id FROM bus_schedules WHERE route_id = v_route_supported_id AND assigned_by_user_id = v_admin_user_id AND departure_time = TIME '07:30' ORDER BY schedule_id DESC LIMIT 1;
    SELECT schedule_id INTO v_schedule_full_id FROM bus_schedules WHERE route_id = v_route_full_id AND assigned_by_user_id = v_admin_user_id AND departure_time = TIME '17:30' ORDER BY schedule_id DESC LIMIT 1;

    INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
    SELECT v_schedule_supported_id, v_route_supported_id, v_bus_id, v_driver_id, v_conductor_id, d::date,
           CASE WHEN d::date < CURRENT_DATE THEN d::date + TIME '07:30' ELSE NULL END,
           CASE WHEN d::date < CURRENT_DATE THEN d::date + TIME '08:25' ELSE NULL END,
           CASE WHEN d::date < CURRENT_DATE THEN 'COMPLETED' ELSE 'NOT_STARTED' END,
           'STABLE_DEMO supported morning trip'
    FROM generate_series(CURRENT_DATE, v_end_date, INTERVAL '1 day') AS d
    WHERE CURRENT_DATE <= v_end_date;

    INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, departed_at, ended_at, status, notes)
    SELECT v_schedule_full_id, v_route_full_id, v_bus_id, v_driver_id, v_conductor_id, d::date,
           NULL, NULL,
           CASE WHEN d::date = CURRENT_DATE THEN 'RUNNING' ELSE 'NOT_STARTED' END,
           'STABLE_DEMO full-price afternoon trip'
    FROM generate_series(CURRENT_DATE, v_end_date, INTERVAL '1 day') AS d
    WHERE CURRENT_DATE <= v_end_date;

    SELECT trip_id INTO v_trip_today_supported_id FROM trips WHERE notes = 'STABLE_DEMO supported morning trip' AND service_date = CURRENT_DATE ORDER BY trip_id LIMIT 1;
    SELECT trip_id INTO v_trip_today_full_id FROM trips WHERE notes = 'STABLE_DEMO full-price afternoon trip' AND service_date = CURRENT_DATE ORDER BY trip_id LIMIT 1;

    DELETE FROM invoices WHERE student_code LIKE 'SV-STABLE-%';
    DELETE FROM payments WHERE student_code LIKE 'SV-STABLE-%';
    DELETE FROM travel_history WHERE student_code LIKE 'SV-STABLE-%';
    DELETE FROM monthly_passes WHERE student_code LIKE 'SV-STABLE-%';
    DELETE FROM single_trip_tickets WHERE student_code LIKE 'SV-STABLE-%';
    DELETE FROM tb_transactions WHERE matched_order_id IN (SELECT id FROM tb_orders WHERE student_code LIKE 'SV-STABLE-%');
    DELETE FROM tb_orders WHERE student_code LIKE 'SV-STABLE-%';
    DELETE FROM route_registrations WHERE student_code LIKE 'SV-STABLE-%';

    FOR v_student IN
        SELECT student_code,
               CASE WHEN student_code = 'SV-STABLE-FULL' THEN v_route_full_id ELSE v_route_supported_id END AS route_id,
               CASE WHEN student_code = 'SV-STABLE-FULL' THEN v_boarding_full_id ELSE v_boarding_supported_id END AS boarding_stop_id,
               CASE WHEN student_code = 'SV-STABLE-FULL' THEN v_alighting_full_id ELSE v_alighting_supported_id END AS alighting_stop_id
        FROM students
        WHERE student_code LIKE 'SV-STABLE-%'
    LOOP
        INSERT INTO route_registrations (student_code, route_id, boarding_stop_id, alighting_stop_id, registered_at, effective_date, status, approved_by_user_id, approved_at)
        VALUES (v_student.student_code, v_student.route_id, v_student.boarding_stop_id, v_student.alighting_stop_id, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_DATE, 'APPROVED', v_admin_user_id, CURRENT_TIMESTAMP - INTERVAL '1 day');
    END LOOP;

    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status)
    VALUES ('SV-STABLE-MONTH', v_route_supported_id, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, date_trunc('month', CURRENT_DATE)::date, CURRENT_TIMESTAMP - INTERVAL '1 day', (v_end_date + INTERVAL '1 day')::date, v_supported_monthly_final, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final, v_policy_id, 'DEMO-MONTH-SV-STABLE-MONTH', 'ACTIVE')
    RETURNING monthly_pass_id INTO v_monthly_pass_id;

    INSERT INTO payments (student_code, amount, method, status, transaction_code, created_at, monthly_pass_id, notes)
    VALUES ('SV-STABLE-MONTH', 70000, 'BANK_TRANSFER', 'PAID', 'DEMO-PAY-MONTH', CURRENT_TIMESTAMP - INTERVAL '1 day', v_monthly_pass_id, 'Thanh toán demo vé tháng')
    RETURNING payment_id INTO v_payment_id;

    INSERT INTO invoices (payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount, issued_at)
    VALUES (v_payment_id, 'SV-STABLE-MONTH', 'Hóa đơn demo vé tháng', 70000, 140000, 70000, 70000, CURRENT_TIMESTAMP - INTERVAL '1 day');

    INSERT INTO single_trip_tickets (student_code, route_id, boarding_stop_id, alighting_stop_id, fare_amount, qr_code, purchased_at, expires_at, status)
    VALUES ('SV-STABLE-DAY', v_route_supported_id, v_boarding_supported_id, v_alighting_supported_id, v_supported_single_final, 'DEMO-DAY-SV-STABLE-DAY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '12 hours', 'UNUSED')
    RETURNING single_trip_ticket_id INTO v_single_ticket_id;

    INSERT INTO payments (student_code, amount, method, status, transaction_code, created_at, single_trip_ticket_id, notes)
    VALUES ('SV-STABLE-DAY', v_supported_single_final, 'BANK_TRANSFER', 'PAID', 'DEMO-PAY-DAY', CURRENT_TIMESTAMP, v_single_ticket_id, 'Thanh toán demo vé ngày')
    RETURNING payment_id INTO v_payment_id;

    INSERT INTO invoices (payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount, issued_at)
    VALUES (v_payment_id, 'SV-STABLE-DAY', 'Hóa đơn demo vé ngày', v_supported_single_final, v_supported_single_amount, v_supported_single_subsidy, v_supported_single_final, CURRENT_TIMESTAMP);

    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, last_scanned_at, scans_today, status)
    VALUES ('SV-STABLE-HIST', v_route_supported_id, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, date_trunc('month', CURRENT_DATE)::date, CURRENT_TIMESTAMP - INTERVAL '3 days', (v_end_date + INTERVAL '1 day')::date, v_supported_monthly_final, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final, v_policy_id, 'DEMO-HIST-SV-STABLE-HIST', CURRENT_TIMESTAMP - INTERVAL '2 hours', 1, 'ACTIVE');

    INSERT INTO travel_history (student_code, trip_id, registration_id, boarding_stop_id, alighting_stop_id, boarded_at, alighted_at, confirmation_method, confirmed_by_conductor_id)
    SELECT 'SV-STABLE-HIST', v_trip_today_supported_id, rr.registration_id, v_boarding_supported_id, v_alighting_supported_id, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 20 minutes', 'QR_SCAN', v_conductor_id
    FROM route_registrations rr
    WHERE rr.student_code = 'SV-STABLE-HIST'
    ORDER BY rr.registration_id DESC
    LIMIT 1;

    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status)
    VALUES ('SV-STABLE-SUB', v_route_supported_id, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, date_trunc('month', CURRENT_DATE)::date, CURRENT_TIMESTAMP - INTERVAL '1 hour', (v_end_date + INTERVAL '1 day')::date, v_supported_monthly_final, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final, v_policy_id, 'DEMO-SUB-SV-STABLE-SUB', 'ACTIVE');

    INSERT INTO monthly_passes (student_code, route_id, effective_month, effective_year, valid_from, purchased_at, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status)
    VALUES ('SV-STABLE-FULL', v_route_full_id, EXTRACT(MONTH FROM CURRENT_DATE)::int, EXTRACT(YEAR FROM CURRENT_DATE)::int, date_trunc('month', CURRENT_DATE)::date, CURRENT_TIMESTAMP - INTERVAL '1 hour', (v_end_date + INTERVAL '1 day')::date, v_full_monthly_amount, v_full_monthly_amount, 0, v_full_monthly_amount, NULL, 'DEMO-FULL-SV-STABLE-FULL', 'ACTIVE');

    INSERT INTO tb_orders (student_code, ticket_type, route_id, total, payment_status, name, paid_at, created_at, updated_at, order_mode, ticket_period, origin_label, destination_label, original_amount, subsidy_amount, final_amount)
    VALUES ('SV-STABLE-UNPAID', 'monthly', v_route_supported_id, v_supported_monthly_final, 'Unpaid', 'Đơn demo vé tháng chưa thanh toán', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'single-route', 'month', v_supported_boarding_label, v_supported_alighting_label, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final);

    INSERT INTO tb_orders (student_code, ticket_type, route_id, total, payment_status, name, paid_at, created_at, updated_at, order_mode, ticket_period, origin_label, destination_label, original_amount, subsidy_amount, final_amount)
    VALUES ('SV-STABLE-MONTH', 'monthly', v_route_supported_id, v_supported_monthly_final, 'Paid', 'Đơn demo vé tháng đã thanh toán', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, 'single-route', 'month', v_supported_boarding_label, v_supported_alighting_label, v_supported_monthly_amount, v_supported_monthly_subsidy, v_supported_monthly_final)
    RETURNING id INTO v_order_id;

    INSERT INTO tb_transactions (sepay_transaction_id, gateway, transaction_date, amount_in, amount_out, accumulated, code, transaction_content, reference_number, body, raw_payload, matched_order_id, created_at)
    VALUES (9000008001, 'SEPAY', CURRENT_TIMESTAMP - INTERVAL '1 day', v_supported_monthly_final, 0, v_supported_monthly_final, 'DEMOPAID', 'Giao dịch demo đã khớp', 'DEMO-REF-PAID', 'Nội dung giao dịch demo', '{"source":"STABLE_DEMO"}'::jsonb, v_order_id, CURRENT_TIMESTAMP - INTERVAL '1 day')
    ON CONFLICT (sepay_transaction_id) DO UPDATE
    SET gateway = EXCLUDED.gateway,
        transaction_date = EXCLUDED.transaction_date,
        amount_in = EXCLUDED.amount_in,
        transaction_content = EXCLUDED.transaction_content,
        matched_order_id = EXCLUDED.matched_order_id,
        raw_payload = EXCLUDED.raw_payload;

    INSERT INTO notifications (recipient_user_id, sender_user_id, title, content, notification_type, is_read, sent_at)
    SELECT u.user_id, v_admin_user_id, 'Demo đã sẵn sàng', 'Dữ liệu demo ổn định đã sẵn sàng đến 31/08/2026.', 'SYSTEM', false, CURRENT_TIMESTAMP
    FROM users u
    WHERE u.email IN (
        'student.supported@unibus.local',
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
          AND n.title = 'Demo đã sẵn sàng'
          AND n.content LIKE 'Dữ liệu demo ổn định%'
    );
END $$;

COMMIT;

















