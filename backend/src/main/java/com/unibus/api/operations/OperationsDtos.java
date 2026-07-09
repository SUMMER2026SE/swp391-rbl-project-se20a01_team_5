package com.unibus.api.operations;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class OperationsDtos {

    private OperationsDtos() {
    }

    public record ScheduleDashboard(
            LocalDate serviceDate,
            List<ShiftView> shifts,
            List<StaffOption> drivers,
            List<StaffOption> conductors,
            List<BusOption> buses,
            List<RouteOption> routes) {
    }

    public record ShiftView(
            Integer scheduleId,
            Integer tripId,
            Integer routeId,
            String routeName,
            Integer busId,
            String licensePlate,
            Integer driverStaffId,
            String driverName,
            Integer conductorStaffId,
            String conductorName,
            Integer weekdayNumber,
            LocalTime departureTime,
            String time,
            String status) {
    }

    public record StaffOption(Integer staffId, Integer userId, String fullName, String role, String status) {
    }

    public record BusOption(Integer busId, String licensePlate, Integer seatCount, String busType, String status) {
    }

    public record RouteOption(Integer routeId, String routeName) {
    }

    public record SaveSchedulesRequest(@NotNull LocalDate serviceDate, @Valid List<ShiftAssignment> shifts) {
    }

    public record ShiftAssignment(
            Integer scheduleId,
            Integer routeId,
            Integer busId,
            Integer driverStaffId,
            Integer conductorStaffId,
            Integer weekdayNumber,
            LocalTime departureTime) {
    }

    public record DriverTripView(
            Integer scheduleId,
            Integer tripId,
            Integer routeId,
            String routeName,
            Integer busId,
            String licensePlate,
            String conductorName,
            String conductorPhone,
            LocalDate serviceDate,
            LocalTime departureTime,
            OffsetDateTime departedAt,
            OffsetDateTime endedAt,
            String status,
            List<TripStopView> stops) {
    }

    public record DriverTripOverview(
            DriverTripView nearestTrip,
            List<DriverTripView> upcomingTrips,
            List<DriverTripView> historyTrips) {
    }

    public record ConductorTripView(
            Integer scheduleId,
            Integer tripId,
            Integer routeId,
            String routeName,
            Integer busId,
            String licensePlate,
            String driverName,
            String driverPhone,
            LocalDate serviceDate,
            LocalTime departureTime,
            OffsetDateTime departedAt,
            OffsetDateTime endedAt,
            String status,
            List<TripStopView> stops) {
    }

    public record ConductorTicketView(
            String ticketKind,
            Integer ticketId,
            String qrCode,
            String studentCode,
            String studentName,
            Integer routeId,
            String routeName,
            String boardingStopName,
            String alightingStopName,
            String status,
            OffsetDateTime validFrom,
            OffsetDateTime expiresAt,
            OffsetDateTime lastScannedAt) {
    }

    public record TicketScanRequest(
            @NotNull Integer tripId,
            @NotBlank String qrCode) {
    }

    public record TicketScanResult(
            boolean valid,
            String message,
            ConductorTicketView ticket,
            Integer travelHistoryId) {
    }

    public record ConductorContactView(
            Integer activeTripId,
            String routeName,
            String driverName,
            String driverPhone,
            List<ContactPersonView> contacts,
            List<InternalMessageView> messages) {
    }

    public record ContactPersonView(
            Integer userId,
            String name,
            String role,
            String phoneNumber,
            boolean primary) {
    }

    public record DriverContactView(
            String type,
            String name,
            String role,
            String phone,
            String email) {
    }

    public record InternalMessageView(
            Long messageId,
            Integer senderUserId,
            String senderName,
            Integer recipientUserId,
            String recipientName,
            Integer tripId,
            String content,
            boolean read,
            OffsetDateTime sentAt) {
    }

    public record ConductorMessageRequest(
            Integer tripId,
            @NotBlank String recipientType,
            @NotBlank String content) {
    }

    public record ConductorSupportRequest(
            Integer tripId,
            @NotBlank String reportType,
            String passengerName,
            String location,
            @NotBlank String description) {
    }

    public record ConductorSupportResult(
            String type,
            Long reportId,
            String message,
            InternalMessageView notificationMessage) {
    }

    public record LiveFleetVehicle(
            Integer tripId,
            Integer routeId,
            String routeName,
            Integer busId,
            String licensePlate,
            String driverName,
            String conductorName,
            LocalDate serviceDate,
            LocalTime departureTime,
            String status,
            Double longitude,
            Double latitude,
            Double speedKmh,
            Integer occupancy,
            OffsetDateTime locationUpdatedAt) {
    }

    public record TripStopView(
            Integer routeStopId,
            Integer stopId,
            String stopName,
            Integer stopOrder,
            Integer minutesFromPreviousStop,
            Integer stationDirection,
            String pathPoints,
            Double latitude,
            Double longitude) {
    }

    public record VehicleLocationRequest(
            @NotNull Double longitude,
            @NotNull Double latitude,
            Double speedKmh,
            Integer occupancy) {
    }
}
