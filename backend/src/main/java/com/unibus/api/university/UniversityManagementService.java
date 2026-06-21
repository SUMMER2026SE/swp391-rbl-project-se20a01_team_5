package com.unibus.api.university;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataAccessException;
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
import com.unibus.api.university.UniversityDtos.ReconciliationView;
import com.unibus.api.university.UniversityDtos.PaymentTransactionView;
import com.unibus.api.university.UniversityDtos.RosterStudentView;
import com.unibus.api.university.UniversityDtos.RouteUniversityView;
import com.unibus.api.university.UniversityDtos.StudentUniversityView;
import com.unibus.api.university.UniversityDtos.SubsidyPolicyView;
import com.unibus.api.university.UniversityDtos.UniversityAdminView;
import com.unibus.api.university.UniversityDtos.UniversityStatsView;
import com.unibus.api.university.UniversityDtos.UniversityView;
import com.unibus.api.university.UniversityManagementRepository.DomainMatch;
import com.unibus.api.university.UniversityManagementRepository.RosterMatch;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;

@Service
public class UniversityManagementService {

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
    public RouteUniversityView createRouteUniversity(CurrentUser actor, CreateRouteUniversityRequest request) {
        requireUniversity(request.universityId());
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
    public List<RosterStudentView> listRoster(Integer universityId, String keyword, String status) {
        requireUniversity(universityId);
        return repository.findRoster(universityId, keyword, status);
    }

    @Transactional
    public ImportBatchView importRoster(CurrentUser actor, Integer universityId, MultipartFile file) {
        requireUniversity(universityId);
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Roster file is required");
        }
        String fileName = file.getOriginalFilename() == null ? "roster" : file.getOriginalFilename();
        Long batchId = repository.createImportBatch(universityId, fileName, actor.userId());
        List<RosterRow> rows = readRosterRows(file);
        int success = 0;
        int errors = 0;
        for (RosterRow row : rows) {
            RowValidation validation = validateRosterRow(row);
            if (validation.errorMessage() != null) {
                repository.addImportError(batchId, row.rowNumber(), validation.fieldName(), validation.rawValue(), validation.errorMessage());
                errors++;
                continue;
            }
            repository.upsertRoster(
                    universityId,
                    normalizeEmail(row.email()),
                    row.studentCode().trim(),
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
    public List<ImportBatchView> listImportBatches(Integer universityId) {
        requireUniversity(universityId);
        return repository.findImportBatches(universityId);
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void applyGoogleUniversityLink(User user) {
        if (user.getRole() != UserRole.STUDENT) {
            return;
        }
        String email = normalizeEmail(user.getEmail());
        repository.findActiveRosterByEmail(email).ifPresent(roster -> {
            if (repository.studentCodeBelongsToOtherUser(roster.studentCode(), user.getId())) {
                return;
            }
            repository.upsertStudentFromRoster(user.getId(), roster);
            repository.matchRosterToUser(roster.rosterId(), user.getId());
            repository.audit(user.getId(), roster.universityId(), "GOOGLE_ROSTER_AUTO_LINK", "students",
                    roster.studentCode(), "SUCCESS", null, email);
        });
    }

    @Transactional(readOnly = true)
    public DomainMatch googleDomainHint(String email) {
        String domain = emailDomain(email);
        return domain == null ? null : repository.findActiveDomainMatch(domain).orElse(null);
    }

    @Transactional(readOnly = true)
    public UniversityAdminView requireUniversityAdmin(CurrentUser currentUser) {
        return repository.findUniversityAdminByUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "University admin scope is not assigned"));
    }

    @Transactional
    public SubsidyPolicyView createScopedSubsidyPolicy(CurrentUser actor, CreateScopedSubsidyPolicyRequest request) {
        Integer universityId = requireUniversityAdmin(actor).universityId();
        return createSubsidyPolicy(
                actor,
                universityId,
                request.campusId(),
                request.policyName(),
                request.subsidyType(),
                request.value(),
                request.maxAmount(),
                request.activeFrom(),
                request.activeUntil(),
                request.status());
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

    private List<RosterRow> readRosterRows(MultipartFile file) {
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        try {
            if (fileName.endsWith(".xlsx")) {
                return readXlsx(file);
            }
            return readCsv(file);
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read roster file");
        }
    }

    private List<RosterRow> readCsv(MultipartFile file) throws Exception {
        List<RosterRow> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int rowNumber = 0;
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (rowNumber == 1 && line.toLowerCase(Locale.ROOT).contains("email")) {
                    continue;
                }
                String[] columns = line.split(",", -1);
                rows.add(new RosterRow(
                        rowNumber,
                        column(columns, 0),
                        column(columns, 1),
                        column(columns, 2),
                        column(columns, 3),
                        column(columns, 4),
                        column(columns, 5)));
            }
        }
        return rows;
    }

    private List<RosterRow> readXlsx(MultipartFile file) throws Exception {
        List<RosterRow> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                int rowNumber = row.getRowNum() + 1;
                String first = formatter.formatCellValue(row.getCell(0));
                if (rowNumber == 1 && first.toLowerCase(Locale.ROOT).contains("email")) {
                    continue;
                }
                rows.add(new RosterRow(
                        rowNumber,
                        first,
                        formatter.formatCellValue(row.getCell(1)),
                        formatter.formatCellValue(row.getCell(2)),
                        formatter.formatCellValue(row.getCell(3)),
                        formatter.formatCellValue(row.getCell(4)),
                        formatter.formatCellValue(row.getCell(5))));
            }
        }
        return rows;
    }

    private RowValidation validateRosterRow(RosterRow row) {
        if (blank(row.email()) || !row.email().contains("@")) {
            return new RowValidation("email", row.email(), "Email is required");
        }
        if (blank(row.studentCode())) {
            return new RowValidation("studentCode", row.studentCode(), "Student code is required");
        }
        if (blank(row.fullName())) {
            return new RowValidation("fullName", row.fullName(), "Full name is required");
        }
        if (!blank(row.academicYear())) {
            try {
                Integer.parseInt(row.academicYear().trim());
            } catch (NumberFormatException exception) {
                return new RowValidation("academicYear", row.academicYear(), "Academic year must be a number");
            }
        }
        return new RowValidation(null, null, null);
    }

    private String normalizeRosterStatus(String value) {
        if (blank(value)) {
            return "ACTIVE";
        }
        return switch (value.trim().toUpperCase(Locale.ROOT)) {
            case "INACTIVE", "GRADUATED", "SUSPENDED" -> value.trim().toUpperCase(Locale.ROOT);
            default -> "ACTIVE";
        };
    }

    private Integer parseAcademicYear(String value) {
        return blank(value) ? null : Integer.parseInt(value.trim());
    }

    private String column(String[] columns, int index) {
        return index >= columns.length ? null : columns[index];
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String value) {
        return blank(value) ? null : value.trim().toLowerCase(Locale.ROOT);
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

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private record RosterRow(int rowNumber, String email, String studentCode, String fullName, String faculty,
            String academicYear, String status) {
    }

    private record RowValidation(String fieldName, String rawValue, String errorMessage) {
    }
}
