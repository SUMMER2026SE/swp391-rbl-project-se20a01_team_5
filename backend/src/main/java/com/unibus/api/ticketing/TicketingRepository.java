package com.unibus.api.ticketing;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.TicketView;

@Repository
public class TicketingRepository {

    private final JdbcTemplate jdbcTemplate;

    public TicketingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<String> studentCodeForUser(Integer userId) {
        List<String> codes = jdbcTemplate.queryForList("SELECT student_code FROM students WHERE user_id = ?", String.class, userId);
        return codes.stream().findFirst();
    }

    public Optional<ApprovedRegistration> approvedRegistration(String studentCode) {
        List<ApprovedRegistration> rows = jdbcTemplate.query("""
                SELECT rr.registration_id, rr.route_id, r.route_name,
                       rr.boarding_stop_id, bs.stop_name AS boarding_stop_name,
                       rr.alighting_stop_id, als.stop_name AS alighting_stop_name
                FROM route_registrations rr
                JOIN routes r ON r.route_id = rr.route_id
                LEFT JOIN stops bs ON bs.stop_id = rr.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = rr.alighting_stop_id
                WHERE rr.student_code = ?
                  AND rr.status = 'APPROVED'
                ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                LIMIT 1
                """, (rs, rowNum) -> new ApprovedRegistration(
                        rs.getInt("registration_id"),
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        (Integer) rs.getObject("boarding_stop_id"),
                        rs.getString("boarding_stop_name"),
                        (Integer) rs.getObject("alighting_stop_id"),
                        rs.getString("alighting_stop_name")), studentCode);
        return rows.stream().findFirst();
    }

    public Optional<TicketView> activeMonthlyPass(String studentCode, Integer routeId, int year, int month) {
        List<TicketView> rows = jdbcTemplate.query(ticketQuery("""
                WHERE mp.student_code = ?
                  AND mp.route_id = ?
                  AND mp.effective_year = ?
                  AND mp.effective_month = ?
                  AND mp.status = 'ACTIVE'
                ORDER BY mp.purchased_at DESC
                LIMIT 1
                """), (rs, rowNum) -> mapTicket(rs), studentCode, routeId, year, month);
        return rows.stream().findFirst();
    }

    public BigDecimal monthlyFare(Integer routeId) {
        List<BigDecimal> fares = jdbcTemplate.queryForList("""
                SELECT amount
                FROM fares
                WHERE route_id = ?
                  AND fare_type = 'MONTHLY'
                  AND effective_from <= CURRENT_DATE
                  AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
                ORDER BY effective_from DESC
                LIMIT 1
                """, BigDecimal.class, routeId);
        return fares.isEmpty() ? BigDecimal.ZERO : fares.get(0);
    }

    public TicketView createMonthlyTicket(String studentCode, ApprovedRegistration registration, int year, int month,
            OffsetDateTime validFrom, OffsetDateTime expiresAt, BigDecimal amount) {
        String qrCode = "UB-MONTHLY-" + UUID.randomUUID();
        Integer monthlyPassId = jdbcTemplate.queryForObject("""
                INSERT INTO monthly_passes(student_code, route_id, effective_month, effective_year,
                                           valid_from, expires_on, fare_amount, qr_code, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
                RETURNING monthly_pass_id
                """, Integer.class, studentCode, registration.routeId(), month, year,
                validFrom.toLocalDate(), expiresAt.toLocalDate(), amount, qrCode);
        return findTicket(monthlyPassId).orElseThrow();
    }

    public PaymentView createPaidPayment(Integer monthlyPassId, BigDecimal amount, String method) {
        Integer paymentId = jdbcTemplate.queryForObject("""
                INSERT INTO payments(student_code, monthly_pass_id, amount, method, status, transaction_code, notes)
                SELECT student_code, monthly_pass_id, ?, ?, 'PAID', ?, 'MVP internal payment confirmation'
                FROM monthly_passes
                WHERE monthly_pass_id = ?
                RETURNING payment_id
                """, Integer.class, amount, method, "MVP-" + UUID.randomUUID(), monthlyPassId);
        jdbcTemplate.update("""
                INSERT INTO invoices(payment_id, student_code, description, amount)
                SELECT p.payment_id, p.student_code, 'Monthly bus pass payment', p.amount
                FROM payments p
                WHERE p.payment_id = ?
                ON CONFLICT (payment_id) DO NOTHING
                """, paymentId);
        return findPayment(paymentId).orElseThrow();
    }

