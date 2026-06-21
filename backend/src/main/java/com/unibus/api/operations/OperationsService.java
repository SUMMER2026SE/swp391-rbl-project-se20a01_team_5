package com.unibus.api.operations;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.operations.OperationsDtos.ConductorTicketView;
import com.unibus.api.operations.OperationsDtos.ConductorTripView;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.LiveFleetVehicle;
import com.unibus.api.operations.OperationsDtos.SaveSchedulesRequest;
import com.unibus.api.operations.OperationsDtos.ScheduleDashboard;
import com.unibus.api.operations.OperationsDtos.ShiftAssignment;
import com.unibus.api.operations.OperationsDtos.TicketScanRequest;
import com.unibus.api.operations.OperationsDtos.TicketScanResult;
import com.unibus.api.operations.OperationsDtos.VehicleLocationRequest;
import com.unibus.api.operations.OperationsRepository.TripRouteInfo;
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
                if (shift.scheduleId() != null) {
                    String currentTripStatus = operationsRepository.getTripStatusForSchedule(shift.scheduleId(), serviceDate);
                    if ("RUNNING".equals(currentTripStatus) || "COMPLETED".equals(currentTripStatus)) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể thay đổi ca chạy đang hoạt động hoặc đã hoàn thành");
                    }
                }
                ShiftAssignment normalizedShift = normalizeShift(shift, serviceDate);
                validateShift(normalizedShift, serviceDate);
                Integer scheduleId = operationsRepository.saveSchedule(normalizedShift, currentUser.userId());
                operationsRepository.ensureTrip(scheduleId, serviceDate);
            }
        }
        return getScheduleDashboard(serviceDate);
    }

    @Transactional
    public void deleteSchedule(Integer scheduleId, LocalDate date) {
        if (date != null) {
            String currentTripStatus = operationsRepository.getTripStatusForSchedule(scheduleId, date);
            if ("RUNNING".equals(currentTripStatus) || "COMPLETED".equals(currentTripStatus)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể xóa ca chạy đang hoạt động hoặc đã hoàn thành");
            }
        }
        operationsRepository.deleteSchedule(scheduleId);
    }

    @Transactional(readOnly = true)
    public List<DriverTripView> getDriverTrips(CurrentUser currentUser, LocalDate date) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        return operationsRepository.findDriverTrips(driverStaffId, date == null ? LocalDate.now() : date);
    }

    @Transactional(readOnly = true)
    public List<ConductorTripView> getConductorTrips(CurrentUser currentUser, LocalDate date) {
        Integer conductorStaffId = requireConductorStaffId(currentUser);
        return operationsRepository.findConductorTrips(conductorStaffId, date == null ? LocalDate.now() : date);
    }

    @Transactional(readOnly = true)
    public List<ConductorTicketView> getConductorTickets(CurrentUser currentUser, Integer tripId) {
        Integer conductorStaffId = requireConductorStaffId(currentUser);
        requireOwnedConductorTrip(tripId, conductorStaffId);
        return operationsRepository.findTicketsForTrip(tripId);
    }

    @Transactional
    public TicketScanResult scanTicket(CurrentUser currentUser, TicketScanRequest request) {
        Integer conductorStaffId = requireConductorStaffId(currentUser);
        requireOwnedConductorTrip(request.tripId(), conductorStaffId);
        TripRouteInfo trip = operationsRepository.tripRouteInfo(request.tripId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));

        String qrCode = request.qrCode().trim();
        ConductorTicketView monthlyTicket = operationsRepository.findMonthlyTicketByQr(qrCode).orElse(null);
        if (monthlyTicket != null) {
            return scanMonthlyPass(monthlyTicket, trip, conductorStaffId);
        }

        ConductorTicketView singleTicket = operationsRepository.findSingleTicketByQr(qrCode).orElse(null);
        if (singleTicket != null) {
            return scanSingleTripTicket(singleTicket, trip, conductorStaffId);
        }

        return new TicketScanResult(false, "Không tìm thấy vé với mã QR này.", null, null);
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
        operationsRepository.updateTripLocation(tripId, request.longitude(), request.latitude(), request.speedKmh(),
                request.occupancy());
    }

    @Transactional(readOnly = true)
    public List<LiveFleetVehicle> getLiveFleet(LocalDate date) {
        return operationsRepository.findLiveFleet(date == null ? LocalDate.now() : date);
    }

    private TicketScanResult scanMonthlyPass(
            ConductorTicketView ticket,
            TripRouteInfo trip,
            Integer conductorStaffId) {
        if (!"ACTIVE".equals(ticket.status())) {
            return new TicketScanResult(false, "Vé tháng không còn hoạt động.", ticket, null);
        }
        if (!ticket.routeId().equals(trip.routeId())) {
            return new TicketScanResult(false, "Vé không thuộc tuyến của chuyến này.", ticket, null);
        }
        if (ticket.validFrom() != null && ticket.validFrom().toLocalDate().isAfter(trip.serviceDate())) {
            return new TicketScanResult(false, "Vé chưa tới ngày hiệu lực.", ticket, null);
        }
        if (ticket.expiresAt() != null && !ticket.expiresAt().toLocalDate().isAfter(trip.serviceDate())) {
            return new TicketScanResult(false, "Vé đã hết hạn.", ticket, null);
        }

        operationsRepository.markMonthlyPassScanned(ticket.ticketId());
        Integer historyId = operationsRepository.ensureTravelHistoryForScan(
                ticket.studentCode(),
                trip.tripId(),
                conductorStaffId,
                trip.routeId());
        ConductorTicketView refreshed = operationsRepository.findMonthlyTicketByQr(ticket.qrCode()).orElse(ticket);
        return new TicketScanResult(true, "Vé tháng hợp lệ. Đã ghi nhận sinh viên lên xe.", refreshed, historyId);
    }

    private TicketScanResult scanSingleTripTicket(
            ConductorTicketView ticket,
            TripRouteInfo trip,
            Integer conductorStaffId) {
        if (!ticket.routeId().equals(trip.routeId())) {
            return new TicketScanResult(false, "Vé không thuộc tuyến của chuyến này.", ticket, null);
        }
        if (!"UNUSED".equals(ticket.status())) {
            return new TicketScanResult(false, "Vé lượt đã được sử dụng hoặc không còn hợp lệ.", ticket, null);
        }
        if (ticket.expiresAt() != null && ticket.expiresAt().isBefore(OffsetDateTime.now())) {
            return new TicketScanResult(false, "Vé lượt đã hết hạn.", ticket, null);
        }

        operationsRepository.markSingleTicketUsed(ticket.ticketId(), trip.tripId(), conductorStaffId);
        Integer historyId = operationsRepository.ensureTravelHistoryForScan(
                ticket.studentCode(),
                trip.tripId(),
                conductorStaffId,
                trip.routeId());
        ConductorTicketView refreshed = operationsRepository.findSingleTicketByQr(ticket.qrCode()).orElse(ticket);
        return new TicketScanResult(true, "Vé lượt hợp lệ. Đã ghi nhận sinh viên lên xe.", refreshed, historyId);
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

    private Integer requireConductorStaffId(CurrentUser currentUser) {
        Integer conductorStaffId = operationsRepository.staffIdForUser(currentUser.userId(), "CONDUCTOR");
        if (conductorStaffId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Conductor staff profile not found");
        }
        return conductorStaffId;
    }

    private void requireOwnedTrip(Integer tripId, Integer driverStaffId) {
        if (!operationsRepository.driverOwnsTrip(tripId, driverStaffId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
    }

    private void requireOwnedConductorTrip(Integer tripId, Integer conductorStaffId) {
        if (tripId == null || !operationsRepository.conductorOwnsTrip(tripId, conductorStaffId)) {
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
