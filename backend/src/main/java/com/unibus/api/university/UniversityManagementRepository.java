package com.unibus.api.university;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.unibus.api.university.UniversityDtos.AuditLogView;
import com.unibus.api.university.UniversityDtos.CampusView;
import com.unibus.api.university.UniversityDtos.DomainView;
import com.unibus.api.university.UniversityDtos.ImportBatchView;
import com.unibus.api.university.UniversityDtos.ImportErrorView;
import com.unibus.api.university.UniversityDtos.PaymentTransactionView;
import com.unibus.api.university.UniversityDtos.PassesByRoutePoint;
import com.unibus.api.university.UniversityDtos.ReconciliationView;
import com.unibus.api.university.UniversityDtos.RosterStudentView;
import com.unibus.api.university.UniversityDtos.RouteUniversityView;
import com.unibus.api.university.UniversityDtos.StudentUniversityView;
import com.unibus.api.university.UniversityDtos.SubsidyDistributionPoint;
import com.unibus.api.university.UniversityDtos.SubsidyPolicyView;
import com.unibus.api.university.UniversityDtos.UniversityAdminView;
import com.unibus.api.university.UniversityDtos.UniversityStatsView;
import com.unibus.api.university.UniversityDtos.UniversityTripsSeriesPoint;
import com.unibus.api.university.UniversityDtos.UniversityView;

@Repository
public class UniversityManagementRepository {

    private final JdbcTemplate jdbcTemplate;

