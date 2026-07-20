-- Reset the UniAdmin DTU demo account to the current clean local demo state.
-- Scope:
--   - uniadmin.demo@unibus.local remains the DTU university admin.
--   - DTU campus/domain base data is restored.
--   - DTU demo roster is restored.
--   - Bad imported roster rows are removed:
--       asjaakkaka / DDDDDD22
--       aaaaaa / DE111111
--       nguyen tan martin / DE201222

DO $$
DECLARE
    v_dtu_id integer;
    v_admin_user_id integer;
    v_uniadmin_user_id integer;
    v_deleted_bad_rosters integer := 0;
BEGIN
    SELECT university_id
    INTO v_dtu_id
    FROM universities
    WHERE code = 'DTU'
       OR name ILIKE '%Duy Tân%'
       OR name ILIKE '%Duy Tan%'
    ORDER BY CASE WHEN code = 'DTU' THEN 0 ELSE 1 END, university_id
    LIMIT 1;

    IF v_dtu_id IS NULL THEN
        RAISE EXCEPTION 'DTU university was not found. Reset aborted.';
    END IF;

    SELECT user_id INTO v_admin_user_id FROM users WHERE email = 'admin.demo@unibus.local';
    SELECT user_id INTO v_uniadmin_user_id FROM users WHERE email = 'uniadmin.demo@unibus.local';

    IF v_uniadmin_user_id IS NULL THEN
        RAISE EXCEPTION 'uniadmin.demo@unibus.local was not found. Reset aborted.';
    END IF;

    UPDATE users
    SET role = 'UNIVERSITY_ADMIN',
        status = 'ACTIVE',
        email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = v_uniadmin_user_id;

    INSERT INTO university_admins (user_id, university_id, status, permissions, title, assigned_at, assigned_by_user_id, updated_at)
    VALUES (
        v_uniadmin_user_id,
        v_dtu_id,
        'ACTIVE',
        'FINANCE,STUDENTS,REPORTS',
        'Quản trị viên trường',
        CURRENT_TIMESTAMP,
        v_admin_user_id,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO UPDATE
    SET university_id = EXCLUDED.university_id,
        status = 'ACTIVE',
        permissions = EXCLUDED.permissions,
        title = EXCLUDED.title,
        updated_at = CURRENT_TIMESTAMP;

    INSERT INTO campuses (university_id, code, name, address, status, created_at, updated_at)
    VALUES (
        v_dtu_id,
        'DTU_MAIN',
        'Cơ sở Nguyễn Văn Linh',
        '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng',
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (university_id, code) DO UPDATE
    SET name = EXCLUDED.name,
        address = EXCLUDED.address,
        status = 'ACTIVE',
        updated_at = CURRENT_TIMESTAMP;

    UPDATE university_domains
    SET university_id = v_dtu_id,
        status = 'ACTIVE',
        verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    WHERE lower(domain) IN ('dtu.edu.vn', 'duytan.edu.vn');

    INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
    SELECT v_dtu_id, payload.domain, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM (VALUES ('dtu.edu.vn'), ('duytan.edu.vn')) payload(domain)
    WHERE NOT EXISTS (
        SELECT 1
        FROM university_domains d
        WHERE lower(d.domain) = lower(payload.domain)
    );

    DELETE FROM university_student_rosters
    WHERE university_id = v_dtu_id
      AND (
          upper(student_code) IN ('DDDDDD22', 'DE111111', 'DE201222')
          OR lower(email) IN ('aaaaa@dtu.edu.vn', 'aaaa@dtu.edu.vn', 'nguyentanmarrrr@dtu.edu.vn', 'nguyentanmartin@dtu.edu.vn')
          OR lower(full_name) IN ('asjaakkaka', 'aaaaaa', 'nguyen tan martin')
      );
    GET DIAGNOSTICS v_deleted_bad_rosters = ROW_COUNT;

    INSERT INTO university_student_rosters (
        university_id,
        student_code,
        full_name,
        email,
        status,
        faculty,
        academic_year,
        matched_user_id,
        created_at,
        updated_at
    )
    SELECT v_dtu_id, payload.student_code, payload.full_name, payload.email, payload.status,
           payload.faculty, payload.academic_year, u.user_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM (VALUES
        ('27211200001', 'Mai Anh Thư', 'student.supported@unibus.local', 'ACTIVE', 'Công nghệ thông tin', 2023),
        ('27212100002', 'Ngô Quốc Bảo', 'student.fullprice@unibus.local', 'ACTIVE', 'Kinh tế', 2022),
        ('27211200003', 'Đặng Minh Khoa', 'student.monthly@unibus.local', 'ACTIVE', 'Kỹ thuật phần mềm', 2021),
        ('27217100004', 'Trần Hải Yến', 'student.day@unibus.local', 'ACTIVE', 'Du lịch', 2024),
        ('27212100005', 'Võ Nhật Nam', 'student.unpaid@unibus.local', 'ACTIVE', 'Tài chính', 2023),
        ('27217200006', 'Phan Gia Linh', 'student.history@unibus.local', 'ACTIVE', 'Logistics', 2022),
        ('27211200007', 'Bùi Thanh Tùng', 'dtu.student07@demo.unibus.local', 'ACTIVE', 'Kỹ thuật phần mềm', 2022),
        ('27211200008', 'Đỗ Khánh Linh', 'dtu.student08@demo.unibus.local', 'ACTIVE', 'Du lịch', 2023),
        ('27211200009', 'Phan Đức Anh', 'dtu.student09@demo.unibus.local', 'ACTIVE', 'Tài chính', 2024),
        ('27211200010', 'Hồ Mai Phương', 'dtu.student10@demo.unibus.local', 'ACTIVE', 'Logistics', 2020),
        ('27211200011', 'Nguyễn Nhật Minh', 'dtu.student11@demo.unibus.local', 'ACTIVE', 'Công nghệ thông tin', 2021),
        ('27211200012', 'Trần Bảo Châu', 'dtu.student12@demo.unibus.local', 'ACTIVE', 'Kỹ thuật phần mềm', 2022),
        ('27211200013', 'Lê Quang Huy', 'dtu.student13@demo.unibus.local', 'INACTIVE', 'Du lịch', 2023),
        ('27211200014', 'Nguyễn Hoài An', 'dtu.student14@demo.unibus.local', 'GRADUATED', 'Tài chính', 2024),
        ('27211200015', 'Đỗ Minh Khang', 'dtu.student15@demo.unibus.local', 'SUSPENDED', 'Logistics', 2020)
    ) payload(student_code, full_name, email, status, faculty, academic_year)
    LEFT JOIN users u ON lower(u.email) = lower(payload.email)
    ON CONFLICT (university_id, student_code) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        faculty = EXCLUDED.faculty,
        academic_year = EXCLUDED.academic_year,
        matched_user_id = EXCLUDED.matched_user_id,
        updated_at = CURRENT_TIMESTAMP;

    IF EXISTS (
        SELECT 1
        FROM university_student_rosters
        WHERE university_id = v_dtu_id
          AND (
              upper(student_code) IN ('DDDDDD22', 'DE111111', 'DE201222')
              OR lower(email) IN ('aaaaa@dtu.edu.vn', 'aaaa@dtu.edu.vn', 'nguyentanmarrrr@dtu.edu.vn', 'nguyentanmartin@dtu.edu.vn')
              OR lower(full_name) IN ('asjaakkaka', 'aaaaaa', 'nguyen tan martin')
          )
    ) THEN
        RAISE EXCEPTION 'Bad roster rows still exist after reset. Transaction rolled back.';
    END IF;

    RAISE NOTICE 'UniAdmin DTU demo reset complete. Removed bad roster rows: %', v_deleted_bad_rosters;
END $$;

SELECT
    count(*) FILTER (WHERE status = 'ACTIVE') AS active_students,
    count(*) FILTER (WHERE status <> 'ACTIVE') AS inactive_students,
    count(*) AS total_roster
FROM university_student_rosters r
JOIN universities u ON u.university_id = r.university_id
WHERE u.code = 'DTU';
