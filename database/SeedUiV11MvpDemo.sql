-- UI v1.1 + University Linkage MVP QA data.
-- Run after Flyway V9, SeedStudentVerificationTestData.sql, and SeedUniversitySubsidyDemo.sql.
-- Password for password-based seed accounts: Password123!

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
    'uni.admin@unibus.local',
    '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu',
    'University Admin Bách khoa',
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
    student_verification_status = EXCLUDED.student_verification_status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO universities (code, name, short_name, contact_email, status)
VALUES (
    'DHBK_DHDN',
    'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    'ĐH Bách khoa Đà Nẵng',
    'demo-dhbk@unibus.local',
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
    WHERE code = 'DHBK_DHDN'
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
    WHERE code = 'DHBK_DHDN'
),
admin_user AS (
    SELECT user_id
    FROM users
    WHERE email = 'uni.admin@unibus.local'
),
assigned_by AS (
    SELECT user_id
    FROM (
        SELECT user_id, 1 AS priority
        FROM users
        WHERE email = 'admin.verify@unibus.local'
        UNION ALL
        SELECT user_id, 2 AS priority
        FROM users
        WHERE email = 'uni.admin@unibus.local'
    ) seed_actor
    ORDER BY priority
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
    u.university_id,
    a.user_id,
    'Phòng Công tác sinh viên',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    assigned_by.user_id,
    CURRENT_TIMESTAMP
FROM university_data u
CROSS JOIN admin_user a
CROSS JOIN assigned_by
ON CONFLICT (user_id) DO UPDATE
SET university_id = EXCLUDED.university_id,
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    assigned_by_user_id = EXCLUDED.assigned_by_user_id,
    updated_at = CURRENT_TIMESTAMP;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
)
INSERT INTO university_domains (university_id, domain, status, verified_at, updated_at)
SELECT university_id, domain, status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM university_data
CROSS JOIN (
    VALUES
        ('unibus.local', 'ACTIVE'),
        ('dut.udn.vn', 'ACTIVE'),
        ('sv.dut.udn.vn', 'ACTIVE')
) AS seed_domains(domain, status)
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id,
    status = EXCLUDED.status,
    verified_at = EXCLUDED.verified_at,
    updated_at = CURRENT_TIMESTAMP;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
)
UPDATE students s
SET university_id = u.university_id
FROM university_data u
WHERE s.student_code = 'SV-VER-001';

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
)
UPDATE student_verifications sv
SET university_id = u.university_id
FROM university_data u
WHERE sv.student_code IN ('SV-VER-001', 'SV-PEN-001', 'SV-REJ-001', 'SV-RES-001');

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
)
DELETE FROM university_student_rosters usr
USING university_data u
WHERE usr.university_id = u.university_id
  AND (
      usr.email IN (
          'student.verified@unibus.local',
          'student.pending@unibus.local',
          'student.google@unibus.local',
          'roster.only@unibus.local',
          'inactive.student@unibus.local'
      )
      OR usr.student_code IN ('SV-VER-001', 'SV-PEN-001', 'SV-GGL-001', 'SV-ROS-001', 'SV-INACTIVE-001')
  );

WITH seed_batches AS (
    SELECT import_batch_id
    FROM university_import_batches
    WHERE file_name = 'ui-v11-roster-demo.csv'
)
DELETE FROM university_import_errors
WHERE import_batch_id IN (SELECT import_batch_id FROM seed_batches);

DELETE FROM university_import_batches
WHERE file_name = 'ui-v11-roster-demo.csv';

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
),
admin_user AS (
    SELECT user_id
    FROM users
    WHERE email = 'uni.admin@unibus.local'
),
new_batch AS (
    INSERT INTO university_import_batches (
        university_id,
        file_name,
        total_rows,
        success_rows,
        error_rows,
        status,
        imported_by_user_id,
        created_at,
        completed_at
    )
    SELECT
        u.university_id,
        'ui-v11-roster-demo.csv',
        5,
        4,
        1,
        'COMPLETED_WITH_ERRORS',
        a.user_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM university_data u
    CROSS JOIN admin_user a
    RETURNING import_batch_id
)
INSERT INTO university_import_errors (
    import_batch_id,
    row_number,
    field_name,
    raw_value,
    error_message,
    created_at
)
SELECT
    import_batch_id,
    6,
    'email',
    'bad-email-format',
    'Email không hợp lệ, cần đúng định dạng địa chỉ email sinh viên.',
    CURRENT_TIMESTAMP
