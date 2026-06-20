package com.unibus.api.coordinator.dto;

import java.time.LocalTime;

public class CoordinatorSchedulesDtos {

    public record ScheduleListItem(
            Integer id,
            Integer routeId,
            String routeName,
            Integer busId,
            String licensePlate,
            Integer driverId,
            String driverName,
            Integer weekdayNumber,
            LocalTime departureTime,
            LocalTime endTime,
            String status) {
    }

    public record CreateScheduleRequest(
            Integer routeId,
            Integer busId,
            Integer driverId,
            Integer weekdayNumber,
            LocalTime departureTime) {
    }

    public record BusDropdownDto(
            Integer id,
            String licensePlate,
            Integer seatCount) {
    }

    public record DriverDropdownDto(
            Integer id,
            String driverName) {
    }
}
