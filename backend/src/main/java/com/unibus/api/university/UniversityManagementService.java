package com.unibus.api.university;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.Comment;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.university.UniversityDtos.AuditLogView;
import com.unibus.api.university.UniversityDtos.CampusView;
import com.unibus.api.university.UniversityDtos.CreateCampusRequest;
import com.unibus.api.university.UniversityDtos.CreateDomainRequest;
import com.unibus.api.university.UniversityDtos.CreateRouteUniversityRequest;
import com.unibus.api.university.UniversityDtos.CreateScopedSubsidyPolicyRequest;
import com.unibus.api.university.UniversityDtos.CreateSubsidyPolicyRequest;
import com.unibus.api.university.UniversityDtos.CreateUniversityAdminRequest;
import com.unibus.api.university.UniversityDtos.CreateUniversityNotificationRequest;
import com.unibus.api.university.UniversityDtos.CreateUniversityRequest;
import com.unibus.api.university.UniversityDtos.DomainView;
import com.unibus.api.university.UniversityDtos.ImportBatchView;
import com.unibus.api.university.UniversityDtos.ImportErrorView;
import com.unibus.api.university.UniversityDtos.PaymentTransactionView;
import com.unibus.api.university.UniversityDtos.ReconciliationView;
import com.unibus.api.university.UniversityDtos.ReportExportAuditRequest;
import com.unibus.api.university.UniversityDtos.RosterImportPreviewErrorView;
import com.unibus.api.university.UniversityDtos.RosterImportPreviewRowView;
import com.unibus.api.university.UniversityDtos.RosterImportPreviewView;
import com.unibus.api.university.UniversityDtos.RosterImportConfirmRequest;
import com.unibus.api.university.UniversityDtos.RosterImportConfirmView;
import com.unibus.api.university.UniversityDtos.RosterImportCommitRequest;
import com.unibus.api.university.UniversityDtos.RosterStudentView;
import com.unibus.api.university.UniversityDtos.RouteUniversityView;
import com.unibus.api.university.UniversityDtos.StudentUniversityView;
import com.unibus.api.university.UniversityDtos.SubsidyPolicyView;
import com.unibus.api.university.UniversityDtos.UpdateRouteSubsidyRequest;
import com.unibus.api.university.UniversityDtos.UpdateUniversitySubsidyConfigRequest;
import com.unibus.api.university.UniversityDtos.UniversityAdminView;
import com.unibus.api.university.UniversityDtos.UniversityStatsView;
import com.unibus.api.university.UniversityDtos.UniversityView;
import com.unibus.api.university.UniversityManagementRepository.DomainMatch;
import com.unibus.api.university.UniversityManagementRepository.RosterInsertRow;
import com.unibus.api.university.UniversityManagementRepository.RosterMatch;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;

@Service
public class UniversityManagementService {

    public record RosterExportFile(String fileName, byte[] bytes) {
    }

    public record ImportReportFile(String fileName, byte[] bytes) {
    }

    private static final List<String> ROSTER_IMPORT_HEADERS = List.of(
            "email",
            "studentCode",
            "fullName",
            "faculty",
            "academicYear",
            "status");
    private static final Set<String> VALID_ROSTER_STATUSES = Set.of("ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED");
    private static final int MAX_ROSTER_IMPORT_ROWS = 1000;
    private static final long MAX_ROSTER_IMPORT_BYTES = 5L * 1024L * 1024L;
    private static final String XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private static final String CSV_MIME = "text/csv";
    private static final int PREVIEW_LIMIT = 20;
    private static final long PREVIEW_TTL_MINUTES = 30L;
    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();
    private final Map<String, PreviewSession> rosterPreviewSessions = new ConcurrentHashMap<>();

    private static final Map<String, KnownUniversityDomain> KNOWN_UNIVERSITY_DOMAINS = Map.ofEntries(
            Map.entry("duytan.edu.vn", new KnownUniversityDomain("DTU", "Trường Đại học Duy Tân", "DTU")),
            Map.entry("dtu.edu.vn", new KnownUniversityDomain("DTU", "Trường Đại học Duy Tân", "DTU")),
            Map.entry("dut.udn.vn", new KnownUniversityDomain("DUT", "Trường Đại học Bách khoa - Đại học Đà Nẵng", "DUT")),
            Map.entry("ute.udn.vn", new KnownUniversityDomain("UTE", "Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng", "UTE")),
            Map.entry("ued.udn.vn", new KnownUniversityDomain("UED", "Trường Đại học Sư phạm - Đại học Đà Nẵng", "UED")),
            Map.entry("vku.udn.vn", new KnownUniversityDomain("VKU", "Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn", "VKU")),
            Map.entry("due.udn.vn", new KnownUniversityDomain("DUE", "Trường Đại học Kinh tế - Đại học Đà Nẵng", "DUE")),
            Map.entry("ufl.udn.vn", new KnownUniversityDomain("UFLS", "Trường Đại học Ngoại ngữ - Đại học Đà Nẵng", "UFLS")),
            Map.entry("udn.vn", new KnownUniversityDomain("UDN", "Đại học Đà Nẵng", "UDN")));

