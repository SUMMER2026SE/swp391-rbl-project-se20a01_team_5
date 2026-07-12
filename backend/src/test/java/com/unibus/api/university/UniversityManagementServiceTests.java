package com.unibus.api.university;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;

import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.university.UniversityDtos.ImportBatchView;
import com.unibus.api.university.UniversityDtos.RosterStudentView;
import com.unibus.api.university.UniversityManagementRepository.RosterMatch;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

@SpringBootTest
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
class UniversityManagementServiceTests {

    @Autowired
    private UniversityManagementService service;

    @Autowired
    private UniversityManagementRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    private Integer universityId;
    private User universityAdmin;

    @BeforeEach
    void setUp() {
        createUniversityTables();
        jdbcTemplate.update("DELETE FROM audit_logs");
        jdbcTemplate.update("DELETE FROM university_import_errors");
        jdbcTemplate.update("DELETE FROM university_student_rosters");
        jdbcTemplate.update("DELETE FROM university_import_batches");
        jdbcTemplate.update("DELETE FROM university_admins");
        jdbcTemplate.update("DELETE FROM university_domains");
        jdbcTemplate.update("DELETE FROM subsidy_policies");
        jdbcTemplate.update("DELETE FROM route_universities");
        jdbcTemplate.update("DELETE FROM campuses");
        jdbcTemplate.update("DELETE FROM universities");
        studentRepository.deleteAll();
        userRepository.deleteAll();

        universityId = insertUniversity("UNI-TEST", "UniBus Test University");
        jdbcTemplate.update("""
                INSERT INTO university_domains(university_id, domain, status, verified_at)
                VALUES (?, 'unitest.edu.vn', 'ACTIVE', CURRENT_TIMESTAMP)
                """, universityId);
        universityAdmin = userRepository.save(user("admin@unitest.edu.vn", "University Admin", UserRole.UNIVERSITY_ADMIN));
    }