FROM new_batch;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
),
batch_data AS (
    SELECT import_batch_id
    FROM university_import_batches
    WHERE file_name = 'ui-v11-roster-demo.csv'
),
roster_rows(email, student_code, full_name, faculty, academic_year, status) AS (
    VALUES
        ('student.verified@unibus.local', 'SV-VER-001', 'Verified Student', 'Software Engineering', 3, 'ACTIVE'),
        ('student.pending@unibus.local', 'SV-PEN-001', 'Pending Student', 'Information Systems', 2, 'ACTIVE'),
        ('student.google@unibus.local', 'SV-GGL-001', 'Google Seed Student', 'Computer Science', 1, 'ACTIVE'),
        ('roster.only@unibus.local', 'SV-ROS-001', 'Roster Only Student', 'Data Engineering', 4, 'ACTIVE'),
        ('inactive.student@unibus.local', 'SV-INACTIVE-001', 'Inactive Roster Student', 'Automation Engineering', 4, 'INACTIVE')
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
    imported_batch_id,
    created_at,
    updated_at
)
SELECT
    u.university_id,
    LOWER(rr.email),
    rr.student_code,
    rr.full_name,
    rr.faculty,
    rr.academic_year,
    rr.status,
    matched.user_id,
    b.import_batch_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM roster_rows rr
CROSS JOIN university_data u
CROSS JOIN batch_data b
LEFT JOIN users matched ON LOWER(matched.email) = LOWER(rr.email)
ON CONFLICT (university_id, email) DO UPDATE
SET student_code = EXCLUDED.student_code,
    full_name = EXCLUDED.full_name,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year,
    status = EXCLUDED.status,
    matched_user_id = EXCLUDED.matched_user_id,
    imported_batch_id = EXCLUDED.imported_batch_id,
    updated_at = CURRENT_TIMESTAMP;

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
),
campus_data AS (
    SELECT campus_id
    FROM campuses
    WHERE code = 'DHBK_MAIN'
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'ITER1 seed route:%'
)
UPDATE route_universities ru
SET campus_id = c.campus_id,
    updated_at = CURRENT_TIMESTAMP
FROM route_data r
CROSS JOIN university_data u
CROSS JOIN campus_data c
WHERE ru.route_id = r.route_id
  AND ru.university_id = u.university_id
  AND ru.campus_id IS NULL
  AND ru.status = 'ACTIVE';

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
),
campus_data AS (
    SELECT campus_id
    FROM campuses
    WHERE code = 'DHBK_MAIN'
),
route_data AS (
    SELECT route_id
    FROM routes
    WHERE description LIKE 'ITER1 seed route:%'
)
INSERT INTO route_universities (route_id, university_id, campus_id, active_from, active_until, status)
SELECT r.route_id, u.university_id, c.campus_id, CURRENT_DATE - INTERVAL '1 day', NULL, 'ACTIVE'
FROM route_data r
CROSS JOIN university_data u
CROSS JOIN campus_data c
WHERE NOT EXISTS (
    SELECT 1
    FROM route_universities ru
    WHERE ru.route_id = r.route_id
      AND ru.university_id = u.university_id
      AND ru.status = 'ACTIVE'
);

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
),
campus_data AS (
    SELECT campus_id
    FROM campuses
    WHERE code = 'DHBK_MAIN'
)
INSERT INTO subsidy_policies (
    university_id,
    campus_id,
    policy_name,
    subsidy_type,
    "value",
    max_amount,
    active_from,
    active_until,
    status
)
SELECT
    u.university_id,
    c.campus_id,
    'UI QA trợ giá sinh viên 35%',
    'PERCENTAGE',
    35,
    50000,
    CURRENT_DATE - INTERVAL '1 day',
    NULL,
    'ACTIVE'
FROM university_data u
CROSS JOIN campus_data c
WHERE NOT EXISTS (
    SELECT 1
    FROM subsidy_policies sp
    WHERE sp.university_id = u.university_id
      AND sp.campus_id = c.campus_id
      AND sp.policy_name = 'UI QA trợ giá sinh viên 35%'
);

DELETE FROM notifications
WHERE title LIKE 'UI QA:%';

