package com.unibus.api.university;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UniversitySubsidyRepository {

    private final JdbcTemplate jdbcTemplate;

    public UniversitySubsidyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<StudentUniversity> findStudentUniversity(Integer userId) {
        List<StudentUniversity> rows = jdbcTemplate.query("""
                SELECT s.student_code, s.university_id, s.university AS university_name,
                       u.student_verification_status
                FROM users u
                LEFT JOIN students s ON s.user_id = u.user_id
                WHERE u.user_id = ?
                """, (rs, rowNum) -> new StudentUniversity(
                        rs.getString("student_code"),
                        (Integer) rs.getObject("university_id"),
                        rs.getString("university_name"),
                        rs.getString("student_verification_status")), userId);
        return rows.stream().findFirst();
    }

    public Optional<Integer> findUniversityIdByName(String name) {
        if (name == null || name.isBlank()) {
            return Optional.empty();
        }
        List<Integer> rows = jdbcTemplate.queryForList("""
                SELECT university_id
                FROM universities
                WHERE lower(trim(name)) = lower(trim(?))
                LIMIT 1
                """, Integer.class, name);
        return rows.stream().findFirst();
    }

    public Set<Integer> activeLinkedRouteIds(Integer universityId, LocalDate serviceDate) {
        if (universityId == null) {
            return Set.of();
        }
        return jdbcTemplate.queryForList("""
                SELECT DISTINCT route_id
                FROM route_universities
                WHERE university_id = ?
                  AND status = 'ACTIVE'
                  AND active_from <= ?
                  AND (active_until IS NULL OR active_until >= ?)
                """, Integer.class, universityId, serviceDate, serviceDate).stream().collect(Collectors.toSet());
    }

    public boolean isRouteLinked(Integer universityId, Integer routeId, LocalDate serviceDate) {
        if (universityId == null || routeId == null) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM route_universities
                WHERE university_id = ?
                  AND route_id = ?
                  AND status = 'ACTIVE'
                  AND active_from <= ?
                  AND (active_until IS NULL OR active_until >= ?)
                """, Integer.class, universityId, routeId, serviceDate, serviceDate);
        return count != null && count > 0;
    }

    public boolean isRouteSubsidyEnabled(Integer universityId, Integer routeId, LocalDate serviceDate) {
        if (universityId == null || routeId == null) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM route_universities ru
                JOIN routes r ON r.route_id = ru.route_id
                WHERE ru.university_id = ?
                  AND ru.route_id = ?
                  AND ru.status = 'ACTIVE'
                  AND COALESCE(ru.subsidy_enabled, TRUE) = TRUE
                  AND r.status = 'ACTIVE'
                  AND ru.active_from <= ?
                  AND (ru.active_until IS NULL OR ru.active_until >= ?)
                """, Integer.class, universityId, routeId, serviceDate, serviceDate);
        return count != null && count > 0;
    }

    public Optional<SubsidyPolicy> findActivePolicy(Integer universityId, LocalDate serviceDate) {
        if (universityId == null) {
            return Optional.empty();
        }
        List<SubsidyPolicy> rows = jdbcTemplate.query("""
                SELECT subsidy_policy_id, subsidy_type, "value" AS policy_value, max_amount
                FROM subsidy_policies
                WHERE university_id = ?
                  AND campus_id IS NULL
                  AND status = 'ACTIVE'
                  AND active_from <= ?
                  AND (active_until IS NULL OR active_until >= ?)
                ORDER BY active_from DESC, subsidy_policy_id DESC
                LIMIT 1
                """, (rs, rowNum) -> new SubsidyPolicy(
                        rs.getInt("subsidy_policy_id"),
                        rs.getString("subsidy_type"),
                        rs.getBigDecimal("policy_value"),
                        rs.getBigDecimal("max_amount")), universityId, serviceDate, serviceDate);
        return rows.stream().findFirst();
    }

    public record StudentUniversity(
            String studentCode,
            Integer universityId,
            String universityName,
            String studentVerificationStatus) {
    }

    public record SubsidyPolicy(
            Integer subsidyPolicyId,
            String subsidyType,
            BigDecimal value,
            BigDecimal maxAmount) {
    }
}
