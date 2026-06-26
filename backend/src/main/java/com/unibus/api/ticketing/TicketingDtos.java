package com.unibus.api.ticketing;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.Pattern;

public final class TicketingDtos {

    private TicketingDtos() {
    }

    public record PurchaseMonthlyPassRequest(
            Integer routeId,
            @Pattern(regexp = "CASH|BANK_TRANSFER|E_WALLET|CARD") String method) {
    }

    public record PurchaseSingleTripTicketRequest(
            @jakarta.validation.constraints.NotNull Integer routeId,
            @jakarta.validation.constraints.NotNull Integer boardingStopId,
            @jakarta.validation.constraints.NotNull Integer alightingStopId,
            @Pattern(regexp = "CASH|BANK_TRANSFER|E_WALLET|CARD") String method) {
    }

    public record SingleTripTicketView(
            Integer ticketId,
            Integer routeId,
            String routeName,
            Integer boardingStopId,
            String boardingStopName,
            Integer alightingStopId,
            String alightingStopName,
            BigDecimal originalFareAmount,
            BigDecimal subsidyAmount,
            BigDecimal finalFareAmount,
            String qrCode,
            String status,
            OffsetDateTime purchasedAt,
            OffsetDateTime expiresAt) {
    }

    public record CheckoutUrlResponse(String checkoutUrl, String orderRef, String token) {
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
            BigDecimal originalFareAmount,
            BigDecimal subsidyAmount,
            BigDecimal finalFareAmount,
            Integer subsidyPolicyId,
            String subsidyStatus,
            String qrCode,
            String status,
            OffsetDateTime purchasedAt) {
    }

    public record PaymentView(
            Integer paymentId,
            Integer ticketId,
            BigDecimal amount,
            BigDecimal originalAmount,
            BigDecimal subsidyAmount,
            BigDecimal finalAmount,
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
            BigDecimal originalFareAmount,
            BigDecimal subsidyAmount,
            BigDecimal payableAmount,
            BigDecimal finalFareAmount,
            String subsidyStatus,
            Integer subsidyPolicyId) {
    }

    public record PassesDashboard(List<TicketView> tickets, List<PaymentView> payments, MonthlyPassQuote monthlyPassQuote) {
    }
}
