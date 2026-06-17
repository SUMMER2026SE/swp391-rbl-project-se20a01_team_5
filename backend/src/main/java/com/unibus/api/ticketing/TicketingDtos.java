package com.unibus.api.ticketing;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class TicketingDtos {

    private TicketingDtos() {
    }

    public record PurchaseMonthlyPassRequest(
            @Pattern(regexp = "CASH|BANK_TRANSFER|E_WALLET|CARD") String method) {
    }

    public record TicketView(
            Integer ticketId,
            String ticketType,
            Integer routeId,
            String routeName,
            String boardingStopName,
            String alightingStopName,
            Integer effectiveMonth,
            Integer effectiveYear,
            OffsetDateTime validFrom,
            OffsetDateTime expiresAt,
            BigDecimal fareAmount,
            String qrCode,
            String status,
            OffsetDateTime purchasedAt) {
    }

    public record PaymentView(
            Integer paymentId,
            Integer ticketId,
            BigDecimal amount,
            String method,
            String status,
            String transactionCode,
            String invoiceNumber,
            OffsetDateTime invoiceIssuedAt,
            OffsetDateTime createdAt) {
    }

    public record MonthlyPassQuote(
            Integer routeId,
            String routeName,
            BigDecimal baseAmount,
            BigDecimal subsidyAmount,
            BigDecimal payableAmount,
            String subsidyStatus) {
    }

    public record PassesDashboard(List<TicketView> tickets, List<PaymentView> payments, MonthlyPassQuote monthlyPassQuote) {
    }
}
