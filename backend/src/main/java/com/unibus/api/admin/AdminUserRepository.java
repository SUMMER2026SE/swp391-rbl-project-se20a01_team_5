package com.unibus.api.admin;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.admin.AdminUserDtos.UserView;

@Repository
public class AdminUserRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminUserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<UserView> findUsers(String keyword, String role, String status) {
        return findUsers(keyword, role, status, 0, Integer.MAX_VALUE);
    }

    public List<UserView> findUsers(String keyword, String role, String status, int page, int size) {
        String like = keyword == null || keyword.isBlank() ? null : "%" + keyword.trim().toLowerCase() + "%";
        String normalizedRole = role == null || role.equalsIgnoreCase("all") ? null : role.toUpperCase();
        String normalizedStatus = status == null || status.equalsIgnoreCase("all") ? null : status.toUpperCase();
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        if (like != null) {
            where.append("""
                    AND (
                        LOWER(u.email) LIKE ?
                        OR LOWER(u.full_name) LIKE ?
                        OR LOWER(COALESCE(d.license_number, c.employee_code, dp.employee_code, s.student_code, '')) LIKE ?
                    )
                    """);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (normalizedRole != null) {
            where.append("AND u.role = ?\n");
            params.add(normalizedRole);
        }
        if (normalizedStatus != null) {
            where.append("AND u.status = ?\n");
            params.add(normalizedStatus);
        }
        where.append("ORDER BY u.created_at DESC, u.user_id DESC\n");
        where.append("LIMIT ? OFFSET ?\n");
        params.add(size);
        params.add(Math.max(0, page) * size);
        return jdbcTemplate.query(userQuery(where.toString()), (rs, rowNum) -> mapUser(rs), params.toArray());
    }

    public long countUsers(String keyword, String role, String status) {
        String like = keyword == null || keyword.isBlank() ? null : "%" + keyword.trim().toLowerCase() + "%";
        String normalizedRole = role == null || role.equalsIgnoreCase("all") ? null : role.toUpperCase();
        String normalizedStatus = status == null || status.equalsIgnoreCase("all") ? null : status.toUpperCase();
        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        if (like != null) {
            where.append("""
                    AND (
                        LOWER(u.email) LIKE ?
                        OR LOWER(u.full_name) LIKE ?
                        OR LOWER(COALESCE(d.license_number, c.employee_code, dp.employee_code, s.student_code, '')) LIKE ?
                    )
                    """);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (normalizedRole != null) {
            where.append("AND u.role = ?\n");
            params.add(normalizedRole);
        }
        if (normalizedStatus != null) {
            where.append("AND u.status = ?\n");
            params.add(normalizedStatus);
        }
        String sql = "SELECT COUNT(*) FROM users u "
                + "LEFT JOIN drivers d ON d.user_id = u.user_id "
                + "LEFT JOIN conductors c ON c.user_id = u.user_id "
                + "LEFT JOIN dispatchers dp ON dp.user_id = u.user_id "
                + "LEFT JOIN students s ON s.user_id = u.user_id "
                + where;
        Long c = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return c == null ? 0 : c;
    }

    public Optional<UserView> findUser(Integer userId) {
        List<UserView> rows = jdbcTemplate.query(userQuery("WHERE u.user_id = ?"), (rs, rowNum) -> mapUser(rs), userId);
        return rows.stream().findFirst();
    }

    public UserView updateStatus(Integer userId, String status, String lockReason) {
        jdbcTemplate.update("""
                UPDATE users
                SET status = ?,
                    lock_reason = CASE WHEN ? = 'LOCKED' THEN ? ELSE NULL END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """, status, status, lockReason, userId);
        return findUser(userId).orElseThrow();
    }

    public boolean existsByEmail(String email) {
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER(?))",
                Boolean.class,
                email);
        return Boolean.TRUE.equals(exists);
    }

    public UserView createUser(String email, String passwordHash, String fullName, String phoneNumber, String role,
            String employeeCode, String licenseNumber) {
        Integer userId = jdbcTemplate.queryForObject("""
                INSERT INTO users(email, password_hash, full_name, phone_number, role, status, email_verified_at, created_at)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING user_id
                """, Integer.class, email, passwordHash, fullName, phoneNumber, role);
        if ("DRIVER".equals(role)) {
            jdbcTemplate.update("""
                    INSERT INTO drivers(user_id, license_number)
                    VALUES (?, ?)
                    """, userId, licenseNumber);
        } else if ("CONDUCTOR".equals(role)) {
            jdbcTemplate.update("""
                    INSERT INTO conductors(user_id, employee_code)
                    VALUES (?, ?)
                    """, userId, employeeCode);
        } else if ("DISPATCHER".equals(role)) {
            jdbcTemplate.update("""
                    INSERT INTO dispatchers(user_id, employee_code)
                    VALUES (?, ?)
                    """, userId, employeeCode);
        }
        return findUser(userId).orElseThrow();
    }

    private String userQuery(String whereClause) {
        return """
                SELECT u.user_id, u.email, u.full_name, u.phone_number, u.role, u.status, u.lock_reason,
                       COALESCE(d.license_number, c.employee_code, dp.employee_code, s.student_code) AS staff_code,
                       d.license_number, u.created_at
                FROM users u
                LEFT JOIN drivers d ON d.user_id = u.user_id
                LEFT JOIN conductors c ON c.user_id = u.user_id
                LEFT JOIN dispatchers dp ON dp.user_id = u.user_id
                LEFT JOIN students s ON s.user_id = u.user_id
                """ + whereClause;
    }

    private UserView mapUser(ResultSet rs) throws SQLException {
        return new UserView(
                rs.getInt("user_id"),
                rs.getString("email"),
                rs.getString("full_name"),
                rs.getString("phone_number"),
                rs.getString("role"),
                rs.getString("status"),
                rs.getString("lock_reason"),
                rs.getString("staff_code"),
                rs.getString("license_number"),
                toOffsetDateTime(rs.getTimestamp("created_at")));
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }
}
