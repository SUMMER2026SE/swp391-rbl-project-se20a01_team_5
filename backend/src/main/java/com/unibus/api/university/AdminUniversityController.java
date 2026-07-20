package com.unibus.api.university;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.university.UniversityDtos.AuditLogView;
import com.unibus.api.university.UniversityDtos.CampusView;
import com.unibus.api.university.UniversityDtos.CreateCampusRequest;
import com.unibus.api.university.UniversityDtos.CreateDomainRequest;
import com.unibus.api.university.UniversityDtos.CreateRouteUniversityRequest;
import com.unibus.api.university.UniversityDtos.CreateSubsidyPolicyRequest;
import com.unibus.api.university.UniversityDtos.CreateUniversityAdminRequest;
import com.unibus.api.university.UniversityDtos.CreateUniversityRequest;
import com.unibus.api.university.UniversityDtos.DomainView;
import com.unibus.api.university.UniversityDtos.PaymentTransactionView;
import com.unibus.api.university.UniversityDtos.ReportExportAuditRequest;
import com.unibus.api.university.UniversityDtos.RouteUniversityView;
import com.unibus.api.university.UniversityDtos.SubsidyPolicyView;
import com.unibus.api.university.UniversityDtos.UniversityAdminView;
import com.unibus.api.university.UniversityDtos.UniversityView;
import com.unibus.api.university.UniversityDtos.UpdateStatusRequest;
import com.unibus.api.university.UniversityDtos.UpdateUniversityRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUniversityController {

    private final UniversityManagementService service;

    public AdminUniversityController(UniversityManagementService service) {
        this.service = service;
    }

    @GetMapping("/universities")
    ApiResponse<List<UniversityView>> listUniversities(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ApiResponse.ok("Universities retrieved", service.listUniversities(keyword, status));
    }

    @PostMapping("/universities")
    ApiResponse<UniversityView> createUniversity(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateUniversityRequest request) {
        return ApiResponse.ok("University created", service.createUniversity(currentUser, request));
    }

    @PatchMapping("/universities/{universityId}")
    ApiResponse<UniversityView> updateUniversity(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer universityId,
            @Valid @RequestBody UpdateUniversityRequest request) {
        return ApiResponse.ok("University updated", service.updateUniversity(currentUser, universityId, request));
    }

    @DeleteMapping("/universities/{universityId}")
    ApiResponse<Void> deleteUniversity(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer universityId) {
        service.deleteUniversity(currentUser, universityId);
        return ApiResponse.ok("University deleted", null);
    }

    @GetMapping("/universities/{universityId}/campuses")
    ApiResponse<List<CampusView>> listCampuses(@PathVariable Integer universityId) {
        return ApiResponse.ok("Campuses retrieved", service.listCampuses(universityId));
    }

    @PostMapping("/universities/{universityId}/campuses")
    ApiResponse<CampusView> createCampus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer universityId,
            @Valid @RequestBody CreateCampusRequest request) {
        return ApiResponse.ok("Campus created", service.createCampus(currentUser, universityId, request));
    }

    @GetMapping("/universities/{universityId}/domains")
    ApiResponse<List<DomainView>> listDomains(@PathVariable Integer universityId) {
        return ApiResponse.ok("Domains retrieved", service.listDomains(universityId));
    }

    @PostMapping("/universities/{universityId}/domains")
    ApiResponse<DomainView> createDomain(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer universityId,
            @Valid @RequestBody CreateDomainRequest request) {
        return ApiResponse.ok("Domain created", service.createDomain(currentUser, universityId, request));
    }

    @PatchMapping("/universities/{universityId}/domains/{domainId}/status")
    ApiResponse<DomainView> updateDomainStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer universityId,
            @PathVariable Integer domainId,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ApiResponse.ok("Domain status updated",
                service.updateDomainStatus(currentUser, universityId, domainId, request.status()));
    }

    @GetMapping("/university-admins")
    ApiResponse<List<UniversityAdminView>> listUniversityAdmins(@RequestParam(required = false) Integer universityId) {
        return ApiResponse.ok("University admins retrieved", service.listUniversityAdmins(universityId));
    }

    @PostMapping("/university-admins")
    ApiResponse<UniversityAdminView> createUniversityAdmin(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateUniversityAdminRequest request) {
        return ApiResponse.ok("University admin created", service.createUniversityAdmin(currentUser, request));
    }

    @DeleteMapping("/university-admins/{universityAdminId}")
    ApiResponse<Void> deleteUniversityAdmin(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer universityAdminId) {
        service.deleteUniversityAdmin(currentUser, universityAdminId);
        return ApiResponse.ok("University admin deleted", null);
    }

    @GetMapping("/route-universities")
    ApiResponse<List<RouteUniversityView>> listRouteUniversities(@RequestParam(required = false) Integer universityId) {
        return ApiResponse.ok("Route-university links retrieved", service.listRouteUniversities(universityId));
    }

    @PostMapping("/route-universities")
    ApiResponse<RouteUniversityView> createRouteUniversity(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateRouteUniversityRequest request) {
        return ApiResponse.ok("Route-university link created", service.createRouteUniversity(currentUser, request));
    }

    @DeleteMapping("/route-universities/{routeUniversityId}")
    ApiResponse<Void> deleteRouteUniversity(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer routeUniversityId) {
        service.deleteRouteUniversity(currentUser, routeUniversityId);
        return ApiResponse.ok("Route-university link deleted", null);
    }

    @DeleteMapping("/universities/{universityId}/route-universities")
    ApiResponse<Void> deleteRouteUniversitiesForUniversity(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer universityId) {
        service.deleteRouteUniversitiesForUniversity(currentUser, universityId);
        return ApiResponse.ok("Route-university links deleted", null);
    }

    @GetMapping("/subsidy-policies")
    ApiResponse<List<SubsidyPolicyView>> listSubsidyPolicies(@RequestParam(required = false) Integer universityId) {
        return ApiResponse.ok("Subsidy policies retrieved", service.listSubsidyPolicies(universityId));
    }

    @PostMapping("/subsidy-policies")
    ApiResponse<SubsidyPolicyView> createSubsidyPolicy(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateSubsidyPolicyRequest request) {
        return ApiResponse.ok("Subsidy policy created", service.createSubsidyPolicy(currentUser, request));
    }

    @GetMapping("/payment-transactions")
    ApiResponse<List<PaymentTransactionView>> paymentTransactions(
            @RequestParam(required = false) Integer universityId) {
        return ApiResponse.ok("Payment transactions retrieved", service.paymentTransactions(universityId));
    }

    @GetMapping("/audit-logs")
    ApiResponse<List<AuditLogView>> auditLogs(
            @RequestParam(required = false) Integer universityId,
            @RequestParam(required = false) String action) {
        return ApiResponse.ok("Audit logs retrieved", service.auditLogs(universityId, action));
    }

    @PostMapping("/audit-logs/report-export")
    ApiResponse<Void> auditReportExport(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody ReportExportAuditRequest request) {
        service.auditReportExport(currentUser, request);
        return ApiResponse.ok("Report export audited", null);
    }
}
