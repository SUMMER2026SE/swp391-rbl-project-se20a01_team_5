package com.unibus.api.driver.dto;

import java.time.LocalDate;
import java.util.List;

public final class DriverDtos {
    private DriverDtos() {
    }

    public record DriverStop(Integer id, String name, String time, String status) {
    }

    public record DriverTrip(
            String tripId,
            String routeName,
            String status,
            String licensePlate,
            String driverName,
            String conductorName,
            String conductorPhone,
            String dispatcherName,
            String dispatcherPhone,
            String departedAt,
            String estimatedArrivalAt,
            Integer averageSpeed,
            Integer passengerCount,
            Integer capacity,
            Integer safetyScore,
            String alerts,
            List<DriverStop> stops) {
    }

    public record DriverSchedule(String id, String timeRange, String routeName, String status) {
    }

    public record DriverDashboard(DriverTrip currentTrip, List<DriverSchedule> nextSchedules, String tripStatus) {
    }

    public record DriverContact(String name, String role, String phone, String status) {
    }

    public record DriverContactPage(DriverContact dispatcher, List<DriverContact> contacts, List<String> sosTypes) {
    }

    public record DriverProfile(
            String employeeId,
            String fullName,
            String phone,
            String email,
            String address,
            Integer totalTrips,
            Integer drivingHoursThisMonth,
            Integer safetyScore,
            String licenseClass,
            LocalDate licenseExpiryDate,
            String healthCertificateStatus) {
    }

    public record DriverActionRequest(String note, String incidentType, String message) {
    }

    public record DriverActionResponse(String status, String message, DriverTrip trip) {
    }
}
