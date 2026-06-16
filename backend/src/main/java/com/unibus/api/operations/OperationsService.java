package com.unibus.api.operations;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.SaveSchedulesRequest;
import com.unibus.api.operations.OperationsDtos.ScheduleDashboard;
import com.unibus.api.operations.OperationsDtos.ShiftAssignment;
import com.unibus.api.operations.OperationsDtos.VehicleLocationRequest;
import com.unibus.api.security.CurrentUser;

@Service
public class OperationsService {

    private final OperationsRepository operationsRepository;

    public OperationsService(OperationsRepository operationsRepository) {
        this.operationsRepository = operationsRepository;
    }

    @Transactional(readOnly = true)
    public ScheduleDashboard getScheduleDashboard(LocalDate date) {
        LocalDate serviceDate = date == null ? LocalDate.now() : date;
        return new ScheduleDashboard(
                serviceDate,
                operationsRepository.findShifts(serviceDate),
                operationsRepository.findStaff("DRIVER"),
                operationsRepository.findStaff("CONDUCTOR"),
                operationsRepository.findBuses(),
                operationsRepository.findRoutes());
    }

    @Transactional
    public ScheduleDashboard saveSchedules(CurrentUser currentUser, SaveSchedulesRequest request) {
        LocalDate serviceDate = request.serviceDate();
        if (request.shifts() != null) {
            for (ShiftAssignment shift : request.shifts()) {
                ShiftAssignment normalizedShift = normalizeShift(shift, serviceDate);
                validateShift(normalizedShift, serviceDate);
                Integer scheduleId = operationsRepository.saveSchedule(normalizedShift, currentUser.userId());
                operationsRepository.ensureTrip(scheduleId, serviceDate);
            }
        }
        return getScheduleDashboard(serviceDate);
    }

    @Transactional(readOnly = true)
    public List<DriverTripView> getDriverTrips(CurrentUser currentUser, LocalDate date) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        return operationsRepository.findDriverTrips(driverStaffId, date == null ? LocalDate.now() : date);
    }

    @Transactional
    public DriverTripView startTrip(CurrentUser currentUser, Integer tripId) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        requireOwnedTrip(tripId, driverStaffId);
        operationsRepository.startTrip(tripId);
        return findTripAfterChange(driverStaffId, tripId);
    }

    @Transactional
    public DriverTripView endTrip(CurrentUser currentUser, Integer tripId) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        requireOwnedTrip(tripId, driverStaffId);
        operationsRepository.endTrip(tripId);
        return findTripAfterChange(driverStaffId, tripId);
    }

    @Transactional
    public void updateLocation(CurrentUser currentUser, Integer tripId, VehicleLocationRequest request) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        requireOwnedTrip(tripId, driverStaffId);
        operationsRepository.updateTripLocation(tripId, request.longitude(), request.latitude(), request.speedKmh());
    }

    private DriverTripView findTripAfterChange(Integer driverStaffId, Integer tripId) {
        DriverTripView trip = operationsRepository.findDriverTrip(tripId, driverStaffId);
        if (trip == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        return trip;
    }

    private Integer requireDriverStaffId(CurrentUser currentUser) {
        Integer driverStaffId = operationsRepository.staffIdForUser(currentUser.userId(), "DRIVER");
        if (driverStaffId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Driver staff profile not found");
        }
        return driverStaffId;
    }

    private void requireOwnedTrip(Integer tripId, Integer driverStaffId) {
        if (!operationsRepository.driverOwnsTrip(tripId, driverStaffId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
    }

    private void validateShift(ShiftAssignment shift, LocalDate serviceDate) {
        if (shift.scheduleId() == null && (shift.routeId() == null || shift.departureTime() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New schedule requires route and departure time");
        }
        if (shift.scheduleId() == null && shift.weekdayNumber() == null && serviceDate == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New schedule requires weekday or service date");
        }
    }

    private ShiftAssignment normalizeShift(ShiftAssignment shift, LocalDate serviceDate) {
        Integer weekday = shift.weekdayNumber();
        if (weekday == null && serviceDate != null) {
            weekday = serviceDate.getDayOfWeek().getValue();
        }
        return new ShiftAssignment(
                shift.scheduleId(),
                shift.routeId(),
                shift.busId(),
                shift.driverStaffId(),
                shift.conductorStaffId(),
                weekday,
                shift.departureTime());
    }
}
