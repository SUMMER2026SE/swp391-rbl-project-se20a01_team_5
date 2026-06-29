package com.unibus.api.ticketing;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
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
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.unibus.api.ticketing.TicketingDtos.MonthlyPassQuote;
import com.unibus.api.ticketing.TicketingDtos.JourneyOrderItemView;
import com.unibus.api.ticketing.TicketingDtos.JourneyOrderView;
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
        return approvedRegistration(studentCode, null);
    }

    public Optional<ApprovedRegistration> approvedRegistration(String studentCode, Integer routeId) {
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
                  AND (? IS NULL OR rr.route_id = ?)
                ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                LIMIT 1
                """, (rs, rowNum) -> new ApprovedRegistration(
                        rs.getInt("registration_id"),
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        (Integer) rs.getObject("boarding_stop_id"),
                        rs.getString("boarding_stop_name"),
                        (Integer) rs.getObject("alighting_stop_id"),
                        rs.getString("alighting_stop_name")), studentCode, routeId, routeId);
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

    public BigDecimal singleFare(Integer routeId) {
        List<BigDecimal> fares = jdbcTemplate.queryForList("""
                SELECT amount
                FROM fares
                WHERE route_id = ?
                  AND fare_type = 'SINGLE'
                  AND effective_from <= CURRENT_DATE
                  AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
                ORDER BY effective_from DESC
                LIMIT 1
                """, BigDecimal.class, routeId);
        return fares.isEmpty() ? BigDecimal.ZERO : fares.get(0);
    }

    public Integer createSingleTripTicket(String studentCode, Integer routeId, Integer boardingStopId,
            Integer alightingStopId, BigDecimal amount, BigDecimal originalAmount, BigDecimal subsidyAmount,
            BigDecimal finalAmount, Integer subsidyPolicyId) {
        String qrCode = "UB-SINGLE-" + UUID.randomUUID();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO single_trip_tickets(student_code, route_id, boarding_stop_id, alighting_stop_id,
                                                 fare_amount, original_fare_amount, subsidy_amount, final_fare_amount,
                                                 subsidy_policy_id, qr_code, status, purchased_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNUSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours')
                """, new String[] { "single_trip_ticket_id" });
            statement.setString(1, studentCode);
            statement.setInt(2, routeId);
            statement.setObject(3, boardingStopId);
            statement.setObject(4, alightingStopId);
            statement.setBigDecimal(5, finalAmount);
            statement.setBigDecimal(6, originalAmount);
            statement.setBigDecimal(7, subsidyAmount);
            statement.setBigDecimal(8, finalAmount);
            if (subsidyPolicyId == null) {
                statement.setNull(9, java.sql.Types.INTEGER);
            } else {
                statement.setInt(9, subsidyPolicyId);
            }
            statement.setString(10, qrCode);
            return statement;
        }, keyHolder);
        return generatedId(keyHolder, "single trip ticket");
    }

    public void createPaidPaymentForSingleTicket(Integer singleTripTicketId, BigDecimal amount, String method) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO payments(student_code, single_trip_ticket_id, amount, method, status, transaction_code, notes)
                SELECT student_code, single_trip_ticket_id, ?, ?, 'PAID', ?, 'Single-trip ticket purchase'
                FROM single_trip_tickets
                WHERE single_trip_ticket_id = ?
                """, new String[] { "payment_id" });
            statement.setBigDecimal(1, amount);
            statement.setString(2, method);
            statement.setString(3, "MVP-" + UUID.randomUUID());
            statement.setInt(4, singleTripTicketId);
            return statement;
        }, keyHolder);
        Integer paymentId = generatedId(keyHolder, "payment");
        jdbcTemplate.update("""
                INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount)
                SELECT p.payment_id, p.student_code, 'Single trip ticket payment', p.amount,
                       COALESCE(stt.original_fare_amount, stt.fare_amount),
                       COALESCE(stt.subsidy_amount, 0),
                       COALESCE(stt.final_fare_amount, stt.fare_amount)
                FROM payments p
                JOIN single_trip_tickets stt ON stt.single_trip_ticket_id = p.single_trip_ticket_id
                WHERE p.payment_id = ?
                  AND NOT EXISTS (
                      SELECT 1
                      FROM invoices i
                      WHERE i.payment_id = p.payment_id
                  )
                """, paymentId);
    }

    public Optional<SingleTripTicketView> findSingleTripTicket(Integer ticketId) {
        List<SingleTripTicketView> rows = jdbcTemplate.query("""
                SELECT stt.single_trip_ticket_id, stt.student_code, stt.route_id, r.route_name,
                       stt.boarding_stop_id, bs.stop_name AS boarding_stop_name,
                       stt.alighting_stop_id, als.stop_name AS alighting_stop_name,
                       stt.fare_amount, stt.original_fare_amount, stt.subsidy_amount, stt.final_fare_amount,
                       stt.qr_code, stt.status, stt.purchased_at, stt.expires_at
                FROM single_trip_tickets stt
                JOIN routes r ON r.route_id = stt.route_id
                LEFT JOIN stops bs ON bs.stop_id = stt.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = stt.alighting_stop_id
                WHERE stt.single_trip_ticket_id = ?
                """, (rs, rowNum) -> new SingleTripTicketView(
                        rs.getInt("single_trip_ticket_id"),
                        rs.getString("student_code"),
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        (Integer) rs.getObject("boarding_stop_id"),
                        rs.getString("boarding_stop_name"),
                        (Integer) rs.getObject("alighting_stop_id"),
                        rs.getString("alighting_stop_name"),
                        rs.getBigDecimal("fare_amount"),
                        rs.getBigDecimal("original_fare_amount"),
                        rs.getBigDecimal("subsidy_amount"),
                        rs.getBigDecimal("final_fare_amount"),
                        rs.getString("qr_code"),
                        rs.getString("status"),
                        toOffsetDateTime(rs.getTimestamp("purchased_at")),
                        toOffsetDateTime(rs.getTimestamp("expires_at"))),
                ticketId);
        return rows.stream().findFirst();
    }

    public List<SingleTripTicketView> findSingleTripTickets(String studentCode) {
        return jdbcTemplate.query("""
                SELECT stt.single_trip_ticket_id, stt.student_code, stt.route_id, r.route_name,
                       stt.boarding_stop_id, bs.stop_name AS boarding_stop_name,
                       stt.alighting_stop_id, als.stop_name AS alighting_stop_name,
                       stt.fare_amount, stt.original_fare_amount, stt.subsidy_amount, stt.final_fare_amount,
                       stt.qr_code, stt.status, stt.purchased_at, stt.expires_at
                FROM single_trip_tickets stt
                JOIN routes r ON r.route_id = stt.route_id
                LEFT JOIN stops bs ON bs.stop_id = stt.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = stt.alighting_stop_id
                WHERE stt.student_code = ?
                ORDER BY stt.purchased_at DESC
                LIMIT 50
                """, (rs, rowNum) -> new SingleTripTicketView(
                        rs.getInt("single_trip_ticket_id"),
                        rs.getString("student_code"),
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        (Integer) rs.getObject("boarding_stop_id"),
                        rs.getString("boarding_stop_name"),
                        (Integer) rs.getObject("alighting_stop_id"),
                        rs.getString("alighting_stop_name"),
                        rs.getBigDecimal("fare_amount"),
                        rs.getBigDecimal("original_fare_amount"),
                        rs.getBigDecimal("subsidy_amount"),
                        rs.getBigDecimal("final_fare_amount"),
                        rs.getString("qr_code"),
                        rs.getString("status"),
                        toOffsetDateTime(rs.getTimestamp("purchased_at")),
                        toOffsetDateTime(rs.getTimestamp("expires_at"))),
                studentCode);
    }

    public TicketView createMonthlyTicket(String studentCode, ApprovedRegistration registration, int year, int month,
            OffsetDateTime validFrom, OffsetDateTime expiresAt, MonthlyPassQuote quote) {
        String qrCode = "UB-MONTHLY-" + UUID.randomUUID();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO monthly_passes(student_code, route_id, effective_month, effective_year,
                                           valid_from, expires_on, fare_amount,
                                           original_fare_amount, subsidy_amount, final_fare_amount,
                                           subsidy_policy_id, qr_code, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
                """, new String[] { "monthly_pass_id" });
            statement.setString(1, studentCode);
            statement.setInt(2, registration.routeId());
            statement.setInt(3, month);
            statement.setInt(4, year);
            statement.setObject(5, validFrom.toLocalDate());
            statement.setObject(6, expiresAt.toLocalDate());
            statement.setBigDecimal(7, quote.finalFareAmount());
            statement.setBigDecimal(8, quote.originalFareAmount());
            statement.setBigDecimal(9, quote.subsidyAmount());
            statement.setBigDecimal(10, quote.finalFareAmount());
            if (quote.subsidyPolicyId() == null) {
                statement.setNull(11, java.sql.Types.INTEGER);
            } else {
                statement.setInt(11, quote.subsidyPolicyId());
            }
            statement.setString(12, qrCode);
            return statement;
        }, keyHolder);
        Integer monthlyPassId = generatedId(keyHolder, "monthly pass");
        return findTicket(monthlyPassId).orElseThrow();
    }

    public PaymentView createPaidPayment(Integer monthlyPassId, BigDecimal amount, String method) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO payments(student_code, monthly_pass_id, amount, method, status, transaction_code, notes)
                SELECT student_code, monthly_pass_id, ?, ?, 'PAID', ?, 'MVP internal payment confirmation'
                FROM monthly_passes
                WHERE monthly_pass_id = ?
                """, new String[] { "payment_id" });
            statement.setBigDecimal(1, amount);
            statement.setString(2, method);
            statement.setString(3, "MVP-" + UUID.randomUUID());
            statement.setInt(4, monthlyPassId);
            return statement;
        }, keyHolder);
        Integer paymentId = generatedId(keyHolder, "payment");
        jdbcTemplate.update("""
                INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount)
                SELECT p.payment_id, p.student_code, 'Monthly bus pass payment', p.amount,
                       COALESCE(mp.original_fare_amount, mp.fare_amount),
                       COALESCE(mp.subsidy_amount, 0),
                       COALESCE(mp.final_fare_amount, mp.fare_amount)
                FROM payments p
                JOIN monthly_passes mp ON mp.monthly_pass_id = p.monthly_pass_id
                WHERE p.payment_id = ?
                  AND NOT EXISTS (
                      SELECT 1
                      FROM invoices i
                      WHERE i.payment_id = p.payment_id
                  )
                """, paymentId);
        return findPayment(paymentId).orElseThrow();
    }

    public PaymentView createPendingVnpayPayment(String studentCode, BigDecimal amount, String transactionCode) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO payments(student_code, amount, method, status, transaction_code, notes)
                VALUES (?, ?, 'E_WALLET', 'PENDING', ?, 'VNPay payment request')
                """, new String[] { "payment_id" });
            statement.setString(1, studentCode);
            statement.setBigDecimal(2, amount);
            statement.setString(3, transactionCode);
            return statement;
        }, keyHolder);
        return findPayment(generatedId(keyHolder, "payment")).orElseThrow();
    }

    public Optional<PaymentView> findPaymentForStudent(Integer paymentId, String studentCode) {
        List<PaymentView> rows = jdbcTemplate.query(paymentQuery("WHERE p.payment_id = ? AND p.student_code = ?"),
                (rs, rowNum) -> mapPayment(rs), paymentId, studentCode);
        return rows.stream().findFirst();
    }

    public Optional<PaymentView> findPaymentByTransactionCode(String transactionCode) {
        List<PaymentView> rows = jdbcTemplate.query(paymentQuery("WHERE p.transaction_code = ?"),
                (rs, rowNum) -> mapPayment(rs), transactionCode);
        return rows.stream().findFirst();
    }

    public PaymentView markPaymentPaid(Integer paymentId) {
        jdbcTemplate.update("""
                UPDATE payments
                SET status = 'PAID'
                WHERE payment_id = ?
                  AND status <> 'PAID'
                """, paymentId);
        createInvoiceIfMissing(paymentId);
        return findPayment(paymentId).orElseThrow();
    }

    public PaymentView markPaymentFailed(Integer paymentId) {
        jdbcTemplate.update("""
                UPDATE payments
                SET status = 'FAILED'
                WHERE payment_id = ?
                  AND status = 'PENDING'
                """, paymentId);
        return findPayment(paymentId).orElseThrow();
    }

    private void createInvoiceIfMissing(Integer paymentId) {
        jdbcTemplate.update("""
                INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount)
                SELECT p.payment_id,
                       p.student_code,
                       CASE
                           WHEN p.monthly_pass_id IS NOT NULL THEN 'Monthly bus pass payment'
                           WHEN p.single_trip_ticket_id IS NOT NULL THEN 'Single trip ticket payment'
                           ELSE 'VNPay payment'
                       END,
                       p.amount,
                       COALESCE(mp.original_fare_amount, stt.original_fare_amount, p.amount),
                       COALESCE(mp.subsidy_amount, stt.subsidy_amount, 0),
                       COALESCE(mp.final_fare_amount, stt.final_fare_amount, p.amount)
                FROM payments p
                LEFT JOIN monthly_passes mp ON mp.monthly_pass_id = p.monthly_pass_id
                LEFT JOIN single_trip_tickets stt ON stt.single_trip_ticket_id = p.single_trip_ticket_id
                WHERE p.payment_id = ?
                  AND NOT EXISTS (
                      SELECT 1
                      FROM invoices i
                      WHERE i.payment_id = p.payment_id
                  )
                """, paymentId);
    }

    public Integer createJourneyOrder(String studentCode, String originLabel, String destinationLabel,
            BigDecimal totalAmount, BigDecimal subsidyAmount, BigDecimal finalAmount) {
        String qrCode = "UB-JOURNEY-" + UUID.randomUUID();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                INSERT INTO journey_orders(student_code, origin_label, destination_label,
                                           total_amount, subsidy_amount, final_amount,
                                           qr_code, status, valid_from, expires_on)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month')
                """, new String[] { "journey_order_id" });
            statement.setString(1, studentCode);
            statement.setString(2, originLabel);
            statement.setString(3, destinationLabel);
            statement.setBigDecimal(4, totalAmount);
            statement.setBigDecimal(5, subsidyAmount);
            statement.setBigDecimal(6, finalAmount);
            statement.setString(7, qrCode);
            return statement;
        }, keyHolder);
        return generatedId(keyHolder, "journey order");
    }

    public void addJourneyOrderItem(Integer journeyOrderId, Integer monthlyPassId, Integer routeId,
            Integer legOrder, Integer boardingStopId, Integer alightingStopId,
            BigDecimal originalAmount, BigDecimal subsidyAmount, BigDecimal finalAmount) {
        jdbcTemplate.update("""
                INSERT INTO journey_order_items(journey_order_id, monthly_pass_id, route_id, leg_order,
                                                boarding_stop_id, alighting_stop_id,
                                                original_amount, subsidy_amount, final_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, journeyOrderId, monthlyPassId, routeId, legOrder, boardingStopId, alightingStopId,
                originalAmount, subsidyAmount, finalAmount);
    }

    public Optional<JourneyOrderView> findJourneyOrder(Integer journeyOrderId) {
        List<JourneyOrderView> orders = jdbcTemplate.query("""
                SELECT journey_order_id, origin_label, destination_label, total_amount,
                       subsidy_amount, final_amount, qr_code, status, purchased_at
                FROM journey_orders
                WHERE journey_order_id = ?
                """, (rs, rowNum) -> new JourneyOrderView(
                        rs.getInt("journey_order_id"),
                        rs.getString("origin_label"),
                        rs.getString("destination_label"),
                        rs.getBigDecimal("total_amount"),
                        rs.getBigDecimal("subsidy_amount"),
                        rs.getBigDecimal("final_amount"),
                        rs.getString("qr_code"),
                        rs.getString("status"),
                        toOffsetDateTime(rs.getTimestamp("purchased_at")),
                        findJourneyOrderItems(rs.getInt("journey_order_id"))), journeyOrderId);
        return orders.stream().findFirst();
    }

    private List<JourneyOrderItemView> findJourneyOrderItems(Integer journeyOrderId) {
        return jdbcTemplate.query("""
                SELECT joi.journey_order_item_id, joi.monthly_pass_id, joi.route_id, r.route_name,
                       joi.leg_order, joi.boarding_stop_id, bs.stop_name AS boarding_stop_name,
                       joi.alighting_stop_id, als.stop_name AS alighting_stop_name,
                       joi.original_amount, joi.subsidy_amount, joi.final_amount
                FROM journey_order_items joi
                JOIN routes r ON r.route_id = joi.route_id
                LEFT JOIN stops bs ON bs.stop_id = joi.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = joi.alighting_stop_id
                WHERE joi.journey_order_id = ?
                ORDER BY joi.leg_order
                """, (rs, rowNum) -> new JourneyOrderItemView(
                        rs.getInt("journey_order_item_id"),
                        rs.getInt("monthly_pass_id"),
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        rs.getInt("leg_order"),
                        (Integer) rs.getObject("boarding_stop_id"),
                        rs.getString("boarding_stop_name"),
                        (Integer) rs.getObject("alighting_stop_id"),
                        rs.getString("alighting_stop_name"),
                        rs.getBigDecimal("original_amount"),
                        rs.getBigDecimal("subsidy_amount"),
                        rs.getBigDecimal("final_amount")), journeyOrderId);
    }

    private Integer generatedId(KeyHolder keyHolder, String entityName) {
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Could not read generated " + entityName + " id");
        }
        return key.intValue();
    }

    public List<TicketView> findTickets(String studentCode) {
        return jdbcTemplate.query(ticketQuery("""
                WHERE mp.student_code = ?
                ORDER BY mp.purchased_at DESC
                """), (rs, rowNum) -> mapTicket(rs), studentCode);
    }

    public List<PaymentView> findPayments(String studentCode) {
        return jdbcTemplate.query("""
                SELECT *
                FROM (
                    SELECT p.payment_id,
                           p.monthly_pass_id AS ticket_id,
                           p.amount,
                           p.method,
                           p.status,
                           COALESCE(i.original_amount, p.amount) AS original_amount,
                           COALESCE(i.subsidy_amount, 0) AS subsidy_amount,
                           COALESCE(i.final_amount, p.amount) AS final_amount,
                           COALESCE('DH' || tx.matched_order_id, p.transaction_code) AS transaction_code,
                           i.invoice_id,
                           i.issued_at AS invoice_issued_at,
                           p.created_at,
                           1 AS sort_group
                    FROM payments p
                    LEFT JOIN invoices i ON i.payment_id = p.payment_id
                    LEFT JOIN tb_transactions tx ON tx.reference_number = p.transaction_code
                    WHERE p.student_code = ?
                    UNION ALL
                    SELECT -o.id::integer AS payment_id,
                           NULL::integer AS ticket_id,
                           o.total AS amount,
                           'BANK_TRANSFER' AS method,
                           'PENDING' AS status,
                           o.total AS original_amount,
                           0 AS subsidy_amount,
                           o.total AS final_amount,
                           'DH' || o.id AS transaction_code,
                           NULL::integer AS invoice_id,
                           NULL::timestamptz AS invoice_issued_at,
                           o.created_at,
                           0 AS sort_group
                    FROM tb_orders o
                    WHERE o.student_code = ?
                      AND o.payment_status = 'Unpaid'
                ) rows
                ORDER BY sort_group ASC, created_at DESC
                """, (rs, rowNum) -> mapPayment(rs), studentCode, studentCode);
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
                       mp.fare_amount,
                       COALESCE(mp.original_fare_amount, mp.fare_amount) AS original_fare_amount,
                       COALESCE(mp.subsidy_amount, 0) AS subsidy_amount,
                       COALESCE(mp.final_fare_amount, mp.fare_amount) AS final_fare_amount,
                       mp.subsidy_policy_id,
                       CASE WHEN mp.subsidy_policy_id IS NOT NULL THEN 'APPLIED' ELSE 'NOT_CONFIGURED' END AS subsidy_status,
                       mp.qr_code, mp.status, mp.purchased_at
                FROM monthly_passes mp
                JOIN routes r ON r.route_id = mp.route_id
                LEFT JOIN stops bs ON bs.stop_id = (
                    SELECT rr.boarding_stop_id
                    FROM route_registrations rr
                    WHERE rr.student_code = mp.student_code
                      AND rr.route_id = mp.route_id
                      AND rr.status = 'APPROVED'
                    ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                    LIMIT 1
                )
                LEFT JOIN stops als ON als.stop_id = (
                    SELECT rr.alighting_stop_id
                    FROM route_registrations rr
                    WHERE rr.student_code = mp.student_code
                      AND rr.route_id = mp.route_id
                      AND rr.status = 'APPROVED'
                    ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                    LIMIT 1
                )
                """ + whereClause;
    }

    private String paymentQuery(String whereClause) {
        return """
                SELECT p.payment_id, p.monthly_pass_id AS ticket_id, p.amount, p.method, p.status,
                       COALESCE(i.original_amount, p.amount) AS original_amount,
                       COALESCE(i.subsidy_amount, 0) AS subsidy_amount,
                       COALESCE(i.final_amount, p.amount) AS final_amount,
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
                rs.getBigDecimal("original_fare_amount"),
                rs.getBigDecimal("subsidy_amount"),
                rs.getBigDecimal("final_fare_amount"),
                (Integer) rs.getObject("subsidy_policy_id"),
                rs.getString("subsidy_status"),
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
                rs.getBigDecimal("original_amount"),
                rs.getBigDecimal("subsidy_amount"),
                rs.getBigDecimal("final_amount"),
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

    public record SingleTripTicketView(
            Integer ticketId,
            String studentCode,
            Integer routeId,
            String routeName,
            Integer boardingStopId,
            String boardingStopName,
            Integer alightingStopId,
            String alightingStopName,
            BigDecimal fareAmount,
            BigDecimal originalFareAmount,
            BigDecimal subsidyAmount,
            BigDecimal finalFareAmount,
            String qrCode,
            String status,
            OffsetDateTime purchasedAt,
            OffsetDateTime expiresAt) {
    }
}
