-- Test data for Student Verification and OAuth flows.
-- Default password for password-based seed accounts: Password123!

BEGIN;

WITH seed_users(email) AS (
    VALUES
        ('admin.verify@unibus.local'),
        ('student.verified@unibus.local'),
        ('student.pending@unibus.local'),
        ('student.rejected@unibus.local'),
        ('student.resubmit@unibus.local'),
        ('student.google@unibus.local')
)
DELETE FROM student_verifications
WHERE user_id IN (SELECT user_id FROM users WHERE email IN (SELECT email FROM seed_users));

WITH seed_users(email) AS (
    VALUES
        ('admin.verify@unibus.local'),
        ('student.verified@unibus.local'),
        ('student.pending@unibus.local'),
        ('student.rejected@unibus.local'),
        ('student.resubmit@unibus.local'),
        ('student.google@unibus.local')
)
DELETE FROM user_auth_providers
WHERE user_id IN (SELECT user_id FROM users WHERE email IN (SELECT email FROM seed_users));

WITH seed_users(email) AS (
    VALUES
        ('student.verified@unibus.local'),
        ('student.pending@unibus.local'),
        ('student.rejected@unibus.local'),
        ('student.resubmit@unibus.local'),
        ('student.google@unibus.local')
)
DELETE FROM students
WHERE user_id IN (SELECT user_id FROM users WHERE email IN (SELECT email FROM seed_users));

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
VALUES
    ('admin.verify@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Admin Verify', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.verified@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Verified Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'VERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.pending@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Pending Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'PENDING_REVIEW', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.rejected@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Rejected Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'REJECTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.resubmit@unibus.local', '$2a$10$EBx14iAsXMpv3k69BQ5/C.GtzEiFqeMvBuMNanRkwHlwx//7yMzWu', 'Resubmission Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'RESUBMISSION_REQUIRED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('student.google@unibus.local', NULL, 'Google Seed Student', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, 'NOT_SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    email_verified_at = EXCLUDED.email_verified_at,
    student_verification_status = EXCLUDED.student_verification_status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO students (student_code, user_id, university, faculty, academic_year, date_of_birth)
SELECT 'SV-VER-001', user_id, 'UniBus Test University', 'Software Engineering', 3, DATE '2004-01-15'
FROM users
WHERE email = 'student.verified@unibus.local'
ON CONFLICT (student_code) DO UPDATE
SET user_id = EXCLUDED.user_id,
    university = EXCLUDED.university,
    faculty = EXCLUDED.faculty,
    academic_year = EXCLUDED.academic_year,
    date_of_birth = EXCLUDED.date_of_birth;

INSERT INTO student_verifications (
    user_id,
    university,
    student_code,
    card_image_url,
    ocr_full_name,
    ocr_student_code,
    ocr_university,
    ocr_raw_text,
    ocr_confidence_score,
    status,
    rejection_reason,
    reviewer_user_id,
    reviewed_at,
    submitted_at,
    created_at,
    updated_at,
    is_current
)
SELECT
    u.user_id,
    'UniBus Test University',
    CASE u.email
        WHEN 'student.verified@unibus.local' THEN 'SV-VER-001'
        WHEN 'student.pending@unibus.local' THEN 'SV-PEN-001'
        WHEN 'student.rejected@unibus.local' THEN 'SV-REJ-001'
        WHEN 'student.resubmit@unibus.local' THEN 'SV-RES-001'
    END,
    'seed/student-card-placeholder.png',
    u.full_name,
    CASE u.email
        WHEN 'student.verified@unibus.local' THEN 'SV-VER-001'
        WHEN 'student.pending@unibus.local' THEN 'SV-PEN-001'
        WHEN 'student.rejected@unibus.local' THEN 'SV-REJ-001'
        WHEN 'student.resubmit@unibus.local' THEN 'SV-RES-001'
    END,
    'UniBus Test University',
    'Seed OCR text for admin review testing',
    0.9200,
    u.student_verification_status,
    CASE u.email
        WHEN 'student.rejected@unibus.local' THEN 'Ảnh thẻ không rõ mã sinh viên.'
        WHEN 'student.resubmit@unibus.local' THEN 'Vui lòng gửi lại ảnh thẻ rõ hơn.'
        ELSE NULL
    END,
    admin_user.user_id,
    CASE WHEN u.student_verification_status IN ('VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED') THEN CURRENT_TIMESTAMP ELSE NULL END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    TRUE
FROM users u
CROSS JOIN (
    SELECT user_id
    FROM users
    WHERE email = 'admin.verify@unibus.local'
) admin_user
WHERE u.email IN (
    'student.verified@unibus.local',
    'student.pending@unibus.local',
    'student.rejected@unibus.local',
    'student.resubmit@unibus.local'
);

INSERT INTO user_auth_providers (
    user_id,
    provider,
    provider_user_id,
    provider_email,
    provider_email_verified,
    display_name,
    avatar_url,
    created_at,
    updated_at
)
SELECT
    user_id,
    'GOOGLE',
    'google-seed-student-001',
    email,
    TRUE,
    full_name,
    avatar_url,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users
WHERE email = 'student.google@unibus.local'
ON CONFLICT (provider, provider_user_id) DO UPDATE
SET provider_email = EXCLUDED.provider_email,
    provider_email_verified = EXCLUDED.provider_email_verified,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
