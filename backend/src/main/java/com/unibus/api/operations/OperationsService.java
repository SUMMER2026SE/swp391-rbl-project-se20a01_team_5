package com.unibus.api.operations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
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
import com.unibus.api.operations.OperationsDtos.DriverTripOverview;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.DriverContactView;
import com.unibus.api.operations.OperationsDtos.InternalMessageView;
import com.unibus.api.operations.OperationsDtos.LiveFleetVehicle;
import com.unibus.api.operations.OperationsDtos.SaveSchedulesRequest;
import com.unibus.api.operations.OperationsDtos.ScheduleDashboard;
import com.unibus.api.operations.OperationsDtos.ShiftAssignment;
import com.unibus.api.operations.OperationsDtos.TicketScanRequest;
import com.unibus.api.operations.OperationsDtos.TicketScanResult;
import com.unibus.api.operations.OperationsDtos.VehicleLocationRequest;
import com.unibus.api.operations.OperationsRepository.DriverScheduleTemplate;
import com.unibus.api.operations.OperationsRepository.TripRouteInfo;
import com.unibus.api.realtime.RealtimePublisher;
import com.unibus.api.security.CurrentUser;

@Service
public class OperationsService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OperationsRepository operationsRepository;
    private final RealtimePublisher realtimePublisher;

    public OperationsService(OperationsRepository operationsRepository,
            RealtimePublisher realtimePublisher) {
        this.operationsRepository = operationsRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional(readOnly = true)
    public ScheduleDashboard getScheduleDashboard(LocalDate date) {
        LocalDate serviceDate = date == null ? LocalDate.now(BUSINESS_ZONE) : date;
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
                operationsRepository.syncPendingTrip(scheduleId, serviceDate);
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
        return operationsRepository.findDriverTrips(driverStaffId, date == null ? LocalDate.now(BUSINESS_ZONE) : date);
    }

    @Transactional(readOnly = true)
    public List<DriverContactView> getDriverContacts(CurrentUser currentUser) {
        requireDriverStaffId(currentUser);
        List<DriverContactView> contacts = new ArrayList<>(operationsRepository.findDriverDispatcherContacts());
        contacts.add(new DriverContactView(
                null,
                "EMERGENCY",
                "Tổng đài khẩn cấp",
                "Hỗ trợ 24/7",
                "1900 1234",
                null));
        return contacts;
    }

    @Transactional(readOnly = true)
    public DriverTripOverview getDriverTripOverview(CurrentUser currentUser) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate horizon = today.plusDays(60);
        List<DriverTripView> trips = new ArrayList<>(operationsRepository.findDriverUpcomingActualTrips(driverStaffId, today, horizon));
        List<DriverTripView> historyTrips = operationsRepository.findDriverTripHistory(
                        driverStaffId,
                        today.minusDays(90),
                        horizon)
                .stream()
                .filter(this::isHistoryTrip)
                .sorted(Comparator.comparing((DriverTripView trip) -> tripDateTime(trip, true)).reversed())
                .limit(10)
                .toList();

        List<DriverTripView> existingTrips = new ArrayList<>(trips);
        existingTrips.addAll(historyTrips);
        trips.addAll(buildUpcomingScheduleTrips(driverStaffId, today, horizon, existingTrips));

        Comparator<DriverTripView> scheduleOrder = Comparator
                .comparing((DriverTripView trip) -> tripDateTime(trip, false))
                .thenComparingInt(this::tripStatusPriority)
                .thenComparing(trip -> trip.routeName() == null ? "" : trip.routeName())
                .thenComparing(trip -> trip.tripId() == null ? Integer.MAX_VALUE : trip.tripId());

        DriverTripView nearestTrip = trips.stream()
                .filter(this::isActiveRunningTrip)
                .min(scheduleOrder)
                .orElseGet(() -> trips.stream()
                        .filter(trip -> isUpcomingTrip(trip, today))
                        .min(scheduleOrder)
                        .orElse(null));

        List<DriverTripView> upcomingTrips = trips.stream()
                .filter(trip -> isUpcomingTrip(trip, today))
                .filter(trip -> !sameTrip(trip, nearestTrip))
                .sorted(scheduleOrder)
                .limit(5)
                .toList();

        return new DriverTripOverview(nearestTrip, upcomingTrips, historyTrips);
    }

    private List<DriverTripView> buildUpcomingScheduleTrips(
            Integer driverStaffId,
            LocalDate today,
            LocalDate horizon,
            List<DriverTripView> actualTrips) {
        return operationsRepository.findDriverScheduleTemplates(driverStaffId).stream()
                .map(template -> nextScheduleTrip(template, today, horizon, actualTrips))
                .filter(trip -> trip != null)
                .toList();
    }

    private DriverTripView nextScheduleTrip(
            DriverScheduleTemplate template,
            LocalDate today,
            LocalDate horizon,
            List<DriverTripView> actualTrips) {
        if (template.weekdayNumber() == null) {
            return null;
        }

        LocalDate serviceDate = nextDateForWeekday(today, template.weekdayNumber());
        while (!serviceDate.isAfter(horizon)
                && (hasActualTrip(actualTrips, template.scheduleId(), serviceDate)
                || scheduleWindowExpired(serviceDate, template.departureTime()))) {
            serviceDate = serviceDate.plusWeeks(1);
        }
        if (serviceDate.isAfter(horizon)) {
            return null;
        }

        return new DriverTripView(
                template.scheduleId(),
                null,
                template.routeId(),
                template.routeName(),
                template.busId(),
                template.licensePlate(),
                template.conductorName(),
                template.conductorPhone(),
                serviceDate,
                template.departureTime(),
                null,
                null,
                "NOT_CREATED",
                template.stops());
    }

    private LocalDate nextDateForWeekday(LocalDate startDate, int weekdayNumber) {
        int normalizedWeekday = Math.max(1, Math.min(7, weekdayNumber));
        int currentWeekday = startDate.getDayOfWeek().getValue();
        int daysUntil = Math.floorMod(normalizedWeekday - currentWeekday, 7);
        return startDate.plusDays(daysUntil);
    }

    private boolean hasActualTrip(List<DriverTripView> actualTrips, Integer scheduleId, LocalDate serviceDate) {
        return actualTrips.stream()
                .anyMatch(trip -> scheduleId != null
                        && scheduleId.equals(trip.scheduleId())
                        && serviceDate.equals(trip.serviceDate()));
    }

    @Transactional(readOnly = true)
    public List<ConductorTripView> getConductorTrips(CurrentUser currentUser, LocalDate date) {
        Integer conductorStaffId = requireConductorStaffId(currentUser);
        return operationsRepository.findConductorTrips(conductorStaffId, date == null ? LocalDate.now(BUSINESS_ZONE) : date);
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
        TicketScanResult windowBlock = scanWindowBlock(trip);
        if (windowBlock != null) {
            return windowBlock;
        }

        String qrCode = request.qrCode().trim();
        ConductorTicketView monthlyTicket = operationsRepository.findMonthlyTicketByQr(qrCode).orElse(null);
        if (monthlyTicket != null) {
            return scanMonthlyPass(monthlyTicket, trip, conductorStaffId);
        }

        ConductorTicketView journeyTicket = operationsRepository.findJourneyMonthlyTicketByQr(qrCode, trip.routeId()).orElse(null);
        if (journeyTicket != null) {
            return scanMonthlyPass(journeyTicket, trip, conductorStaffId);
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
        DriverTripView trip = requireDriverTrip(tripId, driverStaffId);
        String status = normalizedStatus(trip.status());
        if (!"NOT_STARTED".equals(status) && !"SCHEDULED".equals(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ chuyến chưa bắt đầu mới có thể khởi hành");
        }
        validateDriverStartWindow(trip);
        operationsRepository.lockDriverForTripStart(driverStaffId);
        if (operationsRepository.hasOtherRunningTrip(driverStaffId, tripId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đang có một chuyến khác chưa kết thúc");
        }
        if (operationsRepository.startTrip(tripId) != 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Trạng thái chuyến vừa thay đổi, vui lòng tải lại");
        }
        return findTripAfterChange(driverStaffId, tripId);
    }

    @Transactional
    public DriverTripView endTrip(CurrentUser currentUser, Integer tripId) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        DriverTripView trip = requireDriverTrip(tripId, driverStaffId);
        if (!"RUNNING".equals(normalizedStatus(trip.status()))
                || trip.departedAt() == null
                || trip.endedAt() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ có thể kết thúc chuyến đang chạy");
        }
        if (operationsRepository.endTrip(tripId) != 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Trạng thái chuyến vừa thay đổi, vui lòng tải lại");
        }
        return findTripAfterChange(driverStaffId, tripId);
    }

    @Transactional(readOnly = true)
    public DriverTripView getDriverTripForTracking(CurrentUser currentUser, Integer tripId) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        DriverTripView trip = operationsRepository.findDriverTrip(tripId, driverStaffId);
        if (trip == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy chuyến");
        }
        return trip;
    }

    @Transactional
    public void updateLocation(CurrentUser currentUser, Integer tripId, VehicleLocationRequest request) {
        Integer driverStaffId = requireDriverStaffId(currentUser);
        requireOwnedTrip(tripId, driverStaffId);
        operationsRepository.updateTripLocation(tripId, request.longitude(), request.latitude(), request.speedKmh(),
                request.occupancy());
        // Broadcast to all subscribers (students tracking this trip + coordinator live fleet).
        TripRouteInfo tripInfo = operationsRepository.tripRouteInfo(tripId).orElse(null);
        if (tripInfo != null) {
            realtimePublisher.publishTripLocation(tripId, tripInfo.routeId(),
                    request.longitude(), request.latitude(), request.speedKmh(), request.occupancy());
        } else {
            realtimePublisher.publishTripLocation(tripId, null,
                    request.longitude(), request.latitude(), request.speedKmh(), request.occupancy());
        }
    }

    @Transactional(readOnly = true)
    public List<LiveFleetVehicle> getLiveFleet(LocalDate date) {
        return operationsRepository.findLiveFleet(date == null ? LocalDate.now(BUSINESS_ZONE) : date);
    }

    private boolean isUpcomingTrip(DriverTripView trip, LocalDate today) {
        if (trip == null || trip.serviceDate() == null) {
            return false;
        }
        String status = normalizedStatus(trip.status());
        if ("RUNNING".equals(status)) {
            return isActiveRunningTrip(trip);
        }
        if ("COMPLETED".equals(status) || "CANCELLED".equals(status)) {
            return false;
        }
        if (trip.serviceDate().isBefore(today)) {
            return false;
        }
        return !scheduleWindowExpired(trip.serviceDate(), trip.departureTime());
    }

    private boolean scheduleWindowExpired(LocalDate serviceDate, LocalTime departureTime) {
        if (serviceDate == null || departureTime == null) {
            return false;
        }
        LocalDateTime scheduledStart = LocalDateTime.of(serviceDate, departureTime);
        return LocalDateTime.now(BUSINESS_ZONE).isAfter(scheduledStart.plusMinutes(60));
    }

    private int tripStatusPriority(DriverTripView trip) {
        if (trip == null) {
            return 3;
        }
        if (isActiveRunningTrip(trip)) {
            return 0;
        }
        if (trip.tripId() != null) {
            return 1;
        }
        return 2;
    }

    private boolean isActiveRunningTrip(DriverTripView trip) {
        return trip != null
                && "RUNNING".equals(normalizedStatus(trip.status()))
                && trip.departedAt() != null
                && trip.endedAt() == null;
    }

    private boolean isHistoryTrip(DriverTripView trip) {
        if (trip == null || trip.serviceDate() == null) {
            return false;
        }
        return "COMPLETED".equals(trip.status()) || "CANCELLED".equals(trip.status());
    }

    private boolean sameTrip(DriverTripView left, DriverTripView right) {
        if (left == null || right == null) {
            return false;
        }
        if (left.tripId() != null && right.tripId() != null) {
            return left.tripId().equals(right.tripId());
        }
        if (left.scheduleId() == null || right.scheduleId() == null) {
            return false;
        }
        return left.scheduleId().equals(right.scheduleId())
                && left.serviceDate() != null
                && left.serviceDate().equals(right.serviceDate());
    }

    private LocalDateTime tripDateTime(DriverTripView trip, boolean preferActualEnd) {
        LocalDate date = trip.serviceDate() == null ? LocalDate.MAX : trip.serviceDate();
        LocalTime time = trip.departureTime() == null ? LocalTime.MAX : trip.departureTime();
        if (preferActualEnd && trip.endedAt() != null) {
            return trip.endedAt().toLocalDateTime();
        }
        if (preferActualEnd && trip.departedAt() != null) {
            return trip.departedAt().toLocalDateTime();
        }
        return LocalDateTime.of(date, time);
    }

    private TicketScanResult scanWindowBlock(TripRouteInfo trip) {
        String status = normalizedStatus(trip.status());
        if ("NOT_STARTED".equals(status) || "NOT_CREATED".equals(status)) {
            return new TicketScanResult(false, "Tài xế chưa bắt đầu chuyến.", null, null);
        }
        if ("COMPLETED".equals(status)) {
            return new TicketScanResult(false, "Chuyến đã hoàn thành.", null, null);
        }
        if ("CANCELLED".equals(status)) {
            return new TicketScanResult(false, "Chuyến đã bị hủy.", null, null);
        }
        if (!"RUNNING".equals(status) || trip.departedAt() == null || trip.endedAt() != null) {
            return new TicketScanResult(false, "Chuyến chưa mở để quét vé.", null, null);
        }
        if (trip.serviceDate() == null || trip.departureTime() == null) {
            return new TicketScanResult(false, "Chuyến chưa có giờ vận hành.", null, null);
        }
        LocalDateTime scheduledStart = LocalDateTime.of(trip.serviceDate(), trip.departureTime());
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        if (now.isBefore(scheduledStart.minusMinutes(30))) {
            return new TicketScanResult(false, "Chưa đến thời gian quét vé.", null, null);
        }
        if (now.isAfter(scheduledStart.plusHours(3))) {
            return new TicketScanResult(false, "Chuyến đã quá thời gian quét vé.", null, null);
        }
        return null;
    }

    private TicketScanResult scanMonthlyPass(
            ConductorTicketView ticket,
            TripRouteInfo trip,
            Integer conductorStaffId) {
        if (!"ACTIVE".equals(ticket.status())) {
            return new TicketScanResult(false, "Vé tháng không còn hoạt động.", ticket, null);
        }
        if (!ticket.routeId().equals(trip.routeId())) {
            return new TicketScanResult(false, "Vé không hợp lệ cho chuyến này", ticket, null);
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
            return new TicketScanResult(false, "Vé không hợp lệ cho chuyến này", ticket, null);
        }
        if ("USED".equals(ticket.status())) {
            return new TicketScanResult(false, "Vé lượt đã được sử dụng", ticket, null);
        }
        if ("EXPIRED".equals(ticket.status())) {
            return new TicketScanResult(false, "Vé lượt đã hết hạn", ticket, null);
        }
        if (!"UNUSED".equals(ticket.status())) {
            return new TicketScanResult(false, "Vé lượt không còn hợp lệ", ticket, null);
        }
        if (ticket.expiresAt() != null && ticket.expiresAt().atZoneSameInstant(BUSINESS_ZONE).toOffsetDateTime().isBefore(OffsetDateTime.now(BUSINESS_ZONE))) {
            return new TicketScanResult(false, "Vé lượt đã hết hạn.", ticket, null);
        }

        int updated = operationsRepository.markSingleTicketUsed(ticket.ticketId(), trip.tripId(), conductorStaffId);
        if (updated == 0) {
            ConductorTicketView current = operationsRepository.findSingleTicketByQr(ticket.qrCode()).orElse(ticket);
            String message = "USED".equals(current.status()) ? "Vé lượt đã được sử dụng" : "Vé lượt không còn hợp lệ";
            return new TicketScanResult(false, message, current, null);
        }
        Integer historyId = operationsRepository.ensureTravelHistoryForScan(
                ticket.studentCode(),
                trip.tripId(),
                conductorStaffId,
                trip.routeId());
        ConductorTicketView refreshed = operationsRepository.findSingleTicketByQr(ticket.qrCode()).orElse(ticket);
        return new TicketScanResult(true, "Vé lượt hợp lệ. Đã ghi nhận sinh viên lên xe.", refreshed, historyId);
    }

    private DriverTripView requireDriverTrip(Integer tripId, Integer driverStaffId) {
        DriverTripView trip = operationsRepository.findDriverTrip(tripId, driverStaffId);
        if (trip == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        return trip;
    }

    private String normalizedStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase();
    }

    private void validateDriverStartWindow(DriverTripView trip) {
        if (trip.serviceDate() == null || trip.departureTime() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chuyến chưa có ngày giờ khởi hành");
        }
        LocalDateTime scheduledStart = LocalDateTime.of(trip.serviceDate(), trip.departureTime());
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        if (now.isBefore(scheduledStart.minusMinutes(30))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chưa đến giờ bắt đầu chuyến");
        }
        if (now.isAfter(scheduledStart.plusMinutes(60))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chuyến đã quá giờ bắt đầu");
        }
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