    public List<TicketView> findTickets(String studentCode) {
        return jdbcTemplate.query(ticketQuery("""
                WHERE mp.student_code = ?
                ORDER BY mp.purchased_at DESC
                """), (rs, rowNum) -> mapTicket(rs), studentCode);
    }

    public List<PaymentView> findPayments(String studentCode) {
        return jdbcTemplate.query(paymentQuery("""
                WHERE p.student_code = ?
                ORDER BY p.created_at DESC
                """), (rs, rowNum) -> mapPayment(rs), studentCode);
    }

    private Optional<TicketView> findTicket(Integer monthlyPassId) {
        List<TicketView> rows = jdbcTemplate.query(ticketQuery("WHERE mp.monthly_pass_id = ?"), (rs, rowNum) -> mapTicket(rs), monthlyPassId);
        return rows.stream().findFirst();
    }

    private Optional<PaymentView> findPayment(Integer paymentId) {
        List<PaymentView> rows = jdbcTemplate.query(paymentQuery("WHERE p.payment_id = ?"), (rs, rowNum) -> mapPayment(rs), paymentId);
        return rows.stream().findFirst();
    }

    private String ticketQuery(String whereClause) {
        return """
                SELECT mp.monthly_pass_id AS ticket_id, 'MONTHLY' AS ticket_type, mp.route_id, r.route_name,
                       bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                       mp.effective_month, mp.effective_year, mp.valid_from, mp.expires_on AS expires_at,
                       mp.fare_amount, mp.qr_code, mp.status, mp.purchased_at
                FROM monthly_passes mp
                JOIN routes r ON r.route_id = mp.route_id
                LEFT JOIN LATERAL (
                    SELECT rr.boarding_stop_id, rr.alighting_stop_id
                    FROM route_registrations rr
                    WHERE rr.student_code = mp.student_code
                      AND rr.route_id = mp.route_id
                      AND rr.status = 'APPROVED'
                    ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                    LIMIT 1
                ) reg ON TRUE
                LEFT JOIN stops bs ON bs.stop_id = reg.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = reg.alighting_stop_id
                """ + whereClause;
    }

    private String paymentQuery(String whereClause) {
        return """
                SELECT p.payment_id, p.monthly_pass_id AS ticket_id, p.amount, p.method, p.status,
                       p.transaction_code, i.invoice_id, i.issued_at AS invoice_issued_at, p.created_at
                FROM payments p
                LEFT JOIN invoices i ON i.payment_id = p.payment_id
                """ + whereClause;
    }

    private TicketView mapTicket(ResultSet rs) throws SQLException {
        return new TicketView(
                rs.getInt("ticket_id"),
                rs.getString("ticket_type"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getString("boarding_stop_name"),
                rs.getString("alighting_stop_name"),
                (Integer) rs.getObject("effective_month"),
                (Integer) rs.getObject("effective_year"),
                toOffsetDateTime(rs.getDate("valid_from")),
                toOffsetDateTime(rs.getDate("expires_at")),
                rs.getBigDecimal("fare_amount"),
                rs.getString("qr_code"),
                rs.getString("status"),
                toOffsetDateTime(rs.getTimestamp("purchased_at")));
    }

    private PaymentView mapPayment(ResultSet rs) throws SQLException {
        Integer invoiceId = (Integer) rs.getObject("invoice_id");
        return new PaymentView(
                rs.getInt("payment_id"),
                (Integer) rs.getObject("ticket_id"),
                rs.getBigDecimal("amount"),
                rs.getString("method"),
                rs.getString("status"),
                rs.getString("transaction_code"),
                invoiceId == null ? null : "INV-" + invoiceId,
                toOffsetDateTime(rs.getTimestamp("invoice_issued_at")),
                toOffsetDateTime(rs.getTimestamp("created_at")));
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    private OffsetDateTime toOffsetDateTime(Date date) {
        return date == null ? null : date.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    public record ApprovedRegistration(
            Integer registrationId,
            Integer routeId,
            String routeName,
            Integer boardingRouteStopId,
            String boardingStopName,
            Integer alightingRouteStopId,
            String alightingStopName) {
    }
}