    private final UniversityManagementRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UniversityManagementService(UniversityManagementRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UniversityView> listUniversities(String keyword, String status) {
        return repository.findUniversities(keyword, status);
    }

    @Transactional
    public UniversityView createUniversity(CurrentUser actor, CreateUniversityRequest request) {
        UniversityView created = repository.createUniversity(
                normalizeCode(request.code()),
                request.name().trim(),
                blankToNull(request.shortName()),
                normalizeEmail(request.contactEmail()),
                defaultStatus(request.status()));
        audit(actor, created.universityId(), "UNIVERSITY_CREATE", "universities", created.universityId(), "SUCCESS", created.name());
        return created;
    }

    @Transactional
    public UniversityView updateUniversity(CurrentUser actor, Integer universityId, UniversityDtos.UpdateUniversityRequest request) {
        requireUniversity(universityId);
        UniversityView updated = repository.updateUniversity(
                universityId,
                request.code() == null ? null : normalizeCode(request.code()),
                blankToNull(request.name()),
                blankToNull(request.shortName()),
                normalizeEmail(request.contactEmail()),
                request.status());
        audit(actor, universityId, "UNIVERSITY_UPDATE", "universities", universityId, "SUCCESS", updated.name());
        return updated;
    }

    @Transactional
    public void deleteUniversity(CurrentUser actor, Integer universityId) {
        UniversityView existing = requireUniversity(universityId);
        try {
            repository.deleteUniversityWithConfiguration(universityId);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete this university because it is referenced by students, verifications, payments, or other records");
        }
        audit(actor, null, "UNIVERSITY_DELETE", "universities", universityId, "SUCCESS", existing.name());
    }

    @Transactional(readOnly = true)
    public List<CampusView> listCampuses(Integer universityId) {
        requireUniversity(universityId);
        return repository.findCampuses(universityId);
    }

    @Transactional
    public CampusView createCampus(CurrentUser actor, Integer universityId, CreateCampusRequest request) {
        requireUniversity(universityId);
        CampusView created = repository.createCampus(
                universityId,
                normalizeCode(request.code()),
                request.name().trim(),
                blankToNull(request.address()),
                request.latitude(),
                request.longitude(),
                defaultStatus(request.status()));
        audit(actor, universityId, "CAMPUS_CREATE", "campuses", created.campusId(), "SUCCESS", created.name());
        return created;
    }

    @Transactional
    public void deleteCampus(CurrentUser actor, Integer universityId, Integer campusId) {
        requireUniversity(universityId);
        CampusView existing = repository.findCampus(campusId)
                .filter(campus -> campus.universityId().equals(universityId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Campus not found"));
        try {
            repository.deleteCampus(campusId, universityId);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete this campus because it is referenced by existing records");
        }
        audit(actor, universityId, "CAMPUS_DELETE", "campuses", campusId, "SUCCESS", existing.name());
    }

    @Transactional(readOnly = true)
    public List<DomainView> listDomains(Integer universityId) {
        requireUniversity(universityId);
        return repository.findDomains(universityId);
    }

    @Transactional
    public DomainView createDomain(CurrentUser actor, Integer universityId, CreateDomainRequest request) {
        requireUniversity(universityId);
        String domain = normalizeDomain(request.domain());
        DomainView created = repository.createDomain(universityId, domain, defaultStatus(request.status()));
        audit(actor, universityId, "DOMAIN_CREATE", "university_domains", created.domainId(), "SUCCESS", domain);
        return created;
    }

    @Transactional
    public DomainView updateDomainStatus(CurrentUser actor, Integer universityId, Integer domainId, String status) {
        DomainView existing = repository.findDomain(domainId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Domain not found"));
        requireSameUniversity(universityId, existing.universityId());
        DomainView updated = repository.updateDomainStatus(domainId, status);
        audit(actor, universityId, "DOMAIN_STATUS_UPDATE", "university_domains", domainId, "SUCCESS", status);
        return updated;
    }

    @Transactional
    public void deleteDomain(CurrentUser actor, Integer universityId, Integer domainId) {
        DomainView existing = repository.findDomain(domainId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Domain not found"));
        requireSameUniversity(universityId, existing.universityId());
        repository.deleteDomain(domainId, universityId);
        audit(actor, universityId, "DOMAIN_DELETE", "university_domains", domainId, "SUCCESS", existing.domain());
    }

    @Transactional
    public UniversityAdminView createUniversityAdmin(CurrentUser actor, CreateUniversityAdminRequest request) {
        requireUniversity(request.universityId());
        String email = normalizeEmail(request.email());
        if (repository.existsUserByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        Integer userId = repository.createUser(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                blankToNull(request.phoneNumber()),
                UserRole.UNIVERSITY_ADMIN.name());
        UniversityAdminView created = repository.createUniversityAdmin(
                request.universityId(),
                userId,
                blankToNull(request.title()),
                actor.userId());
        audit(actor, request.universityId(), "UNIVERSITY_ADMIN_CREATE", "university_admins",
                created.universityAdminId(), "SUCCESS", email);
        return created;
    }

    @Transactional(readOnly = true)
    public List<UniversityAdminView> listUniversityAdmins(Integer universityId) {
        if (universityId != null) {
            requireUniversity(universityId);
        }
        return repository.findUniversityAdmins(universityId);
    }

    @Transactional
    public void deleteUniversityAdmin(CurrentUser actor, Integer universityAdminId) {
        UniversityAdminView existing = repository.findUniversityAdmin(universityAdminId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "University admin not found"));
        try {
            repository.deleteUniversityAdmin(universityAdminId);
            repository.deleteUniversityAdminUserIfOrphan(existing.userId());
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete this university admin because the account is referenced by existing records");
        }
        audit(actor, existing.universityId(), "UNIVERSITY_ADMIN_DELETE", "university_admins",
                universityAdminId, "SUCCESS", existing.email());
    }

    @Transactional
    public RouteUniversityView createRouteUniversity(CurrentUser actor, CreateRouteUniversityRequest request) {
        requireUniversity(request.universityId());
        requireRoute(request.routeId());
        if (request.campusId() != null && !repository.campusBelongsToUniversity(request.campusId(), request.universityId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Campus does not belong to university");
        }
        if (repository.activeRouteUniversityExists(request.routeId(), request.universityId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Route is already assigned to this university");
        }
        RouteUniversityView created = repository.createRouteUniversity(
                request.routeId(),
                request.universityId(),
                request.campusId(),
                request.activeFrom() == null ? LocalDate.now() : request.activeFrom(),
                request.activeUntil(),
                defaultStatus(request.status()));
        audit(actor, request.universityId(), "ROUTE_UNIVERSITY_CREATE", "route_universities",
                created.routeUniversityId(), "SUCCESS", created.routeName());
        return created;
    }

    @Transactional(readOnly = true)
    public List<RouteUniversityView> listRouteUniversities(Integer universityId) {
        return repository.findRouteUniversities(universityId);
    }

    @Transactional
    public void deleteRouteUniversity(CurrentUser actor, Integer routeUniversityId) {
        RouteUniversityView existing = repository.findRouteUniversity(routeUniversityId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route-university link not found"));
        repository.deleteRouteUniversity(routeUniversityId);
        audit(actor, existing.universityId(), "ROUTE_UNIVERSITY_DELETE", "route_universities",
                routeUniversityId, "SUCCESS", existing.routeName());
    }

    @Transactional
    public void deleteRouteUniversitiesForUniversity(CurrentUser actor, Integer universityId) {
        requireUniversity(universityId);
        int deleted = repository.deleteRouteUniversitiesForUniversity(universityId);
        audit(actor, universityId, "ROUTE_UNIVERSITY_DELETE_ALL", "route_universities",
                universityId, "SUCCESS", deleted + " route links removed");
    }

    @Transactional(readOnly = true)
    public List<RouteUniversityView> listScopedRouteSubsidies(CurrentUser currentUser) {
        Integer universityId = requireUniversityAdmin(currentUser).universityId();
        return repository.findRouteUniversities(universityId);
    }

    @Transactional
    public RouteUniversityView updateScopedRouteSubsidy(CurrentUser actor, Integer routeUniversityId,
            UpdateRouteSubsidyRequest request) {
        UniversityAdminView admin = requireUniversityAdmin(actor);
        RouteUniversityView current = repository.findRouteUniversityForUniversity(routeUniversityId, admin.universityId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route assignment not found for this university"));
        RouteUniversityView updated = repository.updateRouteUniversitySubsidy(
                        routeUniversityId,
                        admin.universityId(),
                        request != null && request.subsidyEnabled())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route assignment not found for this university"));
        audit(actor, admin.universityId(), "ROUTE_SUBSIDY_TOGGLE", "route_universities",
                String.valueOf(routeUniversityId),
                updated.subsidyEnabled() ? "ENABLED" : "DISABLED",
                "routeId=" + current.routeId() + "; route=" + current.routeName());
        return updated;
    }

    @Transactional
    public SubsidyPolicyView createSubsidyPolicy(CurrentUser actor, CreateSubsidyPolicyRequest request) {
        return createSubsidyPolicy(
                actor,
                request.universityId(),
                request.campusId(),
                request.policyName(),
                request.subsidyType(),
                request.value(),
                request.maxAmount(),
                request.activeFrom(),
                request.activeUntil(),
                request.status());
    }

    @Transactional(readOnly = true)
    public List<SubsidyPolicyView> listSubsidyPolicies(Integer universityId) {
        return repository.findSubsidyPolicies(universityId);
    }

    @Transactional(readOnly = true)
    public List<SubsidyPolicyView> listCurrentSubsidyConfig(Integer universityId) {
        requireUniversity(universityId);
        return repository.findCurrentUniversitySubsidyConfig(universityId)
                .map(policy -> List.of(policy))
                .orElseGet(List::of);
    }

    @Transactional(readOnly = true)
    public List<RosterStudentView> listRoster(Integer universityId, String keyword, String status) {
        requireUniversity(universityId);
        return repository.findRoster(universityId, keyword, status);
    }

    @Transactional(readOnly = true)
    public List<RosterStudentView> listRoster(Integer universityId, String keyword, String status, Long importBatchId) {
        requireUniversity(universityId);
        if (importBatchId != null) {
            requireImportBatch(universityId, importBatchId);
        }
        return repository.findRoster(universityId, keyword, status, importBatchId);
    }

    @Transactional(readOnly = true)
    public RosterExportFile exportRoster(CurrentUser actor, Integer universityId, String keyword, String status, String format) {
        String normalizedFormat = blank(format) ? "csv" : format.trim().toLowerCase(Locale.ROOT);
        if ("xlsx".equals(normalizedFormat)) {
            return exportRosterXlsx(actor, universityId, keyword, status);
        }
        return exportRosterCsv(actor, universityId, keyword, status, normalizedFormat);
    }

    @Transactional(readOnly = true)
    public RosterExportFile exportRosterCsv(CurrentUser actor, Integer universityId, String keyword, String status, String format) {
        UniversityView university = requireUniversity(universityId);
        if (!blank(format) && !"csv".equalsIgnoreCase(format.trim())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only CSV export is supported");
        }
        List<RosterStudentView> rows = repository.findRosterForExport(universityId, keyword, status);
        StringBuilder csv = new StringBuilder("\uFEFF");
        appendCsvRow(csv, List.of(
                "studentCode",
                "fullName",
                "email",
                "facultyCode",
                "facultyName",
                "campusCode",
                "campusName",
                "academicYear",
                "status",
                "statusLabel"));
        for (RosterStudentView row : rows) {
            appendCsvRow(csv, List.of(
                    excelText(row.studentCode()),
                    nullToEmpty(row.fullName()),
                    nullToEmpty(row.email()),
                    "",
                    nullToEmpty(row.faculty()),
                    "",
                    "",
                    row.academicYear() == null ? "" : String.valueOf(row.academicYear()),
                    nullToEmpty(row.status()),
                    rosterStatusLabel(row.status())));
        }
        String fileName = "danh-sach-sinh-vien_" + sanitizeFileName(university.code()) + "_"
                + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".csv";
        return new RosterExportFile(fileName, csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private RosterExportFile exportRosterXlsx(CurrentUser actor, Integer universityId, String keyword, String status) {
        UniversityView university = requireUniversity(universityId);
        List<RosterStudentView> rows = repository.findRosterForExport(universityId, keyword, status);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet importSheet = workbook.createSheet("Danh s\u00e1ch sinh vi\u00ean");
            Sheet guideSheet = workbook.createSheet("H\u01b0\u1edbng d\u1eabn");
            Sheet catalogSheet = workbook.createSheet("Danh m\u1ee5c");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("@"));

            CreationHelper creationHelper = workbook.getCreationHelper();
            Drawing<?> drawing = importSheet.createDrawingPatriarch();
            Row headerRow = importSheet.createRow(0);
            for (int index = 0; index < ROSTER_IMPORT_HEADERS.size(); index++) {
                Cell cell = headerRow.createCell(index);
                cell.setCellValue(ROSTER_IMPORT_HEADERS.get(index));
                cell.setCellStyle(headerStyle);
                importSheet.setColumnWidth(index, switch (index) {
                    case 0 -> 9000;
                    case 1 -> 4500;
                    case 2 -> 7000;
                    case 3 -> 6500;
                    case 4 -> 4200;
                    default -> 5200;
                });
                addHeaderComment(creationHelper, drawing, cell, rosterHeaderComment(ROSTER_IMPORT_HEADERS.get(index)));
            }
            importSheet.setDefaultColumnStyle(1, textStyle);
            importSheet.createFreezePane(0, 1);
            importSheet.setAutoFilter(new CellRangeAddress(0, Math.max(3, rows.size()), 0, ROSTER_IMPORT_HEADERS.size() - 1));

            for (int index = 0; index < rows.size(); index++) {
                RosterStudentView student = rows.get(index);
                Row row = importSheet.createRow(index + 1);
                row.createCell(0).setCellValue(nullToEmpty(student.email()));
                Cell studentCodeCell = row.createCell(1);
                studentCodeCell.setCellValue(nullToEmpty(student.studentCode()));
                studentCodeCell.setCellStyle(textStyle);
                row.createCell(2).setCellValue(nullToEmpty(student.fullName()));
                row.createCell(3).setCellValue(nullToEmpty(student.faculty()));
                if (student.academicYear() != null) {
                    row.createCell(4).setCellValue(student.academicYear());
                } else {
                    row.createCell(4).setCellValue("");
                }
                row.createCell(5).setCellValue(nullToEmpty(student.status()));
            }

            DataValidationHelper validationHelper = importSheet.getDataValidationHelper();
            DataValidationConstraint statusConstraint = validationHelper.createExplicitListConstraint(
                    VALID_ROSTER_STATUSES.stream().sorted().toArray(String[]::new));
            DataValidation statusValidation = validationHelper.createValidation(
                    statusConstraint,
                    new CellRangeAddressList(1, MAX_ROSTER_IMPORT_ROWS, 5, 5));
            statusValidation.setSuppressDropDownArrow(true);
            importSheet.addValidationData(statusValidation);

            List<String> faculties = repository.findRosterFaculties(universityId);
            if (shouldUseExplicitDropdown(faculties)) {
                DataValidationConstraint facultyConstraint = validationHelper.createExplicitListConstraint(faculties.toArray(String[]::new));
                DataValidation facultyValidation = validationHelper.createValidation(
                        facultyConstraint,
                        new CellRangeAddressList(1, MAX_ROSTER_IMPORT_ROWS, 3, 3));
                facultyValidation.setSuppressDropDownArrow(true);
                importSheet.addValidationData(facultyValidation);
            }

            writeGuideSheet(guideSheet, headerStyle);
            writeCatalogSheet(catalogSheet, headerStyle, repository.findDomains(universityId), repository.findCampuses(universityId), faculties);

            workbook.write(output);
            String fileName = "danh-sach-sinh-vien_" + sanitizeFileName(university.code()) + "_"
                    + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".xlsx";
            return new RosterExportFile(fileName, output.toByteArray());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate roster export");
        }
    }

    @Transactional(readOnly = true)
    public byte[] rosterTemplate(Integer universityId) {
        requireUniversity(universityId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet importSheet = workbook.createSheet("Danh s\u00e1ch sinh vi\u00ean");
            Sheet guideSheet = workbook.createSheet("H\u01b0\u1edbng d\u1eabn");
            Sheet catalogSheet = workbook.createSheet("Danh m\u1ee5c");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("@"));

            CreationHelper creationHelper = workbook.getCreationHelper();
            Drawing<?> drawing = importSheet.createDrawingPatriarch();
            Row headerRow = importSheet.createRow(0);
            for (int index = 0; index < ROSTER_IMPORT_HEADERS.size(); index++) {
                Cell cell = headerRow.createCell(index);
                cell.setCellValue(ROSTER_IMPORT_HEADERS.get(index));
                cell.setCellStyle(headerStyle);
                importSheet.setColumnWidth(index, switch (index) {
                    case 0 -> 9000;
                    case 1 -> 4500;
                    case 2 -> 7000;
                    case 3 -> 6500;
                    case 4 -> 4200;
                    default -> 5200;
                });
                addHeaderComment(creationHelper, drawing, cell, rosterHeaderComment(ROSTER_IMPORT_HEADERS.get(index)));
            }
            importSheet.setDefaultColumnStyle(1, textStyle);
            importSheet.createFreezePane(0, 1);
            importSheet.setAutoFilter(new CellRangeAddress(0, 3, 0, ROSTER_IMPORT_HEADERS.size() - 1));

            DataValidationHelper validationHelper = importSheet.getDataValidationHelper();
            DataValidationConstraint statusConstraint = validationHelper.createExplicitListConstraint(
                    VALID_ROSTER_STATUSES.stream().sorted().toArray(String[]::new));
            DataValidation statusValidation = validationHelper.createValidation(
                    statusConstraint,
                    new CellRangeAddressList(1, MAX_ROSTER_IMPORT_ROWS, 5, 5));
            statusValidation.setSuppressDropDownArrow(true);
            importSheet.addValidationData(statusValidation);

            List<String> faculties = repository.findRosterFaculties(universityId);
            if (shouldUseExplicitDropdown(faculties)) {
                DataValidationConstraint facultyConstraint = validationHelper.createExplicitListConstraint(faculties.toArray(String[]::new));
                DataValidation facultyValidation = validationHelper.createValidation(
                        facultyConstraint,
                        new CellRangeAddressList(1, MAX_ROSTER_IMPORT_ROWS, 3, 3));
                facultyValidation.setSuppressDropDownArrow(true);
                importSheet.addValidationData(facultyValidation);
            }

            writeGuideSheet(guideSheet, headerStyle);
            writeCatalogSheet(catalogSheet, headerStyle, repository.findDomains(universityId), repository.findCampuses(universityId), faculties);

            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate roster template");
        }
    }

    @Transactional
    public ImportBatchView importRoster(CurrentUser actor, Integer universityId, MultipartFile file) {
        requireUniversity(universityId);
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE: Roster file is empty");
        }
        String fileName = file.getOriginalFilename() == null ? "roster" : file.getOriginalFilename();
        Long batchId = repository.createImportBatch(universityId, fileName, actor.userId());
        RosterParseResult parseResult = parseRosterFile(file);
        List<RosterRow> rows = parseResult.rows();
        Set<String> seenStudentCodes = new HashSet<>();
        Set<String> seenEmails = new HashSet<>();
        int success = 0;
        int errors = 0;
        for (RosterRow row : rows) {
            RowValidation validation = validateRosterRow(row);
            if (validation.errorMessage() != null) {
                repository.addImportError(batchId, row.rowNumber(), validation.fieldName(), rosterRowSnapshot(row), validation.errorMessage());
                errors++;
                continue;
            }
            String studentCode = normalizeStudentCode(row.studentCode());
            String studentCodeKey = studentCode.toUpperCase(Locale.ROOT);
            if (!seenStudentCodes.add(studentCodeKey)) {
                repository.addImportError(batchId, row.rowNumber(), "studentCode", rosterRowSnapshot(row), "MSSV is duplicated in this import file");
                errors++;
                continue;
            }
            String email = normalizeEmail(row.email());
            if (!seenEmails.add(email)) {
                repository.addImportError(batchId, row.rowNumber(), "email", rosterRowSnapshot(row), "Email is duplicated in this import file");
                errors++;
                continue;
            }
            String domain = emailDomain(email);
            if (domain == null || !repository.activeDomainBelongsToUniversity(universityId, domain)) {
                repository.addImportError(batchId, row.rowNumber(), "email", rosterRowSnapshot(row), "Email domain does not belong to this university");
                errors++;
                continue;
            }
            if (repository.rosterStudentCodeExistsForDifferentEmail(universityId, studentCode, email)) {
                repository.addImportError(batchId, row.rowNumber(), "studentCode", rosterRowSnapshot(row), "MSSV already exists for another student in this university");
                errors++;
                continue;
            }
            repository.upsertRoster(
                    universityId,
                    email,
                    studentCode,
                    row.fullName().trim(),
                    blankToNull(row.faculty()),
                    parseAcademicYear(row.academicYear()),
                    normalizeRosterStatus(row.status()),
                    batchId);
            success++;
        }
        ImportBatchView batch = repository.completeImportBatch(batchId, rows.size(), success, errors);
        audit(actor, universityId, "ROSTER_IMPORT", "university_import_batches", batchId, batch.status(), fileName);
        return batch;
    }

    @Transactional(readOnly = true)
    public RosterImportPreviewView previewRosterImport(CurrentUser actor, Integer universityId, MultipartFile file) {
        requireUniversity(universityId);
        RosterParseResult parseResult = parseRosterFile(file, false);
        PreviewBuildResult preview = buildRosterPreview(parseResult, actor, universityId, file);
        rosterPreviewSessions.put(preview.view().previewToken(), new PreviewSession(
                preview.view().previewToken(),
                actor.userId(),
                universityId,
                preview.view().expiresAt(),
                parseResult,
                null));
        return preview.view();
    }

    @Transactional(readOnly = true)
    public RosterImportPreviewView getRosterImportPreview(CurrentUser actor, Integer universityId, String previewToken) {
        PreviewSession session = rosterPreviewSessions.get(previewToken);
        if (session == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Preview token was not found");
        }
        validatePreviewSessionForUser(session, actor, universityId);
        return buildRosterPreview(session.parseResult(), actor, universityId, null, previewToken, session.expiresAt()).view();
    }

    @Transactional(readOnly = true)
    public RosterImportConfirmView confirmRosterImport(CurrentUser actor, Integer universityId,
            RosterImportConfirmRequest request) {
        if (request == null || blank(request.previewToken())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Preview token is required");
        }
        String mode = normalizeImportMode(request == null ? null : request.mode());
        if (!"ADD_NEW_ONLY".equals(mode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only ADD_NEW_ONLY import mode is currently supported");
        }
        RosterImportPreviewView preview = getRosterImportPreview(actor, universityId, request.previewToken());
        List<String> warnings = new ArrayList<>();
        if (preview.existingRows() > 0) {
            warnings.add("Sinh viên có MSSV đã tồn tại sẽ được bỏ qua, không cập nhật dữ liệu cũ.");
        }
        if (preview.errorRows() > 0 || !preview.structuralErrors().isEmpty()) {
            warnings.add("Dòng lỗi không được đưa vào batch import.");
        }
        warnings.add("Chế độ cập nhật sinh viên hiện có chưa được bật vì chưa có permission/whitelist cập nhật rõ ràng.");
        boolean hasStructuralErrors = !preview.structuralErrors().isEmpty();
        boolean canConfirm = !hasStructuralErrors && preview.createRows() > 0;
        String confirmLabel = canConfirm
                ? "Xác nhận import " + preview.createRows() + " sinh viên"
                : "Không có sinh viên mới hợp lệ để import";
        int skippedRows = preview.existingRows() + preview.errorRows();
        return new RosterImportConfirmView(
                preview.previewToken(),
                mode,
                preview.totalRows(),
                preview.createRows(),
                0,
                preview.existingRows(),
                preview.errorRows() + preview.structuralErrors().size(),
                skippedRows,
                preview.createRows(),
                canConfirm,
                confirmLabel,
                warnings,
                preview.previewRows());
    }

    @Transactional
    public ImportBatchView commitRosterImport(CurrentUser actor, Integer universityId, RosterImportCommitRequest request) {
        if (request == null || blank(request.previewToken())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Preview token is required");
        }
        String mode = normalizeImportMode(request.mode());
        if (!"ADD_NEW_ONLY".equals(mode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only ADD_NEW_ONLY import mode is currently supported");
        }
        PreviewSession session = rosterPreviewSessions.get(request.previewToken());
        if (session == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Preview token was not found");
        }
        synchronized (session) {
            validatePreviewSessionForUser(session, actor, universityId);
            if (session.committedBatchId() != null) {
                return repository.findImportBatch(session.committedBatchId())
                        .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Import session was already processed"));
            }
            PreviewBuildResult preview = buildRosterPreview(
                    session.parseResult(),
                    actor,
                    universityId,
                    null,
                    session.previewToken(),
                    session.expiresAt());
            RosterImportPreviewView view = preview.view();
            if (!view.structuralErrors().isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Import file has structural errors");
            }
            if (view.createRows() <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "No new valid students to import");
            }
            String fileName = session.parseResult().fileInfo().fileName();
            Long batchId = repository.createImportBatch(universityId, fileName, actor.userId());
            List<RosterInsertRow> rowsToInsert = buildRowsToInsertForAddNewOnly(session.parseResult(), universityId, batchId);
            int skippedOrErrorRows = recordImportErrorsForAddNewOnly(session.parseResult(), universityId, batchId);
            if (rowsToInsert.isEmpty()) {
                ImportBatchView emptyBatch = repository.completeImportBatch(batchId, view.totalRows(), 0, skippedOrErrorRows);
                audit(actor, universityId, "ROSTER_IMPORT_COMMIT", "university_import_batches", emptyBatch.importBatchId(),
                        emptyBatch.status(), "mode=" + mode + "; created=0; skipped=" + skippedOrErrorRows);
                session.committedBatchId(emptyBatch.importBatchId());
                return emptyBatch;
            }
            try {
                repository.insertRosterBatch(rowsToInsert);
            } catch (DataAccessException exception) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Import failed because another request changed roster data. Please preview the file again.");
            }
            ImportBatchView batch = repository.completeImportBatch(
                    batchId,
                    view.totalRows(),
                    rowsToInsert.size(),
                    skippedOrErrorRows);
            audit(actor, universityId, "ROSTER_IMPORT_COMMIT", "university_import_batches", batch.importBatchId(),
                    batch.status(), "mode=" + mode + "; created=" + rowsToInsert.size() + "; skipped=" + skippedOrErrorRows);
            session.committedBatchId(batch.importBatchId());
            return batch;
        }
    }

    @Transactional(readOnly = true)
    public List<ImportBatchView> listImportBatches(Integer universityId) {
        requireUniversity(universityId);
        return repository.findImportBatches(universityId);
    }

    @Transactional(readOnly = true)
    public ImportBatchView importBatch(Integer universityId, Long importBatchId) {
        return requireImportBatch(universityId, importBatchId);
    }

    @Transactional(readOnly = true)
    public ImportReportFile importBatchReport(Integer universityId, Long importBatchId) {
        ImportBatchView batch = requireImportBatch(universityId, importBatchId);
        List<RosterStudentView> createdRows = repository.findRoster(universityId, null, null, importBatchId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("@"));

            CellStyle createdStyle = workbook.createCellStyle();
            Font createdFont = workbook.createFont();
            createdFont.setBold(true);
            createdFont.setColor(IndexedColors.GREEN.getIndex());
            createdStyle.setFont(createdFont);

            CellStyle errorStyle = workbook.createCellStyle();
            Font errorFont = workbook.createFont();
            errorFont.setBold(true);
            errorFont.setColor(IndexedColors.RED.getIndex());
            errorStyle.setFont(errorFont);

            Sheet detailSheet = workbook.createSheet("Bao cao import");
            List<String> headers = List.of(
                    "rowNumber",
                    "studentCode",
                    "fullName",
                    "email",
                    "faculty",
                    "academicYear",
                    "status",
                    "importResult",
                    "errorCode",
                    "errorField",
                    "errorMessage",
                    "suggestion");
            Row headerRow = detailSheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers.get(i));
                cell.setCellStyle(headerStyle);
            }
            int[] widths = { 3200, 5200, 7800, 9500, 6500, 4200, 4200, 4800, 7000, 5200, 12000, 12000 };
            for (int i = 0; i < widths.length; i++) {
                detailSheet.setColumnWidth(i, widths[i]);
            }
            detailSheet.setDefaultColumnStyle(1, textStyle);
            detailSheet.createFreezePane(0, 1);

            int rowIndex = 1;
            int createdRowNumber = 2;
            for (RosterStudentView student : createdRows) {
                Row row = detailSheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(createdRowNumber++);
                Cell studentCodeCell = row.createCell(1);
                studentCodeCell.setCellValue(nullToEmpty(student.studentCode()));
                studentCodeCell.setCellStyle(textStyle);
                row.createCell(2).setCellValue(nullToEmpty(student.fullName()));
                row.createCell(3).setCellValue(nullToEmpty(student.email()));
                row.createCell(4).setCellValue(nullToEmpty(student.faculty()));
                row.createCell(5).setCellValue(student.academicYear() == null ? "" : String.valueOf(student.academicYear()));
                row.createCell(6).setCellValue(nullToEmpty(student.status()));
                Cell resultCell = row.createCell(7);
                resultCell.setCellValue("CREATED");
                resultCell.setCellStyle(createdStyle);
                row.createCell(8).setCellValue("-");
                row.createCell(9).setCellValue("-");
                row.createCell(10).setCellValue("-");
                row.createCell(11).setCellValue("-");
            }
            for (ImportErrorView error : batch.errors()) {
                Map<String, String> rawRow = importErrorRawRow(error);
                Row row = detailSheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(error.rowNumber());
                Cell studentCodeCell = row.createCell(1);
                studentCodeCell.setCellValue(rawRowValue(rawRow, error, "studentCode"));
                studentCodeCell.setCellStyle(textStyle);
                row.createCell(2).setCellValue(rawRowValue(rawRow, error, "fullName"));
                row.createCell(3).setCellValue(rawRowValue(rawRow, error, "email"));
                row.createCell(4).setCellValue(rawRowValue(rawRow, error, "faculty"));
                row.createCell(5).setCellValue(rawRowValue(rawRow, error, "academicYear"));
                row.createCell(6).setCellValue(rawRowValue(rawRow, error, "status"));
                Cell resultCell = row.createCell(7);
                resultCell.setCellValue("ERROR");
                resultCell.setCellStyle(errorStyle);
                row.createCell(8).setCellValue(importErrorCode(error.errorMessage()));
                row.createCell(9).setCellValue(nullToEmpty(error.fieldName()));
                row.createCell(10).setCellValue(shortImportError(error.errorMessage(), error.fieldName()));
                row.createCell(11).setCellValue(importErrorSuggestion(error.fieldName(), error.rowNumber()));
            }
            detailSheet.setAutoFilter(new CellRangeAddress(0, Math.max(1, rowIndex - 1), 0, headers.size() - 1));

            Sheet summarySheet = workbook.createSheet("Tong quan");
            writeSummaryRow(summarySheet, headerStyle, 0, "File", nullToEmpty(batch.fileName()));
            writeSummaryRow(summarySheet, headerStyle, 1, "Trang thai", importStatusLabel(batch.status()));
            writeSummaryRow(summarySheet, headerStyle, 2, "Tong so dong", String.valueOf(batch.totalRows()));
            writeSummaryRow(summarySheet, headerStyle, 3, "Thanh cong", String.valueOf(batch.successRows()));
            writeSummaryRow(summarySheet, headerStyle, 4, "Loi", String.valueOf(batch.errorRows()));
            writeSummaryRow(summarySheet, headerStyle, 5, "Bo qua", String.valueOf(batch.skippedRows()));
            writeSummaryRow(summarySheet, headerStyle, 6, "Hoan tat", batch.completedAt() == null ? "" : formatDateTime(batch.completedAt()));
            summarySheet.setColumnWidth(0, 4800);
            summarySheet.setColumnWidth(1, 11000);
            workbook.setActiveSheet(0);

            workbook.write(output);
            String fileName = "bao-cao-import-sinh-vien_" + importBatchId + "_" + LocalDate.now() + ".xlsx";
            return new ImportReportFile(fileName, output.toByteArray());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the tao bao cao import");
        }
    }

    @Transactional(readOnly = true)
    public UniversityAdminView universityAdminProfile(CurrentUser currentUser) {
        return requireUniversityAdmin(currentUser);
    }

    @Transactional(readOnly = true, propagation = Propagation.NOT_SUPPORTED)
    public StudentUniversityView studentUniversity(CurrentUser currentUser) {
        return repository.studentUniversity(currentUser.userId());
    }

    @Transactional(readOnly = true)
    public UniversityStatsView stats(Integer universityId) {
        requireUniversity(universityId);
        return repository.stats(universityId);
    }

    @Transactional(readOnly = true)
    public ReconciliationView reconciliation(Integer universityId, LocalDate from, LocalDate to) {
        requireUniversity(universityId);
        LocalDate end = to == null ? LocalDate.now() : to;
        LocalDate start = from == null ? end.withDayOfMonth(1) : from;
        return repository.reconciliation(universityId, start, end);
    }

    @Transactional
    public int notifyUniversity(CurrentUser actor, Integer universityId, CreateUniversityNotificationRequest request) {
        requireUniversity(universityId);
        int recipients = repository.notifyUniversityStudents(
                universityId,
                actor.userId(),
                request.title().trim(),
                request.content().trim());
        audit(actor, universityId, "UNIVERSITY_NOTIFICATION_SEND", "notifications", null, "SUCCESS",
                "recipients=" + recipients);
        return recipients;
    }




    @Transactional(readOnly = true)
    public List<PaymentTransactionView> paymentTransactions(Integer universityId) {
        if (universityId != null) {
            requireUniversity(universityId);
        }
        return repository.paymentTransactions(universityId);
    }

    @Transactional(readOnly = true)
    public List<AuditLogView> auditLogs(Integer universityId, String action) {
        return repository.findAuditLogs(universityId, action);
    }

    @Transactional
    public void auditReportExport(CurrentUser actor, ReportExportAuditRequest request) {
        String from = request == null || request.from() == null ? "không xác định" : request.from().toString();
        String to = request == null || request.to() == null ? "không xác định" : request.to().toString();
        String format = request == null || request.format() == null || request.format().isBlank()
                ? "CSV"
                : request.format().trim().toUpperCase(Locale.ROOT);
        audit(actor, null, "ADMIN_REPORT_EXPORT", "admin_reports", null, "SUCCESS",
                "Xuất báo cáo " + format + " từ " + from + " đến " + to);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyGoogleUniversityLink(User user) {
        if (user.getRole() != UserRole.STUDENT) {
            return;
        }
        String email = normalizeEmail(user.getEmail());
        Optional<RosterMatch> rosterMatch = repository.findActiveRosterByEmail(email);
        if (rosterMatch.isPresent()) {
            RosterMatch roster = rosterMatch.get();
            if (repository.studentCodeBelongsToOtherUser(roster.studentCode(), user.getId())) {
                return;
            }
            repository.upsertStudentFromRoster(user.getId(), roster);
            repository.matchRosterToUser(roster.rosterId(), user.getId());
            return;
        }
        applyDomainUniversityLink(user);
    }

    @Transactional
    public void applyDomainUniversityLink(User user) {
        if (user.getRole() != UserRole.STUDENT) {
            return;
        }
        String email = normalizeEmail(user.getEmail());
        String domain = emailDomain(email);
        int at = email == null ? -1 : email.indexOf('@');
        if (domain == null || at <= 0) {
            return;
        }
        String studentCode = email.substring(0, at);
        if (studentCode.length() > 20) {
            studentCode = studentCode.substring(0, 20);
        }
        DomainMatch match = resolveDomainMatch(domain);
        if (match == null || repository.studentCodeBelongsToOtherUser(studentCode, user.getId())) {
            return;
        }
        repository.upsertStudentFromDomain(user.getId(), email, user.getFullName(), match);
        repository.audit(user.getId(), match.universityId(), "DOMAIN_AUTO_LINK", "students",
                studentCode, "SUCCESS", null, email);
    }

    @Transactional(readOnly = true)
    public DomainMatch googleDomainHint(String email) {
        String domain = emailDomain(email);
        return domain == null ? null : resolveDomainMatch(domain);
    }

    private DomainMatch resolveDomainMatch(String domain) {
        DomainMatch existing = repository.findActiveDomainMatch(domain).orElse(null);
        if (existing != null) {
            return existing;
        }
        KnownUniversityDomain known = KNOWN_UNIVERSITY_DOMAINS.get(domain);
        return known == null
                ? null
                : repository.ensureActiveDomainMatch(known.code(), known.name(), known.shortName(), domain).orElse(null);
    }

    @Transactional(readOnly = true)
    public UniversityAdminView requireUniversityAdmin(CurrentUser currentUser) {
        return repository.findUniversityAdminByUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "University admin scope is not assigned"));
    }

    @Transactional
    public SubsidyPolicyView createScopedSubsidyPolicy(CurrentUser actor, CreateScopedSubsidyPolicyRequest request) {
        if (request.campusId() != null || request.maxAmount() != null || request.activeUntil() != null
                || !Set.of("PERCENTAGE", "FIXED_AMOUNT").contains(request.subsidyType().trim().toUpperCase(Locale.ROOT))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "University admin supports only one monthly pass subsidy config");
        }
        String status = defaultStatus(request.status());
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Subsidy status must be ACTIVE or INACTIVE");
        }
        return updateScopedSubsidyConfig(actor, new UpdateUniversitySubsidyConfigRequest(request.value(), status, request.subsidyType()));
    }

    @Transactional
    public SubsidyPolicyView updateScopedSubsidyConfig(CurrentUser actor, UpdateUniversitySubsidyConfigRequest request) {
        Integer universityId = requireUniversityAdmin(actor).universityId();
        requireUniversity(universityId);
        BigDecimal value = request.value();
        if (value == null || value.signum() < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Subsidy amount must be greater than or equal to 0");
        }
        String status = request.status() == null ? "INACTIVE" : request.status().trim().toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Subsidy status must be ACTIVE or INACTIVE");
        }
        Optional<SubsidyPolicyView> existingPolicy = repository.findCurrentUniversitySubsidyConfig(universityId);
        String subsidyType = blank(request.subsidyType())
                ? existingPolicy.map(SubsidyPolicyView::subsidyType).orElse("FIXED_AMOUNT")
                : request.subsidyType().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("PERCENTAGE", "FIXED_AMOUNT").contains(subsidyType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Subsidy type must be PERCENTAGE or FIXED_AMOUNT");
        }
        if ("PERCENTAGE".equals(subsidyType) && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Percentage subsidy must not exceed 100");
        }
        SubsidyPolicyView policy = existingPolicy
                .map(existing -> repository.updateUniversitySubsidyConfig(existing.subsidyPolicyId(), value, status, subsidyType))
                .orElseGet(() -> repository.createSubsidyPolicy(
                        universityId,
                        null,
                        "Cấu hình trợ giá vé tháng",
                        subsidyType,
                        value,
                        null,
                        LocalDate.now(),
                        null,
                        status));
        repository.deactivateOtherUniversitySubsidyPolicies(universityId, policy.subsidyPolicyId());
        audit(actor, universityId, "SUBSIDY_CONFIG_UPDATE", "subsidy_policies",
                policy.subsidyPolicyId(), "SUCCESS", "type=" + subsidyType + ", value=" + value + ", status=" + status);
        return policy;
    }

