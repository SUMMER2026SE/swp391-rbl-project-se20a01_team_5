package com.unibus.api.experience;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ExperienceDtos {

    private ExperienceDtos() {
    }

    public record StopCard(
            Integer stopId,
            String stopCode,
            String stopName,
            String address,
            BigDecimal longitude,
            BigDecimal latitude,
            boolean hasShelter,
            List<RouteBadge> routes) {
    }

    public record RouteBadge(Integer routeId, String routeCode, String routeName, String colorHex) {
    }

    public record RouteCard(
            Integer routeId,
            String routeCode,
            String routeName,
            String fromStopName,
            String toStopName,
            BigDecimal distanceKm,
            Integer estimatedMinutes,
            Integer frequencyMin,
            BigDecimal singleFare,
            BigDecimal monthlyFare,
            String colorHex,
            String firstTrip,
            String lastTrip,
            boolean universityLinked,
            List<StopCard> stops) {
    }

    public record RegistrationCard(
            Integer registrationId,
            Integer routeId,
            String routeCode,
            String routeName,
            String colorHex,
            String boardingStopName,
            String alightingStopName,
            LocalDate effectiveDate,
            String status) {
    }

    public record TicketCard(
            Integer ticketId,
            String ticketType,
            Integer routeId,
            String routeCode,
            String routeName,
            String colorHex,
            String boardingStopName,
            String alightingStopName,
            BigDecimal originalFareAmount,
            BigDecimal subsidyAmount,
            BigDecimal finalFareAmount,
            String qrCode,
            LocalDate validFrom,
            LocalDate expiresOn,
            OffsetDateTime expiresAt,
            String status) {
    }

    public record TripCard(
            Integer tripId,
            Integer routeId,
            String routeCode,
            String routeName,
            String colorHex,
            Integer busId,
            String licensePlate,
            Integer seatCount,
            Integer occupancy,
            String driverName,
            String conductorName,
            LocalDate serviceDate,
            LocalTime departureTime,
            OffsetDateTime departedAt,
            OffsetDateTime endedAt,
            String status,
            BigDecimal longitude,
            BigDecimal latitude,
            BigDecimal speedKmh) {
    }

    public record NotificationCard(
            Long notificationId,
            String title,
            String content,
            String type,
            boolean read,
            OffsetDateTime createdAt) {
    }

    public record HistoryCard(
            Integer travelHistoryId,
            Integer tripId,
            String routeCode,
            String routeName,
            String boardingStopName,
            String alightingStopName,
            OffsetDateTime boardedAt,
            OffsetDateTime alightedAt) {
    }

    public record FeedbackCard(
            Long feedbackId,
            String studentName,
            String routeCode,
            String routeName,
            Integer tripId,
            Integer rating,
            String category,
            String content,
            String status,
            String response,
            OffsetDateTime createdAt) {
    }

    public record LostItemCard(
            Integer lostItemReportId,
            String reporterName,
            Integer tripId,
            String routeCode,
            String routeName,
            String itemDescription,
            String status,
            String notes,
            OffsetDateTime reportedAt) {
    }

    public record SupportTicketCard(
            Integer supportTicketId,
            String title,
            String content,
            String supportType,
            String status,
            String response,
            OffsetDateTime createdAt,
            OffsetDateTime handledAt) {
    }

    public record IncidentCard(
            Integer incidentId,
            Integer tripId,
            String routeCode,
            String routeName,
            String incidentType,
            String description,
            String status,
            String resolution,
            OffsetDateTime reportedAt) {
    }

    public record DashboardStat(String label, BigDecimal value, String unit, String tone) {
    }

    public record StudentDashboardView(
            String fullName,
            String studentCode,
            String universityName,
            String verificationStatus,
            RegistrationCard registration,
            TicketCard activeTicket,
            TripCard nextTrip,
            List<RouteCard> routes,
            List<StopCard> stops,
            List<NotificationCard> notifications,
            List<HistoryCard> history,
            List<DashboardStat> stats) {
    }

    public record DriverDashboardView(
            String fullName,
            List<TripCard> trips,
            TripCard activeTrip,
            List<FeedbackCard> feedback,
            List<DashboardStat> stats) {
    }

    public record AssistantDashboardView(
            String fullName,
            List<TripCard> trips,
            TripCard activeTrip,
            List<TicketCard> tickets,
            List<IncidentCard> incidents,
            List<LostItemCard> lostItems,
            List<DashboardStat> stats) {
    }

    public record CoordinatorDashboardView(
            List<TripCard> liveFleet,
            List<RouteCard> routes,
            List<StopCard> stops,
            List<FeedbackCard> feedback,
            List<DashboardStat> stats) {
    }

    public record AdminStatsView(
            List<DashboardStat> stats,
            List<RouteMetric> routeMetrics,
            List<ComplaintCard> complaints,
            List<ViolationCard> violations,
            List<FareCard> fares) {
    }

    public record RouteMetric(String routeCode, String routeName, String colorHex, int trips, BigDecimal revenue) {
    }

    public record ComplaintCard(Integer complaintId, String title, String content, String status, OffsetDateTime createdAt) {
    }

    public record ViolationCard(Integer violationReportId, String reporterName, String reportedName, String content,
            String status, OffsetDateTime submittedAt) {
    }

    public record FareCard(Integer fareId, Integer routeId, String routeCode, String routeName, String fareType,
            BigDecimal amount, LocalDate effectiveFrom, LocalDate effectiveUntil, String notes) {
    }

    public record CreateLostItemRequest(@NotBlank @Size(max = 500) String itemDescription, Integer tripId) {
    }

    public record CreateSupportTicketRequest(@NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 2000) String content,
            @Size(max = 30) String supportType) {
    }

    public record CreateIncidentRequest(@NotNull Integer tripId,
            @NotBlank @Size(max = 20) String incidentType,
            @NotBlank @Size(max = 2000) String description) {
    }

    public record UpdateLostItemStatusRequest(@NotBlank @Size(max = 20) String status, @Size(max = 500) String notes) {
    }

    public record UpdateFareRequest(@NotNull BigDecimal amount, @Size(max = 500) String notes) {
    }

    public record ChatMessageCard(Long chatHistoryId, String role, String content, OffsetDateTime sentAt) {
    }

    public record CreateRouteSuggestionRequest(Integer boardingStopId, Integer alightingStopId,
            @Size(max = 100) String preference) {
    }

    public record RatingRequest(@NotNull Integer tripId, @Min(1) @Max(5) Integer rating,
            @Size(max = 1000) String content) {
    }
}