WITH sender_user AS (
    SELECT user_id
    FROM (
        SELECT user_id, 1 AS priority
        FROM users
        WHERE email = 'admin.verify@unibus.local'
        UNION ALL
        SELECT user_id, 2 AS priority
        FROM users
        WHERE email = 'uni.admin@unibus.local'
    ) seed_actor
    ORDER BY priority
    LIMIT 1
),
notification_rows(email, title, content, notification_type, is_read) AS (
    VALUES
        ('student.verified@unibus.local', 'UI QA: Vé tháng sẵn sàng', 'Vé tháng có trợ giá đã sẵn sàng để kiểm tra QR.', 'PAYMENT', FALSE),
        ('student.verified@unibus.local', 'UI QA: Tuyến trường đang hoạt động', 'Tuyến Campus Loop đang hoạt động và có xe gần điểm đón.', 'TRIP', FALSE),
        ('driver.iter1@unibus.local', 'UI QA: Ca lái hôm nay', 'Bạn có chuyến Campus Loop đang chạy để kiểm tra màn tài xế.', 'TRIP', FALSE),
        ('conductor.iter1@unibus.local', 'UI QA: Kiểm vé QR', 'Danh sách vé thật đã sẵn sàng cho màn phụ xe.', 'TRIP', FALSE),
        ('dispatcher.iter1@unibus.local', 'UI QA: Đội xe live', 'Dữ liệu vị trí xe seed sẵn sàng cho điều phối.', 'ALERT', FALSE),
        ('admin.verify@unibus.local', 'UI QA: Hồ sơ xác minh', 'Có hồ sơ sinh viên chờ duyệt trong dữ liệu seed.', 'SYSTEM', FALSE),
        ('uni.admin@unibus.local', 'UI QA: Roster import', 'Batch ui-v11-roster-demo.csv có 4 dòng thành công và 1 lỗi.', 'SYSTEM', FALSE)
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
    nr.is_read,
    CURRENT_TIMESTAMP
FROM notification_rows nr
JOIN users recipient ON recipient.email = nr.email
CROSS JOIN sender_user sender;

DELETE FROM feedback
WHERE content LIKE 'UI QA:%';

WITH student_data AS (
    SELECT student_code
    FROM students
    WHERE student_code = 'SV-VER-001'
),
trip_data AS (
    SELECT t.trip_id
    FROM trips t
    JOIN routes r ON r.route_id = t.route_id
    WHERE r.description LIKE 'ITER1 seed route:%'
    ORDER BY t.service_date DESC, t.trip_id DESC
    LIMIT 1
),
handler_user AS (
    SELECT user_id
    FROM users
    WHERE email = 'dispatcher.iter1@unibus.local'
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
    s.student_code,
    t.trip_id,
    'UI QA: Xe đến đúng giờ, giao diện lịch sử/feedback có dữ liệu thật để kiểm tra.',
    5,
    CURRENT_TIMESTAMP,
    'RESOLVED',
    'Cảm ơn bạn, điều phối đã ghi nhận phản hồi.',
    h.user_id
FROM student_data s
CROSS JOIN trip_data t
CROSS JOIN handler_user h;

DELETE FROM audit_logs
WHERE notes = 'UI QA seed';

WITH university_data AS (
    SELECT university_id
    FROM universities
    WHERE code = 'DHBK_DHDN'
),
actor_user AS (
    SELECT user_id
    FROM (
        SELECT user_id, 1 AS priority
        FROM users
        WHERE email = 'admin.verify@unibus.local'
        UNION ALL
        SELECT user_id, 2 AS priority
        FROM users
        WHERE email = 'uni.admin@unibus.local'
    ) seed_actor
    ORDER BY priority
    LIMIT 1
),
audit_rows(action, affected_table, affected_record_id, result, request_id, notes) AS (
    VALUES
        ('UNIVERSITY_UPSERT', 'universities', 'DHBK_DHDN', 'SUCCESS', 'ui-v11-seed-university', 'UI QA seed'),
        ('UNIVERSITY_ADMIN_ASSIGN', 'university_admins', 'uni.admin@unibus.local', 'SUCCESS', 'ui-v11-seed-admin', 'UI QA seed'),
        ('ROSTER_IMPORT', 'university_import_batches', 'ui-v11-roster-demo.csv', 'COMPLETED_WITH_ERRORS', 'ui-v11-seed-roster', 'UI QA seed'),
        ('SUBSIDY_POLICY_UPSERT', 'subsidy_policies', 'UI QA trợ giá sinh viên 35%', 'SUCCESS', 'ui-v11-seed-subsidy', 'UI QA seed')
)
INSERT INTO audit_logs (
    performed_by_user_id,
    university_id,
    action,
    affected_table,
    affected_record_id,
    old_values,
    new_values,
    ip_address,
    result,
    request_id,
    notes,
    performed_at
)
SELECT
    actor.user_id,
    u.university_id,
    ar.action,
    ar.affected_table,
    ar.affected_record_id,
    NULL,
    '{"source":"SeedUiV11MvpDemo.sql"}',
    '127.0.0.1',
    ar.result,
    ar.request_id,
    ar.notes,
    CURRENT_TIMESTAMP
FROM audit_rows ar
CROSS JOIN actor_user actor
CROSS JOIN university_data u;

COMMIT;
