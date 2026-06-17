package com.unibus.api.ticketing;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class TicketingDtos {

    private TicketingDtos() {
    }

    public record PurchaseMonthlyPassRequest(
            @Pattern(regexp = "CASH|BANK_TRANSFER|E_WALLET|CARD") String method,
            @Size(max = 100) String transactionCode,
            @Size(max = 500) String notes) {
    }

    public record CreateVnpayPaymentRequest(
            BigDecimal amount) {
    }

    public record VnpayPaymentUrlView(
            Integer paymentId,
            String transactionCode,
            BigDecimal amount,
            String paymentUrl) {
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

    public record PassesDashboard(List<TicketView> tickets, List<PaymentView> payments) {
    }
}