    private SubsidyPolicyView createSubsidyPolicy(CurrentUser actor, Integer universityId, Integer campusId,
            String policyName, String subsidyType, BigDecimal value, BigDecimal maxAmount, LocalDate activeFrom,
            LocalDate activeUntil, String status) {
        requireUniversity(universityId);
        SubsidyPolicyView created = repository.createSubsidyPolicy(
                universityId,
                campusId,
                policyName.trim(),
                subsidyType,
                value,
                maxAmount,
                activeFrom == null ? LocalDate.now() : activeFrom,
                activeUntil,
                defaultStatus(status));
        audit(actor, universityId, "SUBSIDY_POLICY_CREATE", "subsidy_policies",
                created.subsidyPolicyId(), "SUCCESS", created.policyName());
        return created;
    }

    private UniversityView requireUniversity(Integer universityId) {
        return repository.findUniversity(universityId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "University not found"));
    }

    private void requireRoute(Integer routeId) {
        if (!repository.routeExists(routeId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Route not found");
        }
    }

    private void requireSameUniversity(Integer expectedUniversityId, Integer actualUniversityId) {
        if (!expectedUniversityId.equals(actualUniversityId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Resource is outside the university scope");
        }
    }

    private void audit(CurrentUser actor, Integer universityId, String action, String table, Object recordId,
            String result, String notes) {
        repository.audit(actor.userId(), universityId, action, table,
                recordId == null ? null : String.valueOf(recordId), result, null, notes);
    }

    private void writeSummaryRow(Sheet sheet, CellStyle headerStyle, int rowIndex, String label, String value) {
        Row row = sheet.createRow(rowIndex);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(headerStyle);
        row.createCell(1).setCellValue(value == null ? "" : value);
    }

    private String importStatusLabel(String status) {
        if (status == null || status.isBlank()) return "";
        return switch (status.trim().toUpperCase(Locale.ROOT)) {
            case "COMPLETED" -> "Hoan tat";
            case "COMPLETED_WITH_ERRORS" -> "Hoan tat co loi";
            case "FAILED" -> "That bai";
            default -> status;
        };
    }

    private String importFieldLabel(String fieldName) {
        if (fieldName == null || fieldName.isBlank()) return "";
        return switch (fieldName.trim()) {
            case "studentCode" -> "MSSV";
            case "fullName" -> "Ho ten";
            case "email" -> "Email";
            case "faculty" -> "Khoa";
            case "academicYear" -> "Nam hoc";
            case "status" -> "Trang thai";
            default -> fieldName;
        };
    }

    private boolean fieldLooksLikeStudentCode(String fieldName) {
        return "studentCode".equals(fieldName);
    }

    private boolean fieldLooksLikeEmail(String fieldName) {
        return "email".equals(fieldName);
    }

    private String rosterRowSnapshot(RosterRow row) {
        try {
            return JSON_MAPPER.writeValueAsString(row.raw());
        } catch (JsonProcessingException exception) {
            return row.raw().toString();
        }
    }

    private Map<String, String> importErrorRawRow(ImportErrorView error) {
        String rawValue = error.rawValue();
        if (rawValue == null || rawValue.isBlank() || !rawValue.trim().startsWith("{")) {
            return Map.of();
        }
        try {
            Map<String, String> raw = JSON_MAPPER.readValue(rawValue, new TypeReference<>() {});
            return raw == null ? Map.of() : raw;
        } catch (IOException exception) {
            return Map.of();
        }
    }

    private String rawRowValue(Map<String, String> rawRow, ImportErrorView error, String fieldName) {
        String value = rawRow.get(fieldName);
        if (value != null && !value.isBlank()) {
            return value;
        }
        if (fieldName.equals(error.fieldName()) && (error.rawValue() == null || !error.rawValue().trim().startsWith("{"))) {
            String legacyValue = nullToEmpty(error.rawValue());
            return legacyValue.isBlank() ? "-" : legacyValue;
        }
        return "-";
    }

    private String importErrorCode(String errorMessage) {
        if (errorMessage == null || errorMessage.isBlank()) {
            return "";
        }
        int colon = errorMessage.indexOf(':');
        String code = colon >= 0 ? errorMessage.substring(0, colon) : errorMessage;
        return code.trim();
    }

    private String shortImportError(String errorMessage, String fieldName) {
        String field = importFieldLabel(fieldName);
        if (field != null && !field.isBlank()) {
            return field;
        }
        if (errorMessage == null || errorMessage.isBlank()) {
            return "Loi du lieu";
        }
        int colon = errorMessage.indexOf(':');
        String message = colon >= 0 ? errorMessage.substring(colon + 1) : errorMessage;
        return message.trim();
    }

    private String importErrorSuggestion(String fieldName, int rowNumber) {
        return switch (fieldName == null ? "" : fieldName) {
            case "studentCode" -> "Kiem tra MSSV, khong de trong va khong trung";
            case "email" -> "Kiem tra lai email va domain cua truong";
            case "fullName" -> "Nhap ho ten sinh vien";
            case "academicYear" -> "Nhap nam hoc dung dinh dang";
            case "status" -> "Dung trang thai ACTIVE, INACTIVE, GRADUATED hoac SUSPENDED";
            default -> "Kiem tra lai dong " + rowNumber + " roi import lai";
        };
    }

    private String formatDateTime(OffsetDateTime value) {
        return value == null ? "" : value.format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"));
    }

    private void appendCsvRow(StringBuilder csv, List<String> values) {
        for (int index = 0; index < values.size(); index++) {
            if (index > 0) {
                csv.append(',');
            }
            csv.append(csvCell(values.get(index)));
        }
        csv.append("\r\n");
    }

    private String csvCell(String value) {
        String text = value == null ? "" : value;
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    private String excelText(String value) {
        String text = nullToEmpty(value);
        return "=\"" + text.replace("\"", "\"\"") + "\"";
    }

    private String rosterStatusLabel(String status) {
        if (status == null) return "";
        return switch (status.trim().toUpperCase(Locale.ROOT)) {
            case "ACTIVE" -> "Đang học";
            case "INACTIVE" -> "Ngừng học";
            case "GRADUATED" -> "Đã tốt nghiệp";
            case "SUSPENDED" -> "Bị đình chỉ";
            default -> status;
        };
    }

    private String sanitizeFileName(String value) {
        String sanitized = blank(value) ? "university" : value.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9_-]+", "-")
                .replaceAll("^-+|-+$", "");
        return sanitized.isBlank() ? "university" : sanitized;
    }

    private String rosterHeaderComment(String header) {
        return switch (header) {
            case "email" -> "Email b\u1eaft bu\u1ed9c, ph\u1ea3i thu\u1ed9c domain h\u1ee3p l\u1ec7 c\u1ee7a tr\u01b0\u1eddng.";
            case "studentCode" -> "MSSV b\u1eaft bu\u1ed9c. Nh\u1eadp d\u1ea1ng Text \u0111\u1ec3 gi\u1eef s\u1ed1 0 \u0111\u1ea7u.";
            case "fullName" -> "H\u1ecd t\u00ean sinh vi\u00ean, b\u1eaft bu\u1ed9c.";
            case "faculty" -> "T\u00ean khoa/ng\u00e0nh. D\u00f9ng danh m\u1ee5c n\u1ebfu c\u00f3 trong sheet Danh m\u1ee5c.";
            case "academicYear" -> "N\u0103m nh\u1eadp h\u1ecdc/kh\u00f3a h\u1ecdc d\u1ea1ng 4 ch\u1eef s\u1ed1, v\u00ed d\u1ee5 2024.";
            case "status" -> "Tr\u1ea1ng th\u00e1i: ACTIVE, INACTIVE, GRADUATED ho\u1eb7c SUSPENDED. B\u1ecf tr\u1ed1ng s\u1ebd m\u1eb7c \u0111\u1ecbnh ACTIVE.";
            default -> header;
        };
    }

    private void addHeaderComment(CreationHelper creationHelper, Drawing<?> drawing, Cell cell, String text) {
        ClientAnchor anchor = creationHelper.createClientAnchor();
        anchor.setCol1(cell.getColumnIndex());
        anchor.setCol2(cell.getColumnIndex() + 3);
        anchor.setRow1(cell.getRowIndex());
        anchor.setRow2(cell.getRowIndex() + 4);
        Comment comment = drawing.createCellComment(anchor);
        comment.setString(creationHelper.createRichTextString(text));
        comment.setAuthor("UniBus");
        cell.setCellComment(comment);
    }

    private boolean shouldUseExplicitDropdown(List<String> values) {
        if (values == null || values.isEmpty() || values.size() > 50) {
            return false;
        }
        int totalLength = values.stream().mapToInt(value -> value == null ? 0 : value.length()).sum();
        return totalLength <= 200;
    }

    private void writeGuideSheet(Sheet sheet, CellStyle headerStyle) {
        String[][] rows = {
                {"M\u1ee5c", "H\u01b0\u1edbng d\u1eabn"},
                {"B\u01b0\u1edbc 1", "Nh\u1eadp d\u1eef li\u1ec7u v\u00e0o sheet Danh s\u00e1ch sinh vi\u00ean, b\u1eaft \u0111\u1ea7u t\u1eeb d\u00f2ng 2."},
                {"B\u01b0\u1edbc 2", "Kh\u00f4ng \u0111\u1ed5i t\u00ean, th\u1ee9 t\u1ef1 header ho\u1eb7c th\u00eam c\u1ed9t m\u1edbi."},
                {"B\u01b0\u1edbc 3", "L\u01b0u file v\u00e0 import l\u1ea1i tr\u00ean m\u00e0n h\u00ecnh Nh\u1eadp danh s\u00e1ch sinh vi\u00ean."},
                {"studentCode *", "MSSV b\u1eaft bu\u1ed9c, kh\u00f4ng tr\u00f9ng trong file. C\u1ed9t n\u00e0y \u0111\u00e3 \u0111\u1ecbnh d\u1ea1ng Text \u0111\u1ec3 gi\u1eef s\u1ed1 0 \u0111\u1ea7u."},
                {"fullName *", "H\u1ecd t\u00ean sinh vi\u00ean, b\u1eaft bu\u1ed9c."},
                {"email *", "Email b\u1eaft bu\u1ed9c v\u00e0 ph\u1ea3i thu\u1ed9c domain ACTIVE c\u1ee7a tr\u01b0\u1eddng."},
                {"faculty", "T\u00ean khoa/ng\u00e0nh. N\u1ebfu sheet Danh m\u1ee5c c\u00f3 danh s\u00e1ch khoa, n\u00ean ch\u1ecdn \u0111\u00fang theo danh m\u1ee5c."},
                {"academicYear", "N\u0103m nh\u1eadp h\u1ecdc/kh\u00f3a h\u1ecdc d\u1ea1ng 4 ch\u1eef s\u1ed1, v\u00ed d\u1ee5 2024."},
                {"status", "B\u1ecf tr\u1ed1ng s\u1ebd m\u1eb7c \u0111\u1ecbnh ACTIVE. Gi\u00e1 tr\u1ecb h\u1ee3p l\u1ec7 xem t\u1ea1i sheet Danh m\u1ee5c."},
                {"Domain h\u1ee3p l\u1ec7", "Xem c\u1ed9t activeEmailDomain trong sheet Danh m\u1ee5c."},
                {"C\u01a1 s\u1edf", "Roster hi\u1ec7n t\u1ea1i ch\u01b0a l\u01b0u campusCode, n\u00ean campus ch\u1ec9 hi\u1ec3n th\u1ecb trong Danh m\u1ee5c \u0111\u1ec3 tham kh\u1ea3o."},
                {"Kh\u00f4ng ch\u00e8n c\u00f4ng th\u1ee9c", "Kh\u00f4ng nh\u1eadp gi\u00e1 tr\u1ecb b\u1eaft \u0111\u1ea7u b\u1eb1ng =, +, -, @."},
                {"Kh\u00f4ng th\u00eam ghi ch\u00fa", "Kh\u00f4ng th\u00eam d\u00f2ng ghi ch\u00fa v\u00e0o sheet Danh s\u00e1ch sinh vi\u00ean."},
                {"Gi\u1edbi h\u1ea1n", "T\u1ed1i \u0111a 1000 d\u00f2ng m\u1ed7i l\u1ea7n import."},
                {"V\u00ed d\u1ee5 \u0111\u00fang", "studentCode=00123, fullName=Nguy\u1ec5n V\u0103n A, email=00123@domain-truong, status=ACTIVE."},
                {"V\u00ed d\u1ee5 sai", "Thi\u1ebfu MSSV, email sai domain, status kh\u00f4ng n\u1eb1m trong danh m\u1ee5c, ho\u1eb7c \u0111\u1ed5i t\u00ean header."}
        };
        for (int rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            Row row = sheet.createRow(rowIndex);
            for (int columnIndex = 0; columnIndex < rows[rowIndex].length; columnIndex++) {
                Cell cell = row.createCell(columnIndex);
                cell.setCellValue(rows[rowIndex][columnIndex]);
                if (rowIndex == 0) {
                    cell.setCellStyle(headerStyle);
                }
            }
        }
        sheet.setColumnWidth(0, 5000);
        sheet.setColumnWidth(1, 16000);
    }

    private void writeCatalogSheet(Sheet sheet, CellStyle headerStyle, List<DomainView> domains, List<CampusView> campuses, List<String> faculties) {
        Row statusHeader = sheet.createRow(0);
        statusHeader.createCell(0).setCellValue("status");
        statusHeader.createCell(1).setCellValue("statusLabel");
        statusHeader.getCell(0).setCellStyle(headerStyle);
        statusHeader.getCell(1).setCellStyle(headerStyle);
        List<String> statuses = VALID_ROSTER_STATUSES.stream().sorted().toList();
        for (int index = 0; index < statuses.size(); index++) {
            Row row = sheet.createRow(index + 1);
            row.createCell(0).setCellValue(statuses.get(index));
            row.createCell(1).setCellValue(rosterStatusLabel(statuses.get(index)));
        }

        Row domainHeader = sheet.getRow(0);
        domainHeader.createCell(3).setCellValue("activeEmailDomain");
        domainHeader.getCell(3).setCellStyle(headerStyle);
        int domainRow = 1;
        for (DomainView domain : domains) {
            if ("ACTIVE".equalsIgnoreCase(domain.status())) {
                Row row = sheet.getRow(domainRow);
                if (row == null) row = sheet.createRow(domainRow);
                row.createCell(3).setCellValue("@" + domain.domain());
                domainRow++;
            }
        }

        Row campusHeader = sheet.getRow(0);
        campusHeader.createCell(5).setCellValue("campusCode");
        campusHeader.createCell(6).setCellValue("campusName");
        campusHeader.createCell(7).setCellValue("campusStatus");
        campusHeader.getCell(5).setCellStyle(headerStyle);
        campusHeader.getCell(6).setCellStyle(headerStyle);
        campusHeader.getCell(7).setCellStyle(headerStyle);
        for (int index = 0; index < campuses.size(); index++) {
            CampusView campus = campuses.get(index);
            Row row = sheet.getRow(index + 1);
            if (row == null) row = sheet.createRow(index + 1);
            row.createCell(5).setCellValue(blankToNull(campus.code()) == null ? "" : campus.code());
            row.createCell(6).setCellValue(blankToNull(campus.name()) == null ? "" : campus.name());
            row.createCell(7).setCellValue(blankToNull(campus.status()) == null ? "" : campus.status());
        }

        Row facultyHeader = sheet.getRow(0);
        facultyHeader.createCell(9).setCellValue("facultyName");
        facultyHeader.getCell(9).setCellStyle(headerStyle);
        for (int index = 0; index < faculties.size(); index++) {
            Row row = sheet.getRow(index + 1);
            if (row == null) row = sheet.createRow(index + 1);
            row.createCell(9).setCellValue(faculties.get(index));
        }

        sheet.setColumnWidth(0, 4500);
        sheet.setColumnWidth(1, 6500);
        sheet.setColumnWidth(3, 8000);
        sheet.setColumnWidth(5, 4500);
        sheet.setColumnWidth(6, 8500);
        sheet.setColumnWidth(7, 5000);
        sheet.setColumnWidth(9, 8500);
    }

    private RosterParseResult parseRosterFile(MultipartFile file) {
        return parseRosterFile(file, true);
    }

    private RosterParseResult parseRosterFile(MultipartFile file, boolean failOnStructuralErrors) {
        FileType fileType = detectRosterFileType(file);
        try {
            RosterParseResult result = switch (fileType) {
                case CSV -> parseCsvRoster(file);
                case XLSX -> parseXlsxRoster(file);
            };
            if (failOnStructuralErrors && !result.structuralErrors().isEmpty()) {
                throw structuralError(result.structuralErrors().get(0));
            }
            return result;
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MALFORMED_FILE: Unable to read roster file");
        }
    }

    private FileType detectRosterFileType(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE: Roster file is empty");
        }
        if (file.getSize() > MAX_ROSTER_IMPORT_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_TOO_LARGE: Roster import file is too large");
        }
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().trim().toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().trim().toLowerCase(Locale.ROOT);
        if (fileName.endsWith(".csv")) {
            if (!contentType.isBlank() && !contentType.contains(CSV_MIME) && !contentType.contains("application/vnd.ms-excel")
                    && !contentType.contains("application/octet-stream")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "UNSUPPORTED_FILE_TYPE: CSV file content type is not supported");
            }
            return FileType.CSV;
        }
        if (fileName.endsWith(".xlsx")) {
            if (!contentType.isBlank() && !contentType.contains(XLSX_MIME) && !contentType.contains("application/octet-stream")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "UNSUPPORTED_FILE_TYPE: XLSX file content type is not supported");
            }
            return FileType.XLSX;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "UNSUPPORTED_FILE_TYPE: Please upload CSV or XLSX");
    }

    private RosterParseResult parseCsvRoster(MultipartFile file) throws Exception {
        List<CsvRecord> records = parseCsvRecords(file);
        return buildRosterParseResult(file, FileType.CSV, records);
    }

    private List<CsvRecord> parseCsvRecords(MultipartFile file) throws Exception {
        List<CsvRecord> records = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            List<String> values = new ArrayList<>();
            StringBuilder cell = new StringBuilder();
            boolean quoted = false;
            boolean cellQuoted = false;
            boolean seenAny = false;
            int rowNumber = 1;
            int current;
            while ((current = reader.read()) != -1) {
                seenAny = true;
                char ch = (char) current;
                if (ch == '"') {
                    if (quoted && reader.markSupported()) {
                        reader.mark(1);
                        int next = reader.read();
                        if (next == '"') {
                            cell.append('"');
                        } else {
                            quoted = false;
                            if (next != -1) {
                                reader.reset();
                            }
                        }
                    } else if (quoted) {
                        quoted = false;
                    } else if (cell.length() == 0) {
                        quoted = true;
                        cellQuoted = true;
                    } else {
                        cell.append(ch);
                    }
                } else if (ch == ',' && !quoted) {
                    values.add(cell.toString());
                    cell.setLength(0);
                    cellQuoted = false;
                } else if ((ch == '\n' || ch == '\r') && !quoted) {
                    if (ch == '\r') {
                        reader.mark(1);
                        int next = reader.read();
                        if (next != '\n' && next != -1) {
                            reader.reset();
                        }
                    }
                    values.add(cell.toString());
                    records.add(new CsvRecord(rowNumber, values));
                    values = new ArrayList<>();
                    cell.setLength(0);
                    cellQuoted = false;
                    rowNumber++;
                } else {
                    cell.append(ch);
                }
            }
            if (quoted) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "MALFORMED_FILE: CSV quoted value is not closed");
            }
            if (seenAny && (cell.length() > 0 || !values.isEmpty() || cellQuoted)) {
                values.add(cell.toString());
                records.add(new CsvRecord(rowNumber, values));
            }
        }
        return records;
    }

    private RosterParseResult parseXlsxRoster(MultipartFile file) throws Exception {
        DataFormatter formatter = new DataFormatter(Locale.ROOT);
        List<CsvRecord> records = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = findRosterImportSheet(workbook);
            int lastRow = sheet.getLastRowNum();
            for (int rowIndex = sheet.getFirstRowNum(); rowIndex <= lastRow; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) {
                    records.add(new CsvRecord(rowIndex + 1, List.of()));
                    continue;
                }
                int maxColumns = Math.max(row.getLastCellNum(), (short) ROSTER_IMPORT_HEADERS.size());
                List<String> columns = new ArrayList<>();
                for (int columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
                    Cell cell = row.getCell(columnIndex);
                    columns.add(readXlsxCell(cell, formatter));
                }
                records.add(new CsvRecord(rowIndex + 1, columns));
            }
        }
        return buildRosterParseResult(file, FileType.XLSX, records);
    }

    private Sheet findRosterImportSheet(Workbook workbook) {
        Sheet sheet = workbook.getSheet("Danh sách sinh viên");
        if (sheet != null) {
            return sheet;
        }
        sheet = workbook.getSheet("Import");
        if (sheet != null) {
            return sheet;
        }
        if (workbook.getNumberOfSheets() == 1) {
            return workbook.getSheetAt(0);
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_SHEET_NOT_FOUND: Import sheet was not found");
    }

    private String readXlsxCell(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.FORMULA) {
            return "=" + cell.getCellFormula();
        }
        return formatter.formatCellValue(cell);
    }

    private RosterParseResult buildRosterParseResult(MultipartFile file, FileType fileType, List<CsvRecord> records) {
        List<ParseError> structuralErrors = new ArrayList<>();
        if (records.isEmpty() || records.stream().allMatch(record -> isBlankRecord(record.values()))) {
            structuralErrors.add(new ParseError("EMPTY_FILE", null, null, "Roster file is empty"));
            return new RosterParseResult(List.of(), List.of(), fileInfo(file, fileType, 0), structuralErrors);
        }

        HeaderParse headerParse = null;
        List<RosterRow> rows = new ArrayList<>();
        for (CsvRecord record : records) {
            List<String> rawColumns = headerParse == null ? trimTrailingEmptyColumns(record.values()) : record.values();
            if (rawColumns.stream().allMatch(this::blank)) {
                continue;
            }
            if (isCommentRow(rawColumns)) {
                continue;
            }
            if (headerParse == null) {
                headerParse = parseRosterHeaders(rawColumns, record.rowNumber());
                structuralErrors.addAll(headerParse.errors());
                if (!structuralErrors.isEmpty()) {
                    return new RosterParseResult(headerParse.headers(), rows, fileInfo(file, fileType, rows.size()), structuralErrors);
                }
                continue;
            }
            if (rawColumns.size() != headerParse.headers().size()) {
                rows.add(rowWithError(record.rowNumber(), rawColumns, "INVALID_COLUMN_COUNT: Row does not match header column count"));
                continue;
            }
            rows.add(normalizeRosterRow(record.rowNumber(), rawColumns, headerParse));
            if (rows.size() > MAX_ROSTER_IMPORT_ROWS) {
                structuralErrors.add(new ParseError("TOO_MANY_ROWS", record.rowNumber(), null, "Roster import supports up to 1000 rows per file"));
                return new RosterParseResult(headerParse.headers(), rows, fileInfo(file, fileType, rows.size()), structuralErrors);
            }
        }

        if (headerParse == null) {
            structuralErrors.add(new ParseError("MISSING_REQUIRED_HEADER", null, null, "Roster header row was not found"));
            return new RosterParseResult(List.of(), rows, fileInfo(file, fileType, rows.size()), structuralErrors);
        }
        if (rows.isEmpty()) {
            structuralErrors.add(new ParseError("EMPTY_FILE", null, null, "Roster file has no student rows"));
        }
        return new RosterParseResult(headerParse.headers(), rows, fileInfo(file, fileType, rows.size()), structuralErrors);
    }

    private HeaderParse parseRosterHeaders(List<String> rawColumns, int rowNumber) {
        List<String> headers = rawColumns.stream()
                .map(this::normalizeHeader)
                .toList();
        List<ParseError> errors = new ArrayList<>();
        Map<String, Integer> indexByHeader = new LinkedHashMap<>();
        Set<String> seen = new HashSet<>();
        for (int index = 0; index < headers.size(); index++) {
            String header = headers.get(index);
            if (blank(header)) {
                errors.add(new ParseError("UNSUPPORTED_HEADER", rowNumber, null, "Blank header is not supported"));
                continue;
            }
            String key = header.toLowerCase(Locale.ROOT);
            if (!seen.add(key)) {
                errors.add(new ParseError("DUPLICATE_HEADER", rowNumber, header, "Duplicate header: " + header));
                continue;
            }
            if (!ROSTER_IMPORT_HEADERS.contains(header)) {
                errors.add(new ParseError("UNSUPPORTED_HEADER", rowNumber, header, "Unsupported header: " + header));
                continue;
            }
            indexByHeader.put(header, index);
        }
        for (String required : ROSTER_IMPORT_HEADERS) {
            if (!indexByHeader.containsKey(required)) {
                errors.add(new ParseError("MISSING_REQUIRED_HEADER", rowNumber, required, "Missing required header: " + required));
            }
        }
        return new HeaderParse(headers, indexByHeader, errors);
    }

    private RosterRow normalizeRosterRow(int rowNumber, List<String> rawColumns, HeaderParse headerParse) {
        Map<String, String> raw = new LinkedHashMap<>();
        Map<String, String> normalized = new LinkedHashMap<>();
        String rowError = null;
        String rowErrorField = null;
        for (String header : headerParse.headers()) {
            int index = headerParse.indexByHeader().getOrDefault(header, -1);
            String rawValue = index < 0 ? null : column(rawColumns, index);
            raw.put(header, rawValue);
            String normalizedValue = normalizeRosterValue(header, rawValue);
            normalized.put(header, normalizedValue);
            if (startsWithFormula(rawValue) && rowError == null) {
                rowError = "UNSAFE_FORMULA_VALUE: Formula-like value is not allowed";
                rowErrorField = header;
            }
        }
        return new RosterRow(
                rowNumber,
                normalized.get("email"),
                normalized.get("studentCode"),
                normalized.get("fullName"),
                normalized.get("faculty"),
                normalized.get("academicYear"),
                normalized.get("status"),
                rowError,
                rowErrorField,
                raw,
                normalized);
    }

    private RosterRow rowWithError(int rowNumber, List<String> rawColumns, String error) {
        Map<String, String> raw = new LinkedHashMap<>();
        for (int index = 0; index < rawColumns.size(); index++) {
            raw.put("column" + (index + 1), rawColumns.get(index));
        }
        return new RosterRow(rowNumber, null, null, null, null, null, null, error, null, raw, Map.of());
    }

    private String normalizeRosterValue(String header, String value) {
        String normalized = normalizeCell(value);
        if (blank(normalized)) {
            return null;
        }
        return switch (header) {
            case "email" -> normalized.toLowerCase(Locale.ROOT);
            case "studentCode" -> normalized;
            case "fullName", "faculty" -> normalized;
            case "academicYear" -> normalizeAcademicYearText(normalized);
            case "status" -> normalized.toUpperCase(Locale.ROOT);
            default -> normalized;
        };
    }

    private String normalizeHeader(String value) {
        String normalized = normalizeCell(stripBom(value));
        return normalized == null ? "" : normalized;
    }

    private String normalizeCell(String value) {
        if (value == null) {
            return null;
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFC)
                .replace('\u00A0', ' ')
                .trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeAcademicYearText(String value) {
        if (value.matches("\\d{4}\\.0+")) {
            return value.substring(0, 4);
        }
        return value;
    }

    private List<String> trimTrailingEmptyColumns(List<String> values) {
        int last = values.size() - 1;
        while (last >= 0 && blank(values.get(last))) {
            last--;
        }
        return last < 0 ? List.of() : new ArrayList<>(values.subList(0, last + 1));
    }

    private boolean isBlankRecord(List<String> values) {
        return values == null || values.stream().allMatch(this::blank);
    }

    private RosterFileInfo fileInfo(MultipartFile file, FileType fileType, int totalRows) {
        return new RosterFileInfo(
                file.getOriginalFilename() == null ? "" : file.getOriginalFilename(),
                fileType.name(),
                totalRows);
    }

    private ApiException structuralError(ParseError error) {
        return new ApiException(HttpStatus.BAD_REQUEST, error.code() + ": " + error.message());
    }

    private PreviewBuildResult buildRosterPreview(RosterParseResult parseResult, CurrentUser actor, Integer universityId, MultipartFile file) {
        OffsetDateTime expiresAt = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(PREVIEW_TTL_MINUTES);
        return buildRosterPreview(parseResult, actor, universityId, file, UUID.randomUUID().toString(), expiresAt);
    }

    private void validatePreviewSessionForUser(PreviewSession session, CurrentUser actor, Integer universityId) {
        if (!session.userId().equals(actor.userId()) || !session.universityId().equals(universityId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Preview token is outside the current user scope");
        }
        if (session.expiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            rosterPreviewSessions.remove(session.previewToken());
            throw new ApiException(HttpStatus.BAD_REQUEST, "Preview token has expired");
        }
    }

    private ImportBatchView requireImportBatch(Integer universityId, Long importBatchId) {
        if (importBatchId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Import batch id is required");
        }
        ImportBatchView batch = repository.findImportBatch(importBatchId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Import batch was not found"));
        if (!batch.universityId().equals(universityId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Import batch is outside the current university scope");
        }
        return batch;
    }

    private List<RosterInsertRow> buildRowsToInsertForAddNewOnly(RosterParseResult parseResult, Integer universityId, Long batchId) {
        Set<String> seenStudentCodes = new HashSet<>();
        Set<String> seenEmails = new HashSet<>();
        List<RosterInsertRow> rowsToInsert = new ArrayList<>();
        for (RosterRow row : parseResult.rows()) {
            List<RosterImportPreviewErrorView> rowErrors = validateRosterPreviewRow(row, universityId, seenStudentCodes, seenEmails);
            if (!rowErrors.isEmpty()) {
                continue;
            }
            if (repository.findRosterByStudentCode(universityId, row.studentCode()).isPresent()) {
                continue;
            }
            rowsToInsert.add(new RosterInsertRow(
                    universityId,
                    normalizeEmail(row.email()),
                    normalizeStudentCode(row.studentCode()),
                    row.fullName().trim(),
                    blankToNull(row.faculty()),
                    parseAcademicYearOrNull(row.academicYear()),
                    normalizeRosterStatus(row.status()),
                    batchId));
        }
        return rowsToInsert;
    }

    private int recordImportErrorsForAddNewOnly(RosterParseResult parseResult, Integer universityId, Long batchId) {
        Set<String> seenStudentCodes = new HashSet<>();
        Set<String> seenEmails = new HashSet<>();
        int errors = 0;
        for (RosterRow row : parseResult.rows()) {
            List<RosterImportPreviewErrorView> rowErrors = validateRosterPreviewRow(row, universityId, seenStudentCodes, seenEmails);
            if (!rowErrors.isEmpty()) {
                for (RosterImportPreviewErrorView error : rowErrors) {
                    repository.addImportError(batchId, row.rowNumber(), error.field(), rosterRowSnapshot(row), error.code() + ": " + error.message());
                }
                errors++;
                continue;
            }
            if (repository.findRosterByStudentCode(universityId, row.studentCode()).isPresent()) {
                repository.addImportError(
                        batchId,
                        row.rowNumber(),
                        "studentCode",
                        rosterRowSnapshot(row),
                        "SKIPPED_EXISTING: MSSV đã tồn tại nên được bỏ qua trong chế độ ADD_NEW_ONLY");
                errors++;
            }
        }
        return errors;
    }

    private PreviewBuildResult buildRosterPreview(RosterParseResult parseResult, CurrentUser actor, Integer universityId,
            MultipartFile file, String previewToken, OffsetDateTime expiresAt) {
        Set<String> seenStudentCodes = new HashSet<>();
        Set<String> seenEmails = new HashSet<>();
        List<RosterImportPreviewRowView> previewRows = new ArrayList<>();
        List<RosterImportPreviewErrorView> errors = new ArrayList<>();
        List<RosterImportPreviewErrorView> structuralErrors = parseResult.structuralErrors().stream()
                .map(this::toPreviewError)
                .toList();
        int duplicateRows = 0;
        int createRows = 0;
        int existingRows = 0;
        int skippedRows = 0;
        for (RosterRow row : parseResult.rows()) {
            List<RosterImportPreviewErrorView> rowErrors = validateRosterPreviewRow(row, universityId, seenStudentCodes, seenEmails);
            boolean duplicateInFile = rowErrors.stream().anyMatch(error ->
                    "DUPLICATE_STUDENT_CODE_IN_FILE".equals(error.code()) || "DUPLICATE_EMAIL_IN_FILE".equals(error.code()));
            if (duplicateInFile) {
                duplicateRows++;
            }
            boolean existing = false;
            if (rowErrors.stream().noneMatch(error -> "MISSING_REQUIRED_VALUE".equals(error.code()) || "INVALID_STUDENT_CODE".equals(error.code()))) {
                existing = repository.findRosterByStudentCode(universityId, row.studentCode()).isPresent();
            }
            if (rowErrors.isEmpty()) {
                if (existing) {
                    existingRows++;
                    skippedRows++;
                } else {
                    createRows++;
                }
            } else {
                skippedRows++;
            }
            String action = rowErrors.isEmpty()
                    ? (existing ? "SKIP_EXISTING" : "CREATE")
                    : "BLOCKED";
            if (previewRows.size() < PREVIEW_LIMIT) {
                previewRows.add(new RosterImportPreviewRowView(
                        row.rowNumber(),
                        row.studentCode(),
                        row.fullName(),
                        row.email(),
                        row.faculty(),
                        parseAcademicYearOrNull(row.academicYear()),
                        blank(row.status()) ? "ACTIVE" : row.status(),
                        rowErrors.isEmpty(),
                        existing,
                        duplicateInFile,
                        action));
            }
            errors.addAll(rowErrors);
        }
        int errorRows = (int) parseResult.rows().stream()
                .filter(row -> errors.stream().anyMatch(error -> error.rowNumber() == row.rowNumber()))
                .count();
        int validRows = parseResult.rows().size() - errorRows;
        RosterImportPreviewView view = new RosterImportPreviewView(
                previewToken,
                file == null ? parseResult.fileInfo().fileName() : nullToEmpty(file.getOriginalFilename()),
                file == null ? 0L : file.getSize(),
                parseResult.rows().size(),
                validRows,
                errorRows,
                duplicateRows,
                createRows,
                existingRows,
                skippedRows,
                expiresAt,
                previewRows,
                errors,
                structuralErrors);
        return new PreviewBuildResult(view);
    }

    private List<RosterImportPreviewErrorView> validateRosterPreviewRow(RosterRow row, Integer universityId,
            Set<String> seenStudentCodes, Set<String> seenEmails) {
        List<RosterImportPreviewErrorView> errors = new ArrayList<>();
        if (row.rowError() != null) {
            errors.add(new RosterImportPreviewErrorView(row.rowNumber(), row.rowErrorField(), null,
                    row.rowError().split(":", 2)[0], "Giá trị không an toàn hoặc sai cấu trúc",
                    "Kiểm tra lại ô dữ liệu, không nhập công thức hoặc dòng sai số cột"));
            return errors;
        }
        if (blank(row.studentCode())) {
            errors.add(previewError(row, "studentCode", row.studentCode(), "MISSING_REQUIRED_VALUE",
                    "Mã sinh viên là bắt buộc", "Nhập MSSV dạng text"));
        } else if (row.studentCode().length() > 20) {
            errors.add(previewError(row, "studentCode", row.studentCode(), "INVALID_STUDENT_CODE",
                    "Mã sinh viên vượt quá 20 ký tự", "Rút gọn MSSV theo quy định hiện tại"));
        } else {
            String key = row.studentCode().toUpperCase(Locale.ROOT);
            if (!seenStudentCodes.add(key)) {
                errors.add(previewError(row, "studentCode", row.studentCode(), "DUPLICATE_STUDENT_CODE_IN_FILE",
                        "Mã sinh viên bị trùng trong file", "Giữ một dòng duy nhất cho MSSV này"));
            }
        }
        if (blank(row.fullName())) {
            errors.add(previewError(row, "fullName", row.fullName(), "MISSING_REQUIRED_VALUE",
                    "Họ tên là bắt buộc", "Nhập họ tên sinh viên"));
        } else if (row.fullName().length() > 100) {
            errors.add(previewError(row, "fullName", row.fullName(), "MISSING_REQUIRED_VALUE",
                    "Họ tên vượt quá 100 ký tự", "Rút gọn theo giới hạn dữ liệu hiện tại"));
        }
        if (blank(row.email())) {
            errors.add(previewError(row, "email", row.email(), "MISSING_REQUIRED_VALUE",
                    "Email là bắt buộc", "Nhập email thuộc domain của trường"));
        } else if (!isValidEmailShape(row.email())) {
            errors.add(previewError(row, "email", row.email(), "INVALID_EMAIL",
                    "Email không đúng định dạng", "Kiểm tra lại email"));
        } else {
            if (!seenEmails.add(row.email().toLowerCase(Locale.ROOT))) {
                errors.add(previewError(row, "email", row.email(), "DUPLICATE_EMAIL_IN_FILE",
                        "Email bị trùng trong file", "Giữ một dòng duy nhất cho email này"));
            }
            String domain = emailDomain(row.email());
            if (domain == null || !repository.activeDomainBelongsToUniversity(universityId, domain)) {
                errors.add(previewError(row, "email", row.email(), "INVALID_EMAIL_DOMAIN",
                        "Domain email không thuộc trường hoặc chưa hoạt động", "Dùng đúng domain email trong danh mục của trường"));
            }
            Optional<RosterStudentView> existingByEmail = repository.findRosterByEmail(universityId, row.email());
            if (existingByEmail.isPresent() && !equalsIgnoreCase(existingByEmail.get().studentCode(), row.studentCode())) {
                errors.add(previewError(row, "email", row.email(), "EMAIL_ALREADY_EXISTS",
                        "Email đã tồn tại với MSSV khác", "Kiểm tra lại email hoặc MSSV"));
            }
        }
        if (!blank(row.faculty()) && row.faculty().length() > 100) {
            errors.add(previewError(row, "faculty", row.faculty(), "FACULTY_NOT_FOUND",
                    "Khoa vượt quá 100 ký tự", "Nhập tên khoa theo dữ liệu hiện tại của trường"));
        }
        if (!blank(row.academicYear())) {
            if (!row.academicYear().matches("\\d{4}")) {
                errors.add(previewError(row, "academicYear", row.academicYear(), "INVALID_ACADEMIC_YEAR",
                        "Năm học phải có 4 chữ số", "Nhập dạng 2024, không nhập 24"));
            } else {
                int year = Integer.parseInt(row.academicYear());
                if (year < 1900 || year > 2100) {
                    errors.add(previewError(row, "academicYear", row.academicYear(), "INVALID_ACADEMIC_YEAR",
                            "Năm học nằm ngoài khoảng cho phép", "Kiểm tra lại năm nhập học/khóa học"));
                }
            }
        }
        String status = normalizeRosterStatusOrNull(row.status());
        if (status == null) {
            errors.add(previewError(row, "status", row.status(), "INVALID_STATUS",
                    "Trạng thái không hợp lệ", "Dùng ACTIVE, INACTIVE, GRADUATED hoặc SUSPENDED"));
        }
        return errors;
    }

    private RosterImportPreviewErrorView previewError(RosterRow row, String field, String value, String code,
            String message, String suggestion) {
        return new RosterImportPreviewErrorView(row.rowNumber(), field, value, code, message, suggestion);
    }

    private RosterImportPreviewErrorView toPreviewError(ParseError error) {
        return new RosterImportPreviewErrorView(
                error.rowNumber() == null ? 0 : error.rowNumber(),
                error.fieldName(),
                null,
                error.code(),
                error.message(),
                "Tải template mới và kiểm tra lại cấu trúc file");
    }

    private boolean isValidEmailShape(String email) {
        return email != null && email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) {
            return left == null && right == null;
        }
        return left.equalsIgnoreCase(right);
    }

    private String normalizeImportMode(String mode) {
        if (blank(mode)) {
            return "ADD_NEW_ONLY";
        }
        return mode.trim().toUpperCase(Locale.ROOT);
    }

    private Integer parseAcademicYearOrNull(String value) {
        return blank(value) || !value.matches("\\d{4}") ? null : Integer.parseInt(value);
    }

    private RowValidation validateRosterRow(RosterRow row) {
        if (row.rowError() != null) {
            return new RowValidation(row.rowErrorField(), null, row.rowError());
        }
        if (blank(row.email()) || !row.email().contains("@")) {
            return new RowValidation("email", row.email(), "Email is required");
        }
        if (blank(row.studentCode())) {
            return new RowValidation("studentCode", row.studentCode(), "Student code is required");
        }
        if (blank(row.fullName())) {
            return new RowValidation("fullName", row.fullName(), "Full name is required");
        }
        RowValidation formulaValidation = rejectFormulaLikeValues(row);
        if (formulaValidation.errorMessage() != null) {
            return formulaValidation;
        }
        if (!blank(row.academicYear())) {
            String academicYear = row.academicYear().trim();
            if (!academicYear.matches("\\d{4}")) {
                return new RowValidation("academicYear", row.academicYear(), "Academic year must be a 4-digit year");
            }
            int year = Integer.parseInt(academicYear);
            if (year < 1900 || year > 2100) {
                return new RowValidation("academicYear", row.academicYear(), "Academic year is outside the allowed range");
            }
        }
        String status = normalizeRosterStatusOrNull(row.status());
        if (status == null) {
            return new RowValidation("status", row.status(), "Invalid roster status");
        }
        return new RowValidation(null, null, null);
    }

    private String normalizeRosterStatus(String value) {
        String status = normalizeRosterStatusOrNull(value);
        return status == null ? "ACTIVE" : status;
    }

    private String normalizeRosterStatusOrNull(String value) {
        if (blank(value)) return "ACTIVE";
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return VALID_ROSTER_STATUSES.contains(normalized) ? normalized : null;
    }

    private Integer parseAcademicYear(String value) {
        return blank(value) ? null : Integer.parseInt(value.trim());
    }

    private void validateRosterHeaders(List<String> rawHeaders) {
        List<String> headers = rawHeaders.stream()
                .map(this::stripBom)
                .map(value -> value == null ? "" : value.trim())
                .toList();
        if (headers.size() != ROSTER_IMPORT_HEADERS.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Roster template must contain exactly 6 headers");
        }
        Set<String> seenHeaders = new HashSet<>();
        for (String header : headers) {
            if (!seenHeaders.add(header.toLowerCase(Locale.ROOT))) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Roster template contains duplicate headers");
            }
        }
        for (int index = 0; index < ROSTER_IMPORT_HEADERS.size(); index++) {
            if (!ROSTER_IMPORT_HEADERS.get(index).equals(headers.get(index))) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Roster template headers were changed. Please download a new template");
            }
        }
    }

    private boolean isCommentRow(List<String> columns) {
        if (columns == null || columns.isEmpty()) return false;
        long nonBlank = columns.stream().filter(value -> !blank(value)).count();
        return nonBlank == 1 && columns.get(0) != null && stripBom(columns.get(0)).trim().startsWith("#");
    }

    private RowValidation rejectFormulaLikeValues(RosterRow row) {
        if (startsWithFormula(row.email())) return new RowValidation("email", row.email(), "Formula-like value is not allowed");
        if (startsWithFormula(row.studentCode())) return new RowValidation("studentCode", row.studentCode(), "Formula-like value is not allowed");
        if (startsWithFormula(row.fullName())) return new RowValidation("fullName", row.fullName(), "Formula-like value is not allowed");
        if (startsWithFormula(row.faculty())) return new RowValidation("faculty", row.faculty(), "Formula-like value is not allowed");
        return new RowValidation(null, null, null);
    }

    private boolean startsWithFormula(String value) {
        if (value == null) return false;
        String trimmed = value.trim();
        return trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@");
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < line.length(); index++) {
            char current = line.charAt(index);
            if (current == '"') {
                if (quoted && index + 1 < line.length() && line.charAt(index + 1) == '"') {
                    cell.append('"');
                    index++;
                } else {
                    quoted = !quoted;
                }
            } else if (current == ',' && !quoted) {
                values.add(cell.toString());
                cell.setLength(0);
            } else {
                cell.append(current);
            }
        }
        values.add(cell.toString());
        return values;
    }

    private String column(List<String> columns, int index) {
        return index >= columns.size() ? null : columns.get(index);
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String value) {
        return blank(value) ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String stripBom(String value) {
        return value == null ? null : value.replace("\uFEFF", "");
    }

    private String normalizeStudentCode(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeDomain(String value) {
        String domain = value.trim().toLowerCase(Locale.ROOT);
        return domain.startsWith("@") ? domain.substring(1) : domain;
    }

    private String emailDomain(String email) {
        String normalized = normalizeEmail(email);
        int at = normalized == null ? -1 : normalized.lastIndexOf('@');
        return at < 0 || at == normalized.length() - 1 ? null : normalized.substring(at + 1);
    }

    private String defaultStatus(String status) {
        return blank(status) ? "ACTIVE" : status.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private record KnownUniversityDomain(String code, String name, String shortName) {
    }

    private enum FileType {
        CSV,
        XLSX
    }

    private record CsvRecord(int rowNumber, List<String> values) {
    }

    private record HeaderParse(List<String> headers, Map<String, Integer> indexByHeader, List<ParseError> errors) {
    }

    private record RosterParseResult(
            List<String> headers,
            List<RosterRow> rows,
            RosterFileInfo fileInfo,
            List<ParseError> structuralErrors) {
    }

    private record RosterFileInfo(String fileName, String fileType, int totalRows) {
    }

    private record ParseError(String code, Integer rowNumber, String fieldName, String message) {
    }

    private record PreviewBuildResult(RosterImportPreviewView view) {
    }

    private static final class PreviewSession {
        private final String previewToken;
        private final Integer userId;
        private final Integer universityId;
        private final OffsetDateTime expiresAt;
        private final RosterParseResult parseResult;
        private Long committedBatchId;

        private PreviewSession(String previewToken, Integer userId, Integer universityId,
                OffsetDateTime expiresAt, RosterParseResult parseResult, Long committedBatchId) {
            this.previewToken = previewToken;
            this.userId = userId;
            this.universityId = universityId;
            this.expiresAt = expiresAt;
            this.parseResult = parseResult;
            this.committedBatchId = committedBatchId;
        }

        private String previewToken() {
            return previewToken;
        }

        private Integer userId() {
            return userId;
        }

        private Integer universityId() {
            return universityId;
        }

        private OffsetDateTime expiresAt() {
            return expiresAt;
        }

        private RosterParseResult parseResult() {
            return parseResult;
        }

        private Long committedBatchId() {
            return committedBatchId;
        }

        private void committedBatchId(Long committedBatchId) {
            this.committedBatchId = committedBatchId;
        }
    }

    private record RosterRow(int rowNumber, String email, String studentCode, String fullName, String faculty,
            String academicYear, String status, String rowError, String rowErrorField, Map<String, String> raw,
            Map<String, String> normalized) {
    }

    private record RowValidation(String fieldName, String rawValue, String errorMessage) {
    }
}
