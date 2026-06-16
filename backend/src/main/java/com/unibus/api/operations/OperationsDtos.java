package com.unibus.api.operations;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.Valid;
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

    public record TripStopView(
            Integer routeStopId,
            Integer stopId,
            String stopName,
            Integer stopOrder,
            Integer minutesFromPreviousStop) {
    }

    public record VehicleLocationRequest(
            @NotNull Double longitude,
            @NotNull Double latitude,
            Double speedKmh) {
    }
}
