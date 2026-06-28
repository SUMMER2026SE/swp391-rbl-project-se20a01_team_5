package com.unibus.api.admin;

import java.sql.Date;
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

import com.unibus.api.admin.AdminMonthlyPassDtos.MonthlyPassAdminView;

@Repository
public class AdminMonthlyPassRepository {

    private final JdbcTemplate jdbcTemplate;

    public AdminMonthlyPassRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MonthlyPassAdminView> list(String keyword, String status) {
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : "%" + keyword.trim().toLowerCase() + "%";
        String normalizedStatus = status == null || status.equalsIgnoreCase("ALL") ? null : status.toUpperCase();
        List<Object> args = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        if (normalizedStatus != null) {
            where.append("  AND mp.status = ?\n");
            args.add(normalizedStatus);
        }
        if (normalizedKeyword != null) {
            where.append("""
                      AND (LOWER(mp.student_code) LIKE ?
                           OR LOWER(u.full_name) LIKE ?
                           OR LOWER(u.email) LIKE ?
                           OR LOWER(r.route_name) LIKE ?)
                    """);
            args.add(normalizedKeyword);
            args.add(normalizedKeyword);
            args.add(normalizedKeyword);
            args.add(normalizedKeyword);
        }
        where.append("ORDER BY mp.purchased_at DESC\nLIMIT 100");
        return jdbcTemplate.query(passQuery(where.toString()), (rs, rowNum) -> mapPass(rs), args.toArray());
    }

    public Optional<MonthlyPassAdminView> find(Integer monthlyPassId) {
        List<MonthlyPassAdminView> rows = jdbcTemplate.query(
                passQuery("WHERE mp.monthly_pass_id = ?"),
                (rs, rowNum) -> mapPass(rs),
                monthlyPassId);
        return rows.stream().findFirst();
    }

    public Optional<MonthlyPassAdminView> cancel(Integer monthlyPassId) {
        jdbcTemplate.update("""
                UPDATE monthly_passes
                SET status = 'CANCELLED'
                WHERE monthly_pass_id = ?
                  AND status = 'ACTIVE'
                """, monthlyPassId);
        return find(monthlyPassId);
    }

    private String passQuery(String whereClause) {
        return """
                SELECT mp.monthly_pass_id, mp.student_code, u.full_name AS student_name, u.email,
                       mp.route_id, r.route_name, mp.effective_month, mp.effective_year,
                       mp.valid_from, mp.expires_on AS expires_at, mp.fare_amount,
                       mp.status, mp.purchased_at
                FROM monthly_passes mp
                JOIN students s ON s.student_code = mp.student_code
                JOIN users u ON u.user_id = s.user_id
                JOIN routes r ON r.route_id = mp.route_id
                """ + whereClause;
    }

    private MonthlyPassAdminView mapPass(ResultSet rs) throws SQLException {
        return new MonthlyPassAdminView(
                rs.getInt("monthly_pass_id"),
                rs.getString("student_code"),
                rs.getString("student_name"),
                rs.getString("email"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                (Integer) rs.getObject("effective_month"),
                (Integer) rs.getObject("effective_year"),
                toOffsetDateTime(rs.getDate("valid_from")),
                toOffsetDateTime(rs.getDate("expires_at")),
                rs.getBigDecimal("fare_amount"),
                rs.getString("status"),
                toOffsetDateTime(rs.getTimestamp("purchased_at")));
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    private OffsetDateTime toOffsetDateTime(Date date) {
        return date == null ? null : date.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
    }
}
