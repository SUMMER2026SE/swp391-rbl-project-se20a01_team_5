package com.unibus.api.assistant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class AssistantTicketDtos {

    private AssistantTicketDtos() {
    }

    public record ConductorTripView(
            Integer tripId,
            Integer routeId,
            String routeName,
            String licensePlate,
            LocalDate serviceDate,
            LocalTime departureTime,
            String status) {
    }

    public record ScanTicketRequest(
            @NotNull Integer tripId,
            @NotBlank String qrCode) {
    }

    public record ScanTicketResult(
            boolean valid,
            String message,
            String ticketType,
            Integer ticketId,
            String qrCode,
            String studentCode,
            String studentName,
            String email,
            Integer routeId,
            String routeName,
            BigDecimal fareAmount,
            OffsetDateTime validFrom,
            OffsetDateTime expiresAt,
            OffsetDateTime scannedAt,
            Integer scansToday) {
    }

    public record ConductorDashboard(List<ConductorTripView> trips) {
    }
}
