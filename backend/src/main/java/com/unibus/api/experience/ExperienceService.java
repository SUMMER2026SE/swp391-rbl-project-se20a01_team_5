package com.unibus.api.experience;

import static com.unibus.api.experience.ExperienceDtos.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.realtime.RealtimePublisher;
import com.unibus.api.security.CurrentUser;

@Service
public class ExperienceService {

    public record AdminReportFile(String fileName, byte[] bytes) {
    }

    private final ExperienceRepository repository;
    private final RealtimePublisher realtimePublisher;

    public ExperienceService(ExperienceRepository repository, RealtimePublisher realtimePublisher) {
        this.repository = repository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional(readOnly = true)
    public StudentDashboardView studentDashboard(CurrentUser currentUser) {
        return repository.studentDashboard(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public List<RouteCard> studentRouteSuggestions(CurrentUser currentUser) {
        return repository.studentRouteSuggestions(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public List<LostItemCard> studentLostItems(CurrentUser currentUser) {
        return repository.studentLostItems(currentUser.userId());
    }

    @Transactional
    public LostItemCard createStudentLostItem(CurrentUser currentUser, CreateLostItemRequest request) {
        return repository.createLostItem(currentUser.userId(), request);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketCard> supportTickets(CurrentUser currentUser) {
        return repository.supportTickets(currentUser.userId());
    }

    @Transactional
    public SupportTicketCard createSupportTicket(CurrentUser currentUser, CreateSupportTicketRequest request) {
        return repository.createSupportTicket(currentUser.userId(), request);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageCard> assistantChat(CurrentUser currentUser) {
        return repository.chatHistory(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public DriverDashboardView driverDashboard(CurrentUser currentUser) {
        requireDriver(currentUser);
        return repository.driverDashboard(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public List<FeedbackCard> driverFeedback(CurrentUser currentUser) {
        Integer driverId = requireDriver(currentUser);
        return repository.driverFeedback(driverId, 50);
    }

    @Transactional(readOnly = true)
    public AssistantDashboardView assistantDashboard(CurrentUser currentUser) {
        requireConductor(currentUser);
        return repository.assistantDashboard(currentUser.userId());
    }

    @Transactional
    public IncidentCard createIncident(CurrentUser currentUser, CreateIncidentRequest request) {
        Integer conductorId = requireConductor(currentUser);
        return repository.createIncident(conductorId, request);
    }

    @Transactional(readOnly = true)
    public List<IncidentCard> incidents(CurrentUser currentUser) {
        Integer conductorId = requireConductor(currentUser);
        return repository.incidents(conductorId, 50);
    }

    @Transactional(readOnly = true)
    public List<LostItemCard> assistantLostItems(CurrentUser currentUser) {
        requireConductor(currentUser);
        return repository.lostItemsForAssistant(currentUser.userId(), 50);
    }

    @Transactional
    public LostItemCard updateAssistantLostItem(CurrentUser currentUser, Integer lostItemId,
            UpdateLostItemStatusRequest request) {
        requireConductor(currentUser);
        return repository.updateLostItem(currentUser.userId(), lostItemId, normalizeLostItemStatus(request));
    }

    private UpdateLostItemStatusRequest normalizeLostItemStatus(UpdateLostItemStatusRequest request) {
        String status = switch (request.status().trim().toUpperCase()) {
            case "FOUND", "SEARCHING" -> "FOUND";
            case "RETURNED", "CLOSED" -> "FOUND";
            case "NOT_FOUND" -> "NOT_FOUND";
            case "REPORTED" -> "REPORTED";
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái đồ thất lạc không hợp lệ");
        };
        return new UpdateLostItemStatusRequest(status, request.notes());
    }

    @Transactional(readOnly = true)
    public List<LostItemCard> coordinatorLostItems() {
        return repository.coordinatorLostItems(100);
    }

    @Transactional
    public LostItemCard coordinatorUpdateLostItem(CurrentUser currentUser, Integer lostItemId, UpdateLostItemStatusRequest request) {
        return repository.coordinatorUpdateLostItem(currentUser.userId(), lostItemId, normalizeLostItemStatus(request));
    }

    public CoordinatorDashboardView coordinatorDashboard() {
        return repository.coordinatorDashboard();
    }

    @Transactional(readOnly = true)
    public List<UniversityOperationsMetric> coordinatorByUniversity() {
        return repository.coordinatorByUniversity();
    }

    @Transactional(readOnly = true)
    public List<UniversityRouteOperationsMetric> coordinatorUniversityRoutes(Integer universityId) {
        return repository.coordinatorUniversityRoutes(universityId);
    }

    @Transactional(readOnly = true)
    public List<FeedbackCard> coordinatorFeedback(String status) {
        return repository.allFeedback(status, 50);
    }

    @Transactional(readOnly = true)
    public AdminStatsView adminStats(int days) {
        return adminStats(days, null, null);
    }

    @Transactional(readOnly = true)
    public AdminStatsView adminStats(int days, LocalDate from, LocalDate to) {
        if (from != null || to != null) {
            LocalDate effectiveTo = to == null ? LocalDate.now() : to;
            LocalDate effectiveFrom = from == null ? effectiveTo.minusDays(Math.max(1, Math.min(days, 90)) - 1L) : from;
            if (effectiveFrom.isAfter(effectiveTo)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid report date range");
            }
            if (effectiveFrom.plusDays(366).isBefore(effectiveTo)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Report date range is too large");
            }
            return repository.adminStats(effectiveFrom, effectiveTo);
        }
        return repository.adminStats(Math.max(1, Math.min(days, 90)));
    }

    @Transactional(readOnly = true)
    public AdminReportFile adminReportExport(int days, LocalDate from, LocalDate to) {
        ReportRange range = resolveReportRange(days, from, to);
        AdminStatsView report = repository.adminStats(range.from(), range.to());
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle moneyStyle = workbook.createCellStyle();
            moneyStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("#,##0"));

            Sheet summarySheet = workbook.createSheet("Tong quan");
            Row titleRow = summarySheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Bao cao tong quan UniBus");
            titleCell.setCellStyle(titleStyle);
            summarySheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));
            writeKeyValue(summarySheet, headerStyle, 2, "Tu ngay", range.from().format(DateTimeFormatter.ISO_DATE));
            writeKeyValue(summarySheet, headerStyle, 3, "Den ngay", range.to().format(DateTimeFormatter.ISO_DATE));
            writeKeyValue(summarySheet, headerStyle, 4, "Ngay xuat", LocalDate.now().format(DateTimeFormatter.ISO_DATE));
            int rowIndex = 6;
            Row statsHeader = summarySheet.createRow(rowIndex++);
            writeHeader(statsHeader, headerStyle, List.of("Nhom", "Chi so", "Gia tri", "Don vi"));
            for (DashboardStat stat : report.stats()) {
                Row row = summarySheet.createRow(rowIndex++);
                row.createCell(0).setCellValue("Tong quan");
                row.createCell(1).setCellValue(nullToEmpty(stat.label()));
                setNumericOrText(row.createCell(2), stat.value(), moneyStyle);
                row.createCell(3).setCellValue(nullToEmpty(stat.unit()));
            }
            autosize(summarySheet, 4);
            summarySheet.createFreezePane(0, 7);
            summarySheet.setAutoFilter(new CellRangeAddress(6, Math.max(6, rowIndex - 1), 0, 3));

            Sheet dailySheet = workbook.createSheet("Doanh thu va chuyen");
            writeHeader(dailySheet.createRow(0), headerStyle, List.of("Ngay", "Thu", "Doanh thu", "So chuyen"));
            for (int index = 0; index < report.revenueSeries().size(); index++) {
                RevenueSeriesPoint revenue = report.revenueSeries().get(index);
                int trips = report.tripsSeries().stream()
                        .filter(point -> point.date().equals(revenue.date()))
                        .mapToInt(TripsSeriesPoint::trips)
                        .findFirst()
                        .orElse(0);
                Row row = dailySheet.createRow(index + 1);
                row.createCell(0).setCellValue(revenue.date().format(DateTimeFormatter.ISO_DATE));
                row.createCell(1).setCellValue(nullToEmpty(revenue.day()));
                Cell revenueCell = row.createCell(2);
                revenueCell.setCellValue(revenue.revenue() == null ? 0 : revenue.revenue().doubleValue());
                revenueCell.setCellStyle(moneyStyle);
                row.createCell(3).setCellValue(trips);
            }
            autosize(dailySheet, 4);
            dailySheet.createFreezePane(0, 1);
            dailySheet.setAutoFilter(new CellRangeAddress(0, Math.max(1, report.revenueSeries().size()), 0, 3));

            Sheet routeSheet = workbook.createSheet("Tuyen xe");
            writeHeader(routeSheet.createRow(0), headerStyle, List.of("Ma tuyen", "Ten tuyen", "So chuyen", "Doanh thu"));
            for (int index = 0; index < report.routeMetrics().size(); index++) {
                RouteMetric metric = report.routeMetrics().get(index);
                Row row = routeSheet.createRow(index + 1);
                row.createCell(0).setCellValue(nullToEmpty(metric.routeCode()));
                row.createCell(1).setCellValue(nullToEmpty(metric.routeName()));
                row.createCell(2).setCellValue(metric.trips());
                Cell revenueCell = row.createCell(3);
                revenueCell.setCellValue(metric.revenue() == null ? 0 : metric.revenue().doubleValue());
                revenueCell.setCellStyle(moneyStyle);
            }
            autosize(routeSheet, 4);
            routeSheet.createFreezePane(0, 1);
            routeSheet.setAutoFilter(new CellRangeAddress(0, Math.max(1, report.routeMetrics().size()), 0, 3));

            Sheet roleSheet = workbook.createSheet("Vai tro nguoi dung");
            writeHeader(roleSheet.createRow(0), headerStyle, List.of("Vai tro", "So luong"));
            for (int index = 0; index < report.roleDistribution().size(); index++) {
                RoleDistributionPoint role = report.roleDistribution().get(index);
                Row row = roleSheet.createRow(index + 1);
                row.createCell(0).setCellValue(roleLabel(role.role()));
                row.createCell(1).setCellValue(role.value());
            }
            autosize(roleSheet, 2);
            roleSheet.createFreezePane(0, 1);
            roleSheet.setAutoFilter(new CellRangeAddress(0, Math.max(1, report.roleDistribution().size()), 0, 1));

            workbook.setActiveSheet(0);
            workbook.write(output);
            String fileName = "bao-cao-admin_" + range.from().format(DateTimeFormatter.ISO_DATE)
                    + "_to_" + range.to().format(DateTimeFormatter.ISO_DATE) + ".xlsx";
            return new AdminReportFile(fileName, output.toByteArray());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the tao bao cao admin");
        }
    }

    private ReportRange resolveReportRange(int days, LocalDate from, LocalDate to) {
        if (from != null || to != null) {
            LocalDate effectiveTo = to == null ? LocalDate.now() : to;
            LocalDate effectiveFrom = from == null ? effectiveTo.minusDays(Math.max(1, Math.min(days, 90)) - 1L) : from;
            if (effectiveFrom.isAfter(effectiveTo)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid report date range");
            }
            if (effectiveFrom.plusDays(366).isBefore(effectiveTo)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Report date range is too large");
            }
            return new ReportRange(effectiveFrom, effectiveTo);
        }
        int safeDays = Math.max(1, Math.min(days, 90));
        LocalDate effectiveTo = LocalDate.now();
        return new ReportRange(effectiveTo.minusDays(safeDays - 1L), effectiveTo);
    }

    private record ReportRange(LocalDate from, LocalDate to) {
    }

    private void writeKeyValue(Sheet sheet, CellStyle labelStyle, int rowIndex, String label, String value) {
        Row row = sheet.createRow(rowIndex);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);
        row.createCell(1).setCellValue(value == null ? "" : value);
    }

    private void writeHeader(Row row, CellStyle headerStyle, List<String> headers) {
        for (int index = 0; index < headers.size(); index++) {
            Cell cell = row.createCell(index);
            cell.setCellValue(headers.get(index));
            cell.setCellStyle(headerStyle);
        }
    }

    private void autosize(Sheet sheet, int columns) {
        for (int index = 0; index < columns; index++) {
            sheet.autoSizeColumn(index);
            sheet.setColumnWidth(index, Math.min(Math.max(sheet.getColumnWidth(index) + 900, 4200), 16000));
        }
    }

    private void setNumericOrText(Cell cell, Object value, CellStyle numericStyle) {
        if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
            cell.setCellStyle(numericStyle);
            return;
        }
        cell.setCellValue(value == null ? "" : String.valueOf(value));
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String roleLabel(String role) {
        if ("STUDENT".equalsIgnoreCase(role)) return "Sinh vien";
        if ("DRIVER".equalsIgnoreCase(role)) return "Tai xe";
        if ("CONDUCTOR".equalsIgnoreCase(role)) return "Phu xe";
        if ("DISPATCHER".equalsIgnoreCase(role)) return "Dieu phoi";
        if ("UNIVERSITY_ADMIN".equalsIgnoreCase(role)) return "Admin truong";
        if ("ADMIN".equalsIgnoreCase(role)) return "Quan tri";
        return role == null ? "Khac" : role;
    }

    @Transactional(readOnly = true)
    public List<FareCard> fares() {
        return repository.fares();
    }

    @Transactional
    public FareCard updateFare(CurrentUser currentUser, Integer fareId, UpdateFareRequest request) {
        FareCard previous = repository.fares().stream()
                .filter(f -> f.fareId().equals(fareId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Fare not found"));
        // SRS AC1: Giá mới hiệu lực sau 24h - stage as pending and record history.
        LocalDate effectiveFrom = LocalDate.now().plusDays(1);
        repository.recordFareChange(fareId, previous.routeId(),
                previous.amount(), request.amount(), effectiveFrom,
                currentUser.userId(), request.notes());
        FareCard updated = repository.updateFare(fareId, currentUser.userId(), request);
        repository.audit(
                currentUser.userId(),
                "FARE_UPDATE",
                "fares",
                fareId,
                "SUCCESS",
                previous.routeName() + " · " + previous.fareType() + ": " + previous.amount() + " -> " + updated.amount());
        return updated;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> fareChangeHistory(Integer routeId) {
        return repository.fareChangeHistory(routeId);
    }

    @Transactional(readOnly = true)
    public List<ComplaintCard> complaints(String status) {
        return repository.complaintsByStatus(status, 50);
    }

    @Transactional
    public Long submitComplaint(CurrentUser currentUser, CreateComplaintRequest request) {
        return repository.createComplaint(currentUser.userId(), request.subject(),
                request.description(), request.category());
    }

    @Transactional
    public boolean resolveComplaint(CurrentUser currentUser, Integer complaintId, ResolveComplaintRequest request) {
        if (!"RESOLVED".equalsIgnoreCase(request.status()) && !"REJECTED".equalsIgnoreCase(request.status())
                && !"CLOSED".equalsIgnoreCase(request.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Status must be one of: RESOLVED, REJECTED, CLOSED");
        }
        boolean ok = repository.resolveComplaint(complaintId, currentUser.userId(),
                request.status().toUpperCase(), request.resolution());
        if (!ok) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Complaint not found");
        }
        return true;
    }

    @Transactional(readOnly = true)
    public List<ViolationCard> violations(String status) {
        return repository.violations(status, 50);
    }

    @Transactional(readOnly = true)
    public List<ViolationTargetView> violationTargets(String keyword) {
        return repository.violationTargets(keyword, 80);
    }

    @Transactional
    public Long submitViolation(CurrentUser currentUser, CreateViolationRequest request) {
        return repository.createViolation(currentUser.userId(), request.reportedUserId(),
                request.category(), request.description());
    }

    @Transactional
    public boolean reviewViolation(CurrentUser currentUser, Integer violationId, ReviewViolationRequest request) {
        if (!"OPEN".equalsIgnoreCase(request.status()) && !"IN_PROGRESS".equalsIgnoreCase(request.status())
                && !"RESOLVED".equalsIgnoreCase(request.status()) && !"CLOSED".equalsIgnoreCase(request.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED");
        }
        boolean ok = repository.reviewViolation(violationId, currentUser.userId(),
                request.status().toUpperCase(), request.actionTaken());
        if (!ok) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Violation not found");
        }
        return true;
    }

    // ===== Driver ratings (REQ-STU-011) =====

    @Transactional
    public void rateDriver(CurrentUser currentUser, RatingRequest request) {
        if (repository.existsDriverRating(currentUser.userId(), request.tripId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bạn đã đánh giá chuyến này rồi");
        }
        Integer driverId = repository.driverIdForTrip(request.tripId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found or no driver assigned"));
        repository.createDriverRating(currentUser.userId(), request.tripId(), driverId,
                request.rating(), request.content());
    }

    @Transactional(readOnly = true)
    public List<DriverRatingCard> driverRatings(CurrentUser currentUser) {
        Integer driverId = requireDriver(currentUser);
        return repository.driverRatings(driverId, 50);
    }

    @Transactional(readOnly = true)
    public DriverRatingSummary driverRatingSummary(CurrentUser currentUser) {
        Integer driverId = requireDriver(currentUser);
        return repository.driverRatingSummary(driverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No ratings yet"));
    }
    // ===== Internal messaging (REQ-DRV-006, REQ-AST-007) =====

    @Transactional
    public Long sendMessage(CurrentUser currentUser, SendInternalMessageRequest request) {
        if (request.recipientUserId().equals(currentUser.userId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot send a message to yourself");
        }
        Long messageId = repository.sendInternalMessage(currentUser.userId(), request.recipientUserId(), request.body());
        // Push to recipient via WebSocket for instant notification
        String senderName = repository.fullName(currentUser.userId());
        realtimePublisher.pushInternalMessage(request.recipientUserId().longValue(), messageId,
                currentUser.userId(), senderName, request.body());
        return messageId;
    }

    @Transactional(readOnly = true)
    public List<InternalMessageCard> conversation(CurrentUser currentUser, Integer peerUserId) {
        return repository.conversation(currentUser.userId(), peerUserId, 100);
    }

    @Transactional
    public void markRead(CurrentUser currentUser, Integer peerUserId) {
        repository.markConversationRead(currentUser.userId(), peerUserId);
    }

    @Transactional(readOnly = true)
    public List<ContactThreadCard> contactThreads(CurrentUser currentUser) {
        return repository.contactThreads(currentUser.userId());
    }

    private Integer requireDriver(CurrentUser currentUser) {
        return repository.driverIdForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Driver profile not found"));
    }

    private Integer requireConductor(CurrentUser currentUser) {
        return repository.conductorIdForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conductor profile not found"));
    }
}