    public UniversityManagementRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<UniversityView> findUniversities(String keyword, String status) {
        String like = blank(keyword) ? null : "%" + keyword.trim().toLowerCase() + "%";
        String normalizedStatus = blank(status) || "all".equalsIgnoreCase(status) ? null : status.trim().toUpperCase();
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        if (like != null) {
            where.append("AND (LOWER(u.name) LIKE ? OR LOWER(u.code) LIKE ? OR LOWER(COALESCE(u.short_name, '')) LIKE ?)\n");
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (normalizedStatus != null) {
            where.append("AND u.status = ?\n");
            params.add(normalizedStatus);
        }
        return jdbcTemplate.query("""
                SELECT u.university_id, u.code, u.name, u.short_name, u.contact_email, u.status, u.created_at,
                       COUNT(DISTINCT c.campus_id) AS campus_count,
                       COUNT(DISTINCT d.university_domain_id) AS domain_count,
                       COUNT(DISTINCT r.roster_id) AS roster_count
                FROM universities u
                LEFT JOIN campuses c ON c.university_id = u.university_id
                LEFT JOIN university_domains d ON d.university_id = u.university_id
                LEFT JOIN university_student_rosters r ON r.university_id = u.university_id AND r.status = 'ACTIVE'
                """ + where + """
                GROUP BY u.university_id, u.code, u.name, u.short_name, u.contact_email, u.status, u.created_at
                ORDER BY u.created_at DESC, u.university_id DESC
                """, (rs, rowNum) -> mapUniversity(rs), params.toArray());
    }

    public Optional<UniversityView> findUniversity(Integer universityId) {
        List<UniversityView> rows = jdbcTemplate.query("""
                SELECT u.university_id, u.code, u.name, u.short_name, u.contact_email, u.status, u.created_at,
                       COUNT(DISTINCT c.campus_id) AS campus_count,
                       COUNT(DISTINCT d.university_domain_id) AS domain_count,
                       COUNT(DISTINCT r.roster_id) AS roster_count
                FROM universities u
                LEFT JOIN campuses c ON c.university_id = u.university_id
                LEFT JOIN university_domains d ON d.university_id = u.university_id
                LEFT JOIN university_student_rosters r ON r.university_id = u.university_id AND r.status = 'ACTIVE'
                WHERE u.university_id = ?
                GROUP BY u.university_id, u.code, u.name, u.short_name, u.contact_email, u.status, u.created_at
                """, (rs, rowNum) -> mapUniversity(rs), universityId);
        return rows.stream().findFirst();
    }

    public UniversityView createUniversity(String code, String name, String shortName, String contactEmail, String status) {
        Integer id = insertAndReturnInt("""
                INSERT INTO universities(code, name, short_name, contact_email, status)
                VALUES (?, ?, ?, ?, ?)
                """, "university_id", code, name, shortName, contactEmail, status);
        return findUniversity(id).orElseThrow();
    }

    public UniversityView updateUniversity(Integer universityId, String code, String name, String shortName, String contactEmail, String status) {
        jdbcTemplate.update("""
                UPDATE universities
                SET code = COALESCE(?, code),
                    name = COALESCE(?, name),
                    short_name = ?,
                    contact_email = ?,
                    status = COALESCE(?, status),
                    updated_at = CURRENT_TIMESTAMP
                WHERE university_id = ?
                """, code, name, shortName, contactEmail, status, universityId);
        return findUniversity(universityId).orElseThrow();
    }

    public List<CampusView> findCampuses(Integer universityId) {
        return jdbcTemplate.query("""
                SELECT campus_id, university_id, code, name, address, latitude, longitude, status
                FROM campuses
                WHERE university_id = ?
                ORDER BY name
                """, (rs, rowNum) -> mapCampus(rs), universityId);
    }

    public CampusView createCampus(Integer universityId, String code, String name, String address, BigDecimal latitude,
            BigDecimal longitude, String status) {
        Integer id = insertAndReturnInt("""
                INSERT INTO campuses(university_id, code, name, address, latitude, longitude, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, "campus_id", universityId, code, name, address, latitude, longitude, status);
        return findCampus(id).orElseThrow();
    }

    public Optional<CampusView> findCampus(Integer campusId) {
        List<CampusView> rows = jdbcTemplate.query("""
                SELECT campus_id, university_id, code, name, address, latitude, longitude, status
                FROM campuses
                WHERE campus_id = ?
                """, (rs, rowNum) -> mapCampus(rs), campusId);
        return rows.stream().findFirst();
    }

    public List<DomainView> findDomains(Integer universityId) {
        return jdbcTemplate.query("""
                SELECT university_domain_id, university_id, domain, status, verified_at, created_at
                FROM university_domains
                WHERE university_id = ?
                ORDER BY domain
                """, (rs, rowNum) -> mapDomain(rs), universityId);
    }

    public DomainView createDomain(Integer universityId, String domain, String status) {
        Integer id = insertAndReturnInt("""
                INSERT INTO university_domains(university_id, domain, status, verified_at)
                VALUES (?, ?, ?, CASE WHEN ? = 'ACTIVE' THEN CURRENT_TIMESTAMP ELSE NULL END)
                """, "university_domain_id", universityId, domain, status, status);
        return findDomain(id).orElseThrow();
    }

    public DomainView updateDomainStatus(Integer domainId, String status) {
        jdbcTemplate.update("""
                UPDATE university_domains
                SET status = ?,
                    verified_at = CASE WHEN ? = 'ACTIVE' AND verified_at IS NULL THEN CURRENT_TIMESTAMP ELSE verified_at END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE university_domain_id = ?
                """, status, status, domainId);
        return findDomain(domainId).orElseThrow();
    }

    public Optional<DomainView> findDomain(Integer domainId) {
        List<DomainView> rows = jdbcTemplate.query("""
                SELECT university_domain_id, university_id, domain, status, verified_at, created_at
                FROM university_domains
                WHERE university_domain_id = ?
                """, (rs, rowNum) -> mapDomain(rs), domainId);
        return rows.stream().findFirst();
    }

    public Optional<DomainMatch> findActiveDomainMatch(String emailDomain) {
        List<DomainMatch> rows = jdbcTemplate.query("""
                SELECT d.university_id, u.name, d.domain
                FROM university_domains d
                JOIN universities u ON u.university_id = d.university_id
                WHERE d.status = 'ACTIVE'
                  AND u.status = 'ACTIVE'
                  AND LOWER(d.domain) = LOWER(?)
                LIMIT 1
                """, (rs, rowNum) -> new DomainMatch(
                        rs.getInt("university_id"),
                        rs.getString("name"),
                        rs.getString("domain")), emailDomain);
        return rows.stream().findFirst();
    }

    public Optional<RosterMatch> findActiveRosterByEmail(String email) {
        List<RosterMatch> rows = jdbcTemplate.query("""
                SELECT r.roster_id, r.university_id, u.name AS university_name, r.email, r.student_code,
                       r.full_name, r.faculty, r.academic_year, r.status
                FROM university_student_rosters r
                JOIN universities u ON u.university_id = r.university_id
                WHERE r.status = 'ACTIVE'
                  AND u.status = 'ACTIVE'
                  AND LOWER(r.email) = LOWER(?)
                LIMIT 1
                """, (rs, rowNum) -> new RosterMatch(
                        rs.getLong("roster_id"),
                        rs.getInt("university_id"),
                        rs.getString("university_name"),
                        rs.getString("email"),
                        rs.getString("student_code"),
                        rs.getString("full_name"),
                        rs.getString("faculty"),
                        (Integer) rs.getObject("academic_year"),
                        rs.getString("status")), email);
        return rows.stream().findFirst();
    }

    public void matchRosterToUser(Long rosterId, Integer userId) {
        jdbcTemplate.update("""
                UPDATE university_student_rosters
                SET matched_user_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE roster_id = ?
                """, userId, rosterId);
    }

    public boolean studentCodeBelongsToOtherUser(String studentCode, Integer userId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM students
                    WHERE student_code = ?
                      AND user_id <> ?
                )
                """, Boolean.class, studentCode, userId);
        return Boolean.TRUE.equals(exists);
    }

    public void upsertStudentFromRoster(Integer userId, RosterMatch roster) {
        List<String> existingStudentCodes = jdbcTemplate.queryForList("""
                SELECT student_code
                FROM students
                WHERE user_id = ?
                """, String.class, userId);
        if (existingStudentCodes.isEmpty()) {
            jdbcTemplate.update("""
                    INSERT INTO students(student_code, user_id, university, university_id, faculty, academic_year)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, roster.studentCode(), userId, roster.universityName(), roster.universityId(),
                    roster.faculty(), roster.academicYear());
        } else {
            jdbcTemplate.update("""
                    UPDATE students
                    SET student_code = ?,
                        university = ?,
                        university_id = ?,
                        faculty = ?,
                        academic_year = ?
                    WHERE user_id = ?
                    """, roster.studentCode(), roster.universityName(), roster.universityId(),
                    roster.faculty(), roster.academicYear(), userId);
        }
        jdbcTemplate.update("""
                UPDATE users
                SET full_name = CASE WHEN full_name IS NULL OR full_name = email THEN ? ELSE full_name END,
                    student_verification_status = 'VERIFIED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """, roster.fullName(), userId);
    }

    public StudentUniversityView studentUniversity(Integer userId) {
        List<StudentUniversityView> rows = jdbcTemplate.query("""
                SELECT s.university_id, u.name AS university_name, u.short_name, s.student_code,
                       r.status AS roster_status,
                       CASE
                           WHEN s.university_id IS NOT NULL AND usr.student_verification_status = 'VERIFIED' THEN 'VERIFIED'
                           WHEN d.university_id IS NOT NULL THEN 'DOMAIN_MATCH'
                           ELSE 'NOT_LINKED'
                       END AS link_status,
                       du.name AS domain_hint,
                       usr.student_verification_status
                FROM users usr
                LEFT JOIN students s ON s.user_id = usr.user_id
                LEFT JOIN universities u ON u.university_id = s.university_id
                LEFT JOIN university_student_rosters r ON LOWER(r.email) = LOWER(usr.email) AND r.status = 'ACTIVE'
                LEFT JOIN university_domains d ON d.domain = SUBSTRING(LOWER(usr.email) FROM POSITION('@' IN LOWER(usr.email)) + 1) AND d.status = 'ACTIVE'
                LEFT JOIN universities du ON du.university_id = d.university_id
                WHERE usr.user_id = ?
                LIMIT 1
                """, (rs, rowNum) -> new StudentUniversityView(
                        (Integer) rs.getObject("university_id"),
                        rs.getString("university_name"),
                        rs.getString("short_name"),
                        rs.getString("student_code"),
                        rs.getString("roster_status"),
                        rs.getString("link_status"),
                        rs.getString("domain_hint"),
                        rs.getString("student_verification_status")), userId);
        return rows.isEmpty()
                ? new StudentUniversityView(null, null, null, null, null, "NOT_LINKED", null, null)
                : rows.get(0);
    }

    public List<RosterStudentView> findRoster(Integer universityId, String keyword, String status) {
        String like = blank(keyword) ? null : "%" + keyword.trim().toLowerCase() + "%";
        String normalizedStatus = blank(status) || "all".equalsIgnoreCase(status) ? null : status.trim().toUpperCase();
        List<Object> params = new ArrayList<>();
        params.add(universityId);
        StringBuilder where = new StringBuilder("WHERE university_id = ?\n");
        if (like != null) {
            where.append("AND (LOWER(email) LIKE ? OR LOWER(student_code) LIKE ? OR LOWER(full_name) LIKE ?)\n");
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (normalizedStatus != null) {
            where.append("AND status = ?\n");
            params.add(normalizedStatus);
        }
        return jdbcTemplate.query("""
                SELECT roster_id, university_id, email, student_code, full_name, faculty, academic_year,
                       status, matched_user_id, created_at, updated_at
                FROM university_student_rosters
                """ + where + """
                ORDER BY updated_at DESC NULLS LAST, created_at DESC, roster_id DESC
                LIMIT 200
                """, (rs, rowNum) -> mapRoster(rs), params.toArray());
    }

    public Long createImportBatch(Integer universityId, String fileName, Integer importedByUserId) {
        return insertAndReturnLong("""
                INSERT INTO university_import_batches(university_id, file_name, imported_by_user_id)
                VALUES (?, ?, ?)
                """, "import_batch_id", universityId, fileName, importedByUserId);
    }

    public void upsertRoster(Integer universityId, String email, String studentCode, String fullName, String faculty,
            Integer academicYear, String status, Long batchId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM university_student_rosters
                WHERE university_id = ?
                  AND LOWER(email) = LOWER(?)
                """, Integer.class, universityId, email);
        if (count != null && count > 0) {
            jdbcTemplate.update("""
                    UPDATE university_student_rosters
                    SET student_code = ?,
                        full_name = ?,
                        faculty = ?,
                        academic_year = ?,
                        status = ?,
                        imported_batch_id = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE university_id = ?
                      AND LOWER(email) = LOWER(?)
                    """, studentCode, fullName, faculty, academicYear, status, batchId, universityId, email);
            return;
        }
        jdbcTemplate.update("""
                INSERT INTO university_student_rosters(university_id, email, student_code, full_name, faculty, academic_year, status, imported_batch_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, universityId, email, studentCode, fullName, faculty, academicYear, status, batchId);
    }

    public void addImportError(Long batchId, int rowNumber, String fieldName, String rawValue, String errorMessage) {
        jdbcTemplate.update("""
                INSERT INTO university_import_errors(import_batch_id, row_number, field_name, raw_value, error_message)
                VALUES (?, ?, ?, ?, ?)
                """, batchId, rowNumber, fieldName, rawValue, errorMessage);
    }

    public ImportBatchView completeImportBatch(Long batchId, int totalRows, int successRows, int errorRows) {
        String status = errorRows == 0 ? "COMPLETED" : successRows == 0 ? "FAILED" : "COMPLETED_WITH_ERRORS";
        jdbcTemplate.update("""
                UPDATE university_import_batches
                SET total_rows = ?, success_rows = ?, error_rows = ?, status = ?, completed_at = CURRENT_TIMESTAMP
                WHERE import_batch_id = ?
                """, totalRows, successRows, errorRows, status, batchId);
        return findImportBatch(batchId).orElseThrow();
    }

    public Optional<ImportBatchView> findImportBatch(Long batchId) {
        List<ImportBatchView> rows = jdbcTemplate.query("""
                SELECT import_batch_id, university_id, file_name, total_rows, success_rows, error_rows,
                       status, created_at, completed_at
                FROM university_import_batches
                WHERE import_batch_id = ?
                """, (rs, rowNum) -> mapImportBatch(rs, findImportErrors(batchId)), batchId);
        return rows.stream().findFirst();
    }

    public List<ImportBatchView> findImportBatches(Integer universityId) {
        return jdbcTemplate.query("""
                SELECT import_batch_id, university_id, file_name, total_rows, success_rows, error_rows,
                       status, created_at, completed_at
                FROM university_import_batches
                WHERE university_id = ?
                ORDER BY created_at DESC, import_batch_id DESC
                LIMIT 50
                """, (rs, rowNum) -> mapImportBatch(rs, List.of()), universityId);
    }

    public List<ImportErrorView> findImportErrors(Long batchId) {
        return jdbcTemplate.query("""
                SELECT import_error_id, import_batch_id, row_number, field_name, raw_value, error_message
                FROM university_import_errors
                WHERE import_batch_id = ?
                ORDER BY row_number, import_error_id
                """, (rs, rowNum) -> new ImportErrorView(
                        rs.getLong("import_error_id"),
                        rs.getLong("import_batch_id"),
                        rs.getInt("row_number"),
                        rs.getString("field_name"),
                        rs.getString("raw_value"),
                        rs.getString("error_message")), batchId);
    }

    public List<UniversityAdminView> findUniversityAdmins(Integer universityId) {
        List<Object> params = new ArrayList<>();
        String where = "";
        if (universityId != null) {
            where = "WHERE ua.university_id = ?\n";
            params.add(universityId);
        }
        return jdbcTemplate.query("""
                SELECT ua.university_admin_id, ua.university_id, uni.name AS university_name,
                       u.user_id, u.email, u.full_name, u.phone_number, ua.title, ua.status, ua.assigned_at
                FROM university_admins ua
                JOIN universities uni ON uni.university_id = ua.university_id
                JOIN users u ON u.user_id = ua.user_id
                """ + where + """
                ORDER BY ua.assigned_at DESC, ua.university_admin_id DESC
                """, (rs, rowNum) -> mapUniversityAdmin(rs), params.toArray());
    }

    public Optional<UniversityAdminView> findUniversityAdminByUser(Integer userId) {
        List<UniversityAdminView> rows = jdbcTemplate.query("""
                SELECT ua.university_admin_id, ua.university_id, uni.name AS university_name,
                       u.user_id, u.email, u.full_name, u.phone_number, ua.title, ua.status, ua.assigned_at
                FROM university_admins ua
                JOIN universities uni ON uni.university_id = ua.university_id
                JOIN users u ON u.user_id = ua.user_id
                WHERE ua.user_id = ?
                  AND ua.status = 'ACTIVE'
                  AND u.status = 'ACTIVE'
                LIMIT 1
                """, (rs, rowNum) -> mapUniversityAdmin(rs), userId);
        return rows.stream().findFirst();
    }

    public UniversityAdminView createUniversityAdmin(Integer universityId, Integer userId, String title, Integer assignedByUserId) {
        Integer id = insertAndReturnInt("""
                INSERT INTO university_admins(university_id, user_id, title, assigned_by_user_id)
                VALUES (?, ?, ?, ?)
                """, "university_admin_id", universityId, userId, title, assignedByUserId);
        return findUniversityAdmin(id).orElseThrow();
    }

    public Optional<UniversityAdminView> findUniversityAdmin(Integer universityAdminId) {
        List<UniversityAdminView> rows = jdbcTemplate.query("""
                SELECT ua.university_admin_id, ua.university_id, uni.name AS university_name,
                       u.user_id, u.email, u.full_name, u.phone_number, ua.title, ua.status, ua.assigned_at
                FROM university_admins ua
                JOIN universities uni ON uni.university_id = ua.university_id
                JOIN users u ON u.user_id = ua.user_id
                WHERE ua.university_admin_id = ?
                """, (rs, rowNum) -> mapUniversityAdmin(rs), universityAdminId);
        return rows.stream().findFirst();
    }

    public List<RouteUniversityView> findRouteUniversities(Integer universityId) {
        List<Object> params = new ArrayList<>();
        String where = "";
        if (universityId != null) {
            where = "WHERE ru.university_id = ?\n";
            params.add(universityId);
        }
        return jdbcTemplate.query("""
                SELECT ru.route_university_id, ru.route_id, r.route_name, ru.university_id, u.name AS university_name,
                       ru.campus_id, c.name AS campus_name, ru.active_from, ru.active_until, ru.status
                FROM route_universities ru
                JOIN routes r ON r.route_id = ru.route_id
                JOIN universities u ON u.university_id = ru.university_id
                LEFT JOIN campuses c ON c.campus_id = ru.campus_id
                """ + where + """
                ORDER BY u.name, r.route_name
                """, (rs, rowNum) -> mapRouteUniversity(rs), params.toArray());
    }

    public RouteUniversityView createRouteUniversity(Integer routeId, Integer universityId, Integer campusId,
            LocalDate activeFrom, LocalDate activeUntil, String status) {
        Integer id = insertAndReturnInt("""
                INSERT INTO route_universities(route_id, university_id, campus_id, active_from, active_until, status)
                VALUES (?, ?, ?, ?, ?, ?)
                """, "route_university_id", routeId, universityId, campusId, activeFrom, activeUntil, status);
        return findRouteUniversity(id).orElseThrow();
    }

    public Optional<RouteUniversityView> findRouteUniversity(Integer routeUniversityId) {
        List<RouteUniversityView> rows = jdbcTemplate.query("""
                SELECT ru.route_university_id, ru.route_id, r.route_name, ru.university_id, u.name AS university_name,
                       ru.campus_id, c.name AS campus_name, ru.active_from, ru.active_until, ru.status
                FROM route_universities ru
                JOIN routes r ON r.route_id = ru.route_id
                JOIN universities u ON u.university_id = ru.university_id
                LEFT JOIN campuses c ON c.campus_id = ru.campus_id
                WHERE ru.route_university_id = ?
                """, (rs, rowNum) -> mapRouteUniversity(rs), routeUniversityId);
        return rows.stream().findFirst();
    }

    public List<SubsidyPolicyView> findSubsidyPolicies(Integer universityId) {
        List<Object> params = new ArrayList<>();
        String where = "";
        if (universityId != null) {
            where = "WHERE sp.university_id = ?\n";
            params.add(universityId);
        }
        return jdbcTemplate.query("""
                SELECT sp.subsidy_policy_id, sp.university_id, u.name AS university_name, sp.campus_id, c.name AS campus_name,
                       sp.policy_name, sp.subsidy_type, sp.value, sp.max_amount, sp.active_from, sp.active_until, sp.status
                FROM subsidy_policies sp
                JOIN universities u ON u.university_id = sp.university_id
                LEFT JOIN campuses c ON c.campus_id = sp.campus_id
                """ + where + """
                ORDER BY sp.active_from DESC, sp.subsidy_policy_id DESC
                """, (rs, rowNum) -> mapSubsidyPolicy(rs), params.toArray());
    }

    public SubsidyPolicyView createSubsidyPolicy(Integer universityId, Integer campusId, String policyName,
            String subsidyType, BigDecimal value, BigDecimal maxAmount, LocalDate activeFrom, LocalDate activeUntil,
            String status) {
        Integer id = insertAndReturnInt("""
                INSERT INTO subsidy_policies(university_id, campus_id, policy_name, subsidy_type, "value", max_amount, active_from, active_until, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, "subsidy_policy_id", universityId, campusId, policyName, subsidyType, value, maxAmount, activeFrom, activeUntil, status);
        return findSubsidyPolicy(id).orElseThrow();
    }

    public Optional<SubsidyPolicyView> findSubsidyPolicy(Integer policyId) {
        List<SubsidyPolicyView> rows = jdbcTemplate.query("""
                SELECT sp.subsidy_policy_id, sp.university_id, u.name AS university_name, sp.campus_id, c.name AS campus_name,
                       sp.policy_name, sp.subsidy_type, sp.value, sp.max_amount, sp.active_from, sp.active_until, sp.status
                FROM subsidy_policies sp
                JOIN universities u ON u.university_id = sp.university_id
                LEFT JOIN campuses c ON c.campus_id = sp.campus_id
                WHERE sp.subsidy_policy_id = ?
                """, (rs, rowNum) -> mapSubsidyPolicy(rs), policyId);
        return rows.stream().findFirst();
    }

    public UniversityStatsView stats(Integer universityId) {
        UniversityStatsBase base = jdbcTemplate.queryForObject("""
                SELECT u.university_id, u.name,
                       COUNT(DISTINCT s.student_code) FILTER (
                           WHERE o.id IS NOT NULL
                              OR mp.monthly_pass_id IS NOT NULL
                              OR st.single_trip_ticket_id IS NOT NULL
                              OR th.travel_history_id IS NOT NULL
                       ) AS active_roster_students,
                       COUNT(DISTINCT s.student_code) AS matched_students,
                       COUNT(DISTINCT d.university_domain_id) FILTER (WHERE d.status = 'ACTIVE') AS active_domains,
                       COUNT(DISTINCT c.campus_id) FILTER (WHERE c.status = 'ACTIVE') AS active_campuses,
                       COUNT(DISTINCT ru.route_university_id) FILTER (WHERE ru.status = 'ACTIVE') AS active_routes,
                       COUNT(DISTINCT sp.subsidy_policy_id) FILTER (WHERE sp.status = 'ACTIVE') AS active_subsidy_policies,
                       COALESCE(SUM(DISTINCT mp.subsidy_amount), 0) AS total_subsidy_amount,
                       COUNT(DISTINCT mp.monthly_pass_id) AS monthly_passes
                FROM universities u
                LEFT JOIN university_student_rosters r ON r.university_id = u.university_id
                LEFT JOIN university_domains d ON d.university_id = u.university_id
                LEFT JOIN campuses c ON c.university_id = u.university_id
                LEFT JOIN route_universities ru ON ru.university_id = u.university_id
                LEFT JOIN subsidy_policies sp ON sp.university_id = u.university_id
                LEFT JOIN students s ON s.university_id = u.university_id
                LEFT JOIN monthly_passes mp ON mp.student_code = s.student_code
                LEFT JOIN single_trip_tickets st ON st.student_code = s.student_code
                LEFT JOIN travel_history th ON th.student_code = s.student_code
                LEFT JOIN tb_orders o ON o.student_code = s.student_code
                WHERE u.university_id = ?
                GROUP BY u.university_id, u.name
                """, (rs, rowNum) -> new UniversityStatsBase(
                        rs.getInt("university_id"),
                        rs.getString("name"),
                        rs.getInt("active_roster_students"),
                        rs.getInt("matched_students"),
                        rs.getInt("active_domains"),
                        rs.getInt("active_campuses"),
                        rs.getInt("active_routes"),
                        rs.getInt("active_subsidy_policies"),
                        rs.getBigDecimal("total_subsidy_amount"),
                        rs.getInt("monthly_passes")), universityId);
        LocalDate today = LocalDate.now();
        return new UniversityStatsView(
                base.universityId(),
                base.universityName(),
                base.activeRosterStudents(),
                base.matchedStudents(),
                base.activeDomains(),
                base.activeCampuses(),
                base.activeRoutes(),
                base.activeSubsidyPolicies(),
                base.totalSubsidyAmount(),
                base.monthlyPasses(),
                passesByRoute(universityId, today.withDayOfMonth(1), today.withDayOfMonth(1).plusMonths(1)),
                universityTripsSeries(universityId, today.minusDays(6), today),
                subsidyDistribution(universityId));
    }

    private List<PassesByRoutePoint> passesByRoute(Integer universityId, LocalDate from, LocalDate toExclusive) {
        return jdbcTemplate.query("""
                SELECT r.route_id, r.route_code, r.route_name, r.color_hex,
                       COUNT(DISTINCT mp.monthly_pass_id) AS passes
                FROM route_universities ru
                JOIN routes r ON r.route_id = ru.route_id
                LEFT JOIN students s ON s.university_id = ru.university_id
                LEFT JOIN monthly_passes mp ON mp.student_code = s.student_code
                    AND mp.route_id = r.route_id
                    AND CAST(mp.purchased_at AS date) >= ?
                    AND CAST(mp.purchased_at AS date) < ?
                WHERE ru.university_id = ?
                  AND ru.status = 'ACTIVE'
                GROUP BY r.route_id, r.route_code, r.route_name, r.color_hex
                ORDER BY r.route_code, r.route_name
                """, (rs, rowNum) -> new PassesByRoutePoint(
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("color_hex"),
                        rs.getInt("passes")), from, toExclusive, universityId);
    }

    private List<UniversityTripsSeriesPoint> universityTripsSeries(
            Integer universityId, LocalDate from, LocalDate to) {
        Map<LocalDate, Integer> values = new HashMap<>();
        jdbcTemplate.query("""
                SELECT CAST(th.boarded_at AS date) AS series_date, COUNT(*) AS trips
                FROM travel_history th
                JOIN students s ON s.student_code = th.student_code
                WHERE s.university_id = ?
                  AND CAST(th.boarded_at AS date) BETWEEN ? AND ?
                GROUP BY CAST(th.boarded_at AS date)
                ORDER BY series_date
                """, rs -> {
                    values.put(rs.getObject("series_date", LocalDate.class), rs.getInt("trips"));
                }, universityId, from, to);
        return from.datesUntil(to.plusDays(1))
                .map(date -> new UniversityTripsSeriesPoint(
                        dayLabel(date), date, values.getOrDefault(date, 0)))
                .toList();
    }

    private List<SubsidyDistributionPoint> subsidyDistribution(Integer universityId) {
        String[] colors = {"#144fcc", "#0f9d76", "#eaa21a", "#d84c7f", "#6f5bd3"};
        List<SubsidyPolicyView> policies = findSubsidyPolicies(universityId).stream()
                .filter(policy -> "ACTIVE".equalsIgnoreCase(policy.status()))
                .toList();
        List<SubsidyDistributionPoint> result = new ArrayList<>();
        for (int index = 0; index < policies.size(); index++) {
            SubsidyPolicyView policy = policies.get(index);
            result.add(new SubsidyDistributionPoint(
                    policy.policyName(),
                    policy.subsidyType(),
                    policy.value(),
                    colors[index % colors.length]));
        }
        return result;
    }

    private String dayLabel(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    private record UniversityStatsBase(
            Integer universityId,
            String universityName,
            int activeRosterStudents,
            int matchedStudents,
            int activeDomains,
            int activeCampuses,
            int activeRoutes,
            int activeSubsidyPolicies,
            BigDecimal totalSubsidyAmount,
            int monthlyPasses) {
    }

    public ReconciliationView reconciliation(Integer universityId, LocalDate from, LocalDate to) {
        return jdbcTemplate.queryForObject("""
                WITH order_rollup AS (
                    SELECT s.university_id,
                           COUNT(o.id) AS total_orders,
                           COUNT(*) FILTER (WHERE o.order_mode = 'journey-combo') AS journey_orders,
                           COUNT(*) FILTER (WHERE o.ticket_period = 'day') AS day_tickets,
                           COUNT(*) FILTER (WHERE o.ticket_period = 'month') AS monthly_order_count,
                           COALESCE(SUM(CASE WHEN o.original_amount > 0 THEN o.original_amount ELSE o.total END), 0) AS original_amount,
                           COALESCE(SUM(o.subsidy_amount), 0) AS subsidy_amount,
                           COALESCE(SUM(CASE WHEN o.final_amount > 0 THEN o.final_amount WHEN o.original_amount > 0 AND o.subsidy_amount >= o.original_amount THEN 0 ELSE o.total END), 0) AS final_amount
                    FROM tb_orders o
                    JOIN students s ON s.student_code = o.student_code
                    WHERE o.created_at::date BETWEEN ? AND ?
                      AND LOWER(o.payment_status) = 'paid'
                    GROUP BY s.university_id
                ), pass_rollup AS (
                    SELECT s.university_id,
                           COUNT(mp.monthly_pass_id) AS monthly_passes,
                           COALESCE(SUM(mp.original_fare_amount), 0) AS original_amount,
                           COALESCE(SUM(mp.subsidy_amount), 0) AS subsidy_amount,
                           COALESCE(SUM(mp.final_fare_amount), 0) AS final_amount
                    FROM monthly_passes mp
                    JOIN students s ON s.student_code = mp.student_code
                    WHERE mp.purchased_at::date BETWEEN ? AND ?
                    GROUP BY s.university_id
                )
                SELECT u.university_id, u.name,
                       COALESCE(NULLIF(o.original_amount, 0), p.original_amount, 0) AS total_original_amount,
                       COALESCE(NULLIF(o.subsidy_amount, 0), p.subsidy_amount, 0) AS total_subsidy_amount,
                       COALESCE(NULLIF(o.final_amount, 0), p.final_amount, 0) AS total_final_amount,
                       COALESCE(o.total_orders, 0) AS total_orders,
                       COALESCE(o.journey_orders, 0) AS journey_orders,
                       COALESCE(o.day_tickets, 0) AS day_tickets,
                       COALESCE(p.monthly_passes, o.monthly_order_count, 0) AS monthly_passes
                FROM universities u
                LEFT JOIN order_rollup o ON o.university_id = u.university_id
                LEFT JOIN pass_rollup p ON p.university_id = u.university_id
                WHERE u.university_id = ?
                """, (rs, rowNum) -> new ReconciliationView(
                        rs.getInt("university_id"),
                        rs.getString("name"),
                        rs.getBigDecimal("total_original_amount"),
                        rs.getBigDecimal("total_subsidy_amount"),
                        rs.getBigDecimal("total_final_amount"),
                        rs.getInt("total_orders"),
                        rs.getInt("journey_orders"),
                        rs.getInt("day_tickets"),
                        rs.getInt("monthly_passes"),
                        from,
                        to), from, to, from, to, universityId);
    }

    public List<PaymentTransactionView> paymentTransactions(Integer universityId) {
        List<Object> params = new ArrayList<>();
        String universityFilter = "";
        if (universityId != null) {
            universityFilter = "AND s.university_id = ?\n";
            params.add(universityId);
        }
        return jdbcTemplate.query("""
                SELECT o.id AS order_id,
                       tx.id AS transaction_id,
                       tx.sepay_transaction_id,
                       o.student_code,
                       COALESCE(u.full_name, o.student_code) AS student_name,
                       s.university_id,
                       uni.name AS university_name,
                       o.ticket_type,
                       o.order_mode,
                       o.ticket_period,
                       o.origin_label,
                       o.destination_label,
                       o.legs_json::text AS legs_json,
                       CASE WHEN jsonb_typeof(o.legs_json) = 'array' THEN jsonb_array_length(o.legs_json) ELSE 0 END AS legs_count,
                       o.route_id,
                       r.route_name,
                       o.total AS order_total,
                       CASE WHEN o.original_amount > 0 THEN o.original_amount ELSE o.total END AS original_amount,
                       o.subsidy_amount,
                       CASE WHEN o.final_amount > 0 THEN o.final_amount WHEN o.original_amount > 0 AND o.subsidy_amount >= o.original_amount THEN 0 ELSE o.total END AS final_amount,
                       o.payment_status,
                       tx.gateway,
                       COALESCE(tx.amount_in, 0) AS amount_in,
                       COALESCE(tx.amount_out, 0) AS amount_out,
                       tx.transaction_content,
                       tx.reference_number,
                       tx.transaction_date,
                       o.paid_at,
                       o.created_at
                FROM tb_orders o
                LEFT JOIN students s ON s.student_code = o.student_code
                LEFT JOIN users u ON u.user_id = s.user_id
                LEFT JOIN universities uni ON uni.university_id = s.university_id
                LEFT JOIN routes r ON r.route_id = o.route_id
                LEFT JOIN LATERAL (
                    SELECT t.*
                    FROM tb_transactions t
                    WHERE t.matched_order_id = o.id
                    ORDER BY t.created_at DESC, t.id DESC
                    LIMIT 1
                ) tx ON true
                WHERE 1 = 1
                """ + universityFilter + """
                ORDER BY CASE WHEN o.payment_status = 'Unpaid' THEN 0 ELSE 1 END,
                         o.created_at DESC,
                         o.id DESC
                LIMIT 300
                """, (rs, rowNum) -> new PaymentTransactionView(
                        rs.getLong("order_id"),
                        getLong(rs, "transaction_id"),
                        getLong(rs, "sepay_transaction_id"),
                        rs.getString("student_code"),
                        rs.getString("student_name"),
                        (Integer) rs.getObject("university_id"),
                        rs.getString("university_name"),
                        rs.getString("ticket_type"),
                        rs.getString("order_mode"),
                        rs.getString("ticket_period"),
                        rs.getString("origin_label"),
                        rs.getString("destination_label"),
                        rs.getString("legs_json"),
                        rs.getInt("legs_count"),
                        (Integer) rs.getObject("route_id"),
                        rs.getString("route_name"),
                        rs.getBigDecimal("order_total"),
                        rs.getBigDecimal("original_amount"),
                        rs.getBigDecimal("subsidy_amount"),
                        rs.getBigDecimal("final_amount"),
                        rs.getString("payment_status"),
                        rs.getString("gateway"),
                        rs.getBigDecimal("amount_in"),
                        rs.getBigDecimal("amount_out"),
                        rs.getString("transaction_content"),
                        rs.getString("reference_number"),
                        toOffset(rs.getTimestamp("transaction_date")),
                        toOffset(rs.getTimestamp("paid_at")),
                        toOffset(rs.getTimestamp("created_at"))),
                params.toArray());
    }

    public List<AuditLogView> findAuditLogs(Integer universityId, String action) {
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        if (universityId != null) {
            where.append("AND al.university_id = ?\n");
            params.add(universityId);
        }
        if (!blank(action)) {
            where.append("AND al.action = ?\n");
            params.add(action.trim());
        }
        return jdbcTemplate.query("""
                SELECT al.audit_log_id, al.performed_by_user_id, performer.full_name AS performer_name,
                       al.university_id, u.name AS university_name, al.action, al.affected_table,
                       al.affected_record_id, al.result, al.request_id, al.notes, al.performed_at
                FROM audit_logs al
                LEFT JOIN users performer ON performer.user_id = al.performed_by_user_id
                LEFT JOIN universities u ON u.university_id = al.university_id
                """ + where + """
                ORDER BY al.performed_at DESC, al.audit_log_id DESC
                LIMIT 200
                """, (rs, rowNum) -> mapAudit(rs), params.toArray());
    }

    public void audit(Integer performedByUserId, Integer universityId, String action, String affectedTable,
            String affectedRecordId, String result, String requestId, String notes) {
        jdbcTemplate.update("""
                INSERT INTO audit_logs(performed_by_user_id, university_id, action, affected_table,
                                       affected_record_id, result, request_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, performedByUserId, universityId, action, affectedTable, affectedRecordId, result, requestId, notes);
    }

    public int notifyUniversityStudents(Integer universityId, Integer senderUserId, String title, String content) {
        return jdbcTemplate.update("""
                INSERT INTO notifications(recipient_user_id, sender_user_id, title, content, notification_type)
                SELECT DISTINCT s.user_id, ?, ?, ?, 'SYSTEM'
                FROM students s
                JOIN users u ON u.user_id = s.user_id
                WHERE s.university_id = ?
                  AND u.status = 'ACTIVE'
                """, senderUserId, title, content, universityId);
    }

    public Integer createUser(String email, String passwordHash, String fullName, String phoneNumber, String role) {
        return insertAndReturnInt("""
                INSERT INTO users(email, password_hash, full_name, phone_number, role, status, email_verified_at, created_at)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, "user_id", email, passwordHash, fullName, phoneNumber, role);
    }

    public boolean existsUserByEmail(String email) {
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER(?))",
                Boolean.class,
                email);
        return Boolean.TRUE.equals(exists);
    }

    private UniversityView mapUniversity(ResultSet rs) throws SQLException {
        return new UniversityView(
                rs.getInt("university_id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("short_name"),
                rs.getString("contact_email"),
                rs.getString("status"),
                rs.getInt("campus_count"),
                rs.getInt("domain_count"),
                rs.getInt("roster_count"),
                toOffset(rs.getTimestamp("created_at")));
    }

    private CampusView mapCampus(ResultSet rs) throws SQLException {
        return new CampusView(
                rs.getInt("campus_id"),
                rs.getInt("university_id"),
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("address"),
                rs.getBigDecimal("latitude"),
                rs.getBigDecimal("longitude"),
                rs.getString("status"));
    }

    private DomainView mapDomain(ResultSet rs) throws SQLException {
        return new DomainView(
                rs.getInt("university_domain_id"),
                rs.getInt("university_id"),
                rs.getString("domain"),
                rs.getString("status"),
                toOffset(rs.getTimestamp("verified_at")),
                toOffset(rs.getTimestamp("created_at")));
    }

    private RosterStudentView mapRoster(ResultSet rs) throws SQLException {
        return new RosterStudentView(
                rs.getLong("roster_id"),
                rs.getInt("university_id"),
                rs.getString("email"),
                rs.getString("student_code"),
                rs.getString("full_name"),
                rs.getString("faculty"),
                (Integer) rs.getObject("academic_year"),
                rs.getString("status"),
                (Integer) rs.getObject("matched_user_id"),
                toOffset(rs.getTimestamp("created_at")),
                toOffset(rs.getTimestamp("updated_at")));
    }

    private ImportBatchView mapImportBatch(ResultSet rs, List<ImportErrorView> errors) throws SQLException {
        return new ImportBatchView(
                rs.getLong("import_batch_id"),
                rs.getInt("university_id"),
                rs.getString("file_name"),
                rs.getInt("total_rows"),
                rs.getInt("success_rows"),
                rs.getInt("error_rows"),
                rs.getString("status"),
                toOffset(rs.getTimestamp("created_at")),
                toOffset(rs.getTimestamp("completed_at")),
                errors);
    }

    private UniversityAdminView mapUniversityAdmin(ResultSet rs) throws SQLException {
        return new UniversityAdminView(
                rs.getInt("university_admin_id"),
                rs.getInt("university_id"),
                rs.getString("university_name"),
                rs.getInt("user_id"),
                rs.getString("email"),
                rs.getString("full_name"),
                rs.getString("phone_number"),
                rs.getString("title"),
                rs.getString("status"),
                toOffset(rs.getTimestamp("assigned_at")));
    }

    private RouteUniversityView mapRouteUniversity(ResultSet rs) throws SQLException {
        return new RouteUniversityView(
                rs.getInt("route_university_id"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getInt("university_id"),
                rs.getString("university_name"),
                (Integer) rs.getObject("campus_id"),
                rs.getString("campus_name"),
                rs.getObject("active_from", LocalDate.class),
                rs.getObject("active_until", LocalDate.class),
                rs.getString("status"));
    }

    private SubsidyPolicyView mapSubsidyPolicy(ResultSet rs) throws SQLException {
        return new SubsidyPolicyView(
                rs.getInt("subsidy_policy_id"),
                rs.getInt("university_id"),
                rs.getString("university_name"),
                (Integer) rs.getObject("campus_id"),
                rs.getString("campus_name"),
                rs.getString("policy_name"),
                rs.getString("subsidy_type"),
                rs.getBigDecimal("value"),
                rs.getBigDecimal("max_amount"),
                rs.getObject("active_from", LocalDate.class),
                rs.getObject("active_until", LocalDate.class),
                rs.getString("status"));
    }

    private AuditLogView mapAudit(ResultSet rs) throws SQLException {
        return new AuditLogView(
                rs.getLong("audit_log_id"),
                rs.getInt("performed_by_user_id"),
                rs.getString("performer_name"),
                (Integer) rs.getObject("university_id"),
                rs.getString("university_name"),
                rs.getString("action"),
                rs.getString("affected_table"),
                rs.getString("affected_record_id"),
                rs.getString("result"),
                rs.getString("request_id"),
                rs.getString("notes"),
                toOffset(rs.getTimestamp("performed_at")));
    }

    private OffsetDateTime toOffset(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    private Long getLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private Integer insertAndReturnInt(String sql, String keyColumn, Object... params) {
        return insertAndReturnKey(sql, keyColumn, params).intValue();
    }

    private Long insertAndReturnLong(String sql, String keyColumn, Object... params) {
        return insertAndReturnKey(sql, keyColumn, params).longValue();
    }

    private Number insertAndReturnKey(String sql, String keyColumn, Object... params) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, new String[] { keyColumn });
            for (int index = 0; index < params.length; index++) {
                statement.setObject(index + 1, params[index]);
            }
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key != null) {
            return key;
        }
        Object keyedValue = keyHolder.getKeys() == null ? null : keyHolder.getKeys().get(keyColumn);
        if (keyedValue == null && keyHolder.getKeys() != null) {
            keyedValue = keyHolder.getKeys().get(keyColumn.toUpperCase());
        }
        if (keyedValue instanceof Number number) {
            return number;
        }
        throw new IllegalStateException("No generated key returned for " + keyColumn);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    public record DomainMatch(Integer universityId, String universityName, String domain) {
    }

    public record RosterMatch(
            Long rosterId,
            Integer universityId,
            String universityName,
            String email,
            String studentCode,
            String fullName,
            String faculty,
            Integer academicYear,
            String status) {
    }
}
