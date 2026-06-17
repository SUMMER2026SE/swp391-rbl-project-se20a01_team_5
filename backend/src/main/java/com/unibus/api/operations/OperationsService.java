package com.unibus.api.operations;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.operations.OperationsDtos.ConductorContactView;
import com.unibus.api.operations.OperationsDtos.ConductorMessageRequest;
import com.unibus.api.operations.OperationsDtos.ConductorSupportRequest;
import com.unibus.api.operations.OperationsDtos.ConductorSupportResult;
import com.unibus.api.operations.OperationsDtos.ConductorTicketView;
import com.unibus.api.operations.OperationsDtos.ConductorTripView;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.InternalMessageView;
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

    @Transactional(readOnly = true)
    public ConductorContactView getConductorContact(CurrentUser currentUser) {
        Integer conductorStaffId = requireConductorStaffId(currentUser);
        Integer activeTripId = operationsRepository.activeConductorTripId(conductorStaffId);
        return operationsRepository.findConductorContact(currentUser.userId(), conductorStaffId, activeTripId);
    }

    @Transactional
    public InternalMessageView sendConductorMessage(CurrentUser currentUser, ConductorMessageRequest request) {
        Integer conductorStaffId = requireConductorStaffId(currentUser);
        Integer tripId = resolveOptionalConductorTripId(conductorStaffId, request.tripId());
        Integer recipientUserId = resolveConductorMessageRecipient(request.recipientType(), tripId);
        String content = request.content().trim();
        InternalMessageView message = operationsRepository.createInternalMessage(currentUser.userId(), recipientUserId, tripId, content);
        operationsRepository.createNotification(currentUser.userId(), recipientUserId, "Tin nhắn từ phụ xe", content);
        return message;
    }

    @Transactional
    public ConductorSupportResult submitConductorSupport(CurrentUser currentUser, ConductorSupportRequest request) {
        Integer conductorStaffId = requireConductorStaffId(currentUser);
        Integer tripId = resolveRequiredConductorTripId(conductorStaffId, request.tripId());
        String reportType = normalizeSupportType(request.reportType());
        String description = buildSupportDescription(request);

        Long reportId;
        String resultType;
        if ("LOST_ITEM".equals(reportType)) {
            reportId = operationsRepository.createLostItemReport(currentUser.userId(), tripId, description, currentUser.userId());
            resultType = "LOST_ITEM";
        } else {
            reportId = operationsRepository.createIncident(conductorStaffId, tripId, reportType, description);
            resultType = "INCIDENT";
        }

        Integer recipientUserId = operationsRepository.driverUserIdForTrip(tripId)
                .orElseGet(() -> operationsRepository.firstDispatcherUserId().orElse(null));
        InternalMessageView notification = null;
        if (recipientUserId != null) {
            String messageContent = "[" + resultType + "] " + description;
            notification = operationsRepository.createInternalMessage(currentUser.userId(), recipientUserId, tripId, messageContent);
            operationsRepository.createNotification(currentUser.userId(), recipientUserId, "Báo cáo từ phụ xe", messageContent);
        }
        operationsRepository.firstDispatcherUserId()
                .filter(userId -> !userId.equals(recipientUserId))
                .ifPresent(dispatcherUserId -> operationsRepository.createNotification(
                        currentUser.userId(),
                        dispatcherUserId,
                        "Báo cáo từ phụ xe",
                        "[" + resultType + "] " + description));

        return new ConductorSupportResult(resultType, reportId, "Đã gửi báo cáo cho bộ phận liên quan.", notification);
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

    private Integer resolveOptionalConductorTripId(Integer conductorStaffId, Integer requestedTripId) {
        Integer tripId = requestedTripId == null ? operationsRepository.activeConductorTripId(conductorStaffId) : requestedTripId;
        if (tripId == null) {
            return null;
        }
        requireOwnedConductorTrip(tripId, conductorStaffId);
        return tripId;
    }

    private Integer resolveRequiredConductorTripId(Integer conductorStaffId, Integer requestedTripId) {
        Integer tripId = resolveOptionalConductorTripId(conductorStaffId, requestedTripId);
        if (tripId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Support report requires a conductor trip");
        }
        return tripId;
    }

    private Integer resolveConductorMessageRecipient(String recipientType, Integer tripId) {
        String target = recipientType == null ? "" : recipientType.trim().toUpperCase();
        if ("DRIVER".equals(target) && tripId != null) {
            return operationsRepository.driverUserIdForTrip(tripId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Driver contact not found"));
        }
        return operationsRepository.firstDispatcherUserId()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Dispatcher contact not found"));
    }

    private String normalizeSupportType(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        return switch (normalized) {
            case "LOST_ITEM" -> "LOST_ITEM";
            case "OVERCROWDED", "EMERGENCY", "TECHNICAL", "OTHER" -> normalized;
            case "OVERLOAD" -> "OVERCROWDED";
            default -> "OTHER";
        };
    }

    private String buildSupportDescription(ConductorSupportRequest request) {
        StringBuilder builder = new StringBuilder(request.description().trim());
        if (request.passengerName() != null && !request.passengerName().isBlank()) {
            builder.append(" | Hành khách: ").append(request.passengerName().trim());
        }
        if (request.location() != null && !request.location().isBlank()) {
            builder.append(" | Vị trí: ").append(request.location().trim());
        }
        return builder.toString();
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
