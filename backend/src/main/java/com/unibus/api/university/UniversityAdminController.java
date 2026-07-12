package com.unibus.api.university;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.university.UniversityDtos.CampusView;
import com.unibus.api.university.UniversityDtos.CreateCampusRequest;
import com.unibus.api.university.UniversityDtos.CreateDomainRequest;
import com.unibus.api.university.UniversityDtos.CreateScopedSubsidyPolicyRequest;
import com.unibus.api.university.UniversityDtos.CreateUniversityNotificationRequest;
import com.unibus.api.university.UniversityDtos.DomainView;
import com.unibus.api.university.UniversityDtos.ImportBatchView;
import com.unibus.api.university.UniversityDtos.PaymentTransactionView;
import com.unibus.api.university.UniversityDtos.ReconciliationView;
import com.unibus.api.university.UniversityDtos.RosterImportPreviewView;
import com.unibus.api.university.UniversityDtos.RosterImportConfirmRequest;
import com.unibus.api.university.UniversityDtos.RosterImportConfirmView;
import com.unibus.api.university.UniversityDtos.RosterImportCommitRequest;
import com.unibus.api.university.UniversityDtos.RosterStudentView;
import com.unibus.api.university.UniversityDtos.SubsidyPolicyView;
import com.unibus.api.university.UniversityDtos.UniversityAdminView;
import com.unibus.api.university.UniversityDtos.UniversityStatsView;
import com.unibus.api.university.UniversityDtos.UpdateStatusRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/university-admin")
@PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
public class UniversityAdminController {

    private final UniversityManagementService service;

    public UniversityAdminController(UniversityManagementService service) {
        this.service = service;
    }

    @GetMapping("/profile")
    ApiResponse<UniversityAdminView> profile(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("University admin profile retrieved", service.universityAdminProfile(currentUser));
    }

    @GetMapping("/campuses")
    ApiResponse<List<CampusView>> campuses(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Campuses retrieved", service.listCampuses(universityId));
    }

    @PostMapping("/campuses")
    ApiResponse<CampusView> createCampus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateCampusRequest request) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Campus created", service.createCampus(currentUser, universityId, request));
    }

    @GetMapping("/domains")
    ApiResponse<List<DomainView>> domains(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Domains retrieved", service.listDomains(universityId));
    }

    @PostMapping("/domains")
    ApiResponse<DomainView> createDomain(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateDomainRequest request) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Domain created", service.createDomain(currentUser, universityId, request));
    }

    @PatchMapping("/domains/{domainId}/status")
    ApiResponse<DomainView> updateDomainStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer domainId,
            @Valid @RequestBody UpdateStatusRequest request) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Domain status updated",
                service.updateDomainStatus(currentUser, universityId, domainId, request.status()));
    }

    @GetMapping("/roster")
    ApiResponse<List<RosterStudentView>> roster(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long importBatchId) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster retrieved", service.listRoster(universityId, keyword, status, importBatchId));
    }

    @GetMapping("/roster/template")
    ResponseEntity<byte[]> rosterTemplate(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"uniadmin-roster-template.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(service.rosterTemplate(universityId));
    }

    @GetMapping("/roster/export")
    ResponseEntity<byte[]> exportRoster(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "csv") String format) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        UniversityManagementService.RosterExportFile file = service.exportRosterCsv(
                currentUser,
                universityId,
                keyword,
                status,
                format);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.fileName() + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(file.bytes());
    }

    @PostMapping("/roster/import")
    ApiResponse<ImportBatchView> importRoster(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestPart("file") MultipartFile file) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster imported", service.importRoster(currentUser, universityId, file));
    }

    @PostMapping("/roster/import/preview")
    ApiResponse<RosterImportPreviewView> previewRosterImport(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestPart("file") MultipartFile file) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster import preview generated", service.previewRosterImport(currentUser, universityId, file));
    }

    @GetMapping("/roster/import/preview/{previewToken}")
    ApiResponse<RosterImportPreviewView> rosterImportPreview(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String previewToken) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster import preview retrieved",
                service.getRosterImportPreview(currentUser, universityId, previewToken));
    }

    @PostMapping("/roster/import/confirm")
    ApiResponse<RosterImportConfirmView> confirmRosterImport(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody RosterImportConfirmRequest request) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster import confirmation calculated",
                service.confirmRosterImport(currentUser, universityId, request));
    }

    @PostMapping("/roster/import/commit")
    ApiResponse<ImportBatchView> commitRosterImport(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody RosterImportCommitRequest request) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster import committed",
                service.commitRosterImport(currentUser, universityId, request));
    }

    @GetMapping("/roster/import")
    ApiResponse<List<ImportBatchView>> importBatches(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster import batches retrieved", service.listImportBatches(universityId));
    }

    @GetMapping("/roster/import/{importBatchId}")
    ApiResponse<ImportBatchView> importBatch(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long importBatchId) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster import batch retrieved", service.importBatch(universityId, importBatchId));
    }

    @GetMapping("/roster/import/{importBatchId}/report")
    ResponseEntity<byte[]> importBatchReport(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long importBatchId) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        UniversityManagementService.ImportReportFile file = service.importBatchReport(universityId, importBatchId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.fileName() + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(file.bytes());
    }

    @GetMapping("/subsidy-policies")
    ApiResponse<List<SubsidyPolicyView>> subsidyPolicies(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Subsidy policies retrieved", service.listSubsidyPolicies(universityId));
    }

    @PostMapping("/subsidy-policies")
    ApiResponse<SubsidyPolicyView> createSubsidyPolicy(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateScopedSubsidyPolicyRequest request) {
        return ApiResponse.ok("Subsidy policy created", service.createScopedSubsidyPolicy(currentUser, request));
    }

    @GetMapping("/stats")
    ApiResponse<UniversityStatsView> stats(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("University stats retrieved", service.stats(universityId));
    }

    @GetMapping("/reconciliation")
    ApiResponse<ReconciliationView> reconciliation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Reconciliation retrieved", service.reconciliation(universityId, from, to));
    }

    @GetMapping("/payment-transactions")
    ApiResponse<List<PaymentTransactionView>> paymentTransactions(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Payment transactions retrieved", service.paymentTransactions(universityId));
    }

    @PostMapping("/notifications")
    ApiResponse<Integer> notify(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateUniversityNotificationRequest request) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Notification sent", service.notifyUniversity(currentUser, universityId, request));
    }
}
