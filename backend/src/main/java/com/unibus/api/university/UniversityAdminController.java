package com.unibus.api.university;

import java.time.LocalDate;
import java.util.List;

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
import com.unibus.api.university.UniversityDtos.ReconciliationView;
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
            @RequestParam(required = false) String status) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster retrieved", service.listRoster(universityId, keyword, status));
    }

    @PostMapping("/roster/import")
    ApiResponse<ImportBatchView> importRoster(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestPart("file") MultipartFile file) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster imported", service.importRoster(currentUser, universityId, file));
    }

    @GetMapping("/roster/import")
    ApiResponse<List<ImportBatchView>> importBatches(@AuthenticationPrincipal CurrentUser currentUser) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Roster import batches retrieved", service.listImportBatches(universityId));
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

    @PostMapping("/notifications")
    ApiResponse<Integer> notify(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateUniversityNotificationRequest request) {
        Integer universityId = service.requireUniversityAdmin(currentUser).universityId();
        return ApiResponse.ok("Notification sent", service.notifyUniversity(currentUser, universityId, request));
    }
}