    @Test
    void importRosterStoresValidRowsAndRowErrors() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "roster.csv",
                "text/csv",
                """
                email,studentCode,fullName,faculty,academicYear,status
                Student.One@unitest.edu.vn,SE001,Student One,Software Engineering,2024,ACTIVE
                ,SE002,Missing Email,Software Engineering,2024,ACTIVE
                """.getBytes());

        ImportBatchView batch = service.importRoster(currentUser(), universityId, file);

        assertThat(batch.totalRows()).isEqualTo(2);
        assertThat(batch.successRows()).isEqualTo(1);
        assertThat(batch.errorRows()).isEqualTo(1);
        assertThat(batch.status()).isEqualTo("COMPLETED_WITH_ERRORS");
        assertThat(batch.errors()).hasSize(1);
        assertThat(batch.errors().get(0).fieldName()).isEqualTo("email");

        assertThat(service.listRoster(universityId, null, null))
                .extracting(RosterStudentView::email)
                .containsExactly("student.one@unitest.edu.vn");
    }

    @Test
    void applyGoogleUniversityLinkCreatesVerifiedStudentFromActiveRoster() {
        User studentUser = userRepository.save(user("student.one@unitest.edu.vn", "student.one@unitest.edu.vn", UserRole.STUDENT));
        repository.upsertRoster(
                universityId,
                "student.one@unitest.edu.vn",
                "SE001",
                "Student One",
                "Software Engineering",
                2024,
                "ACTIVE",
                null);

        service.applyGoogleUniversityLink(studentUser);

        User reloaded = userRepository.findById(studentUser.getId()).orElseThrow();
        assertThat(reloaded.getStudentVerificationStatus()).isEqualTo(StudentVerificationStatus.VERIFIED);

        Student student = studentRepository.findByUserId(studentUser.getId()).orElseThrow();
        assertThat(student.getStudentCode()).isEqualTo("SE001");
        assertThat(student.getUniversityId()).isEqualTo(universityId);
        assertThat(student.getUniversity()).isEqualTo("UniBus Test University");

        RosterMatch match = repository.findActiveRosterByEmail("student.one@unitest.edu.vn").orElseThrow();
        Integer matchedUserId = jdbcTemplate.queryForObject("""
                SELECT matched_user_id
                FROM university_student_rosters
                WHERE roster_id = ?
                """, Integer.class, match.rosterId());
        assertThat(matchedUserId).isEqualTo(studentUser.getId());
    }

    private CurrentUser currentUser() {
        return new CurrentUser(universityAdmin.getId(), universityAdmin.getEmail(), universityAdmin.getRole(), 1L);
    }

    private User user(String email, String fullName, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("unused");
        user.setFullName(fullName);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setStudentVerificationStatus(StudentVerificationStatus.NOT_SUBMITTED);
        user.setEmailVerifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return user;
    }

    private Integer insertUniversity(String code, String name) {
        jdbcTemplate.update("""
                INSERT INTO universities(code, name, short_name, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, code, name, "UTU");
        return jdbcTemplate.queryForObject(
                "SELECT university_id FROM universities WHERE code = ?",
                Integer.class,
                code);
    }

    private void createUniversityTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS universities (
                    university_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    code VARCHAR(50) NOT NULL UNIQUE,
                    name VARCHAR(150) NOT NULL UNIQUE,
                    short_name VARCHAR(80),
                    contact_email VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS campuses (
                    campus_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    code VARCHAR(50) NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    address VARCHAR(255),
                    latitude NUMERIC(10,8),
                    longitude NUMERIC(11,8),
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS route_universities (
                    route_university_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    route_id INTEGER NOT NULL,
                    university_id INTEGER NOT NULL,
                    campus_id INTEGER,
                    active_from DATE DEFAULT CURRENT_DATE NOT NULL,
                    active_until DATE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS subsidy_policies (
                    subsidy_policy_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    campus_id INTEGER,
                    policy_name VARCHAR(150) NOT NULL,
                    subsidy_type VARCHAR(20) NOT NULL,
                    "value" NUMERIC(12,2) NOT NULL,
                    max_amount NUMERIC(12,0),
                    active_from DATE DEFAULT CURRENT_DATE NOT NULL,
                    active_until DATE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_domains (
                    university_domain_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    domain VARCHAR(120) NOT NULL UNIQUE,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    verified_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_admins (
                    university_admin_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL UNIQUE,
                    title VARCHAR(100),
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    assigned_by_user_id INTEGER,
                    updated_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_import_batches (
                    import_batch_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    total_rows INTEGER DEFAULT 0 NOT NULL,
                    success_rows INTEGER DEFAULT 0 NOT NULL,
                    error_rows INTEGER DEFAULT 0 NOT NULL,
                    status VARCHAR(30) DEFAULT 'PROCESSING' NOT NULL,
                    imported_by_user_id INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    completed_at TIMESTAMP WITH TIME ZONE
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_student_rosters (
                    roster_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    university_id INTEGER NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    student_code VARCHAR(20) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    faculty VARCHAR(100),
                    academic_year INTEGER,
                    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
                    matched_user_id INTEGER,
                    imported_batch_id BIGINT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE,
                    UNIQUE(university_id, email),
                    UNIQUE(university_id, student_code)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS university_import_errors (
                    import_error_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    import_batch_id BIGINT NOT NULL,
                    row_number INTEGER NOT NULL,
                    field_name VARCHAR(80),
                    raw_value TEXT,
                    error_message VARCHAR(500) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    audit_log_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    performed_by_user_id INTEGER NOT NULL,
                    university_id INTEGER,
                    action VARCHAR(50) NOT NULL,
                    affected_table VARCHAR(50),
                    affected_record_id VARCHAR(50),
                    result VARCHAR(30),
                    request_id VARCHAR(80),
                    notes VARCHAR(500),
                    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """);
    }
}
