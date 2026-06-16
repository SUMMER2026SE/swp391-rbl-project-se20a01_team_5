package com.unibus.api.admin;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.admin.AdminDtos.AdminCaseSummary;
import com.unibus.api.admin.AdminDtos.AdminNote;
import com.unibus.api.admin.AdminDtos.AdminNoteRequest;
import com.unibus.api.admin.AdminDtos.AdminUserSummary;
import com.unibus.api.admin.AdminDtos.BroadcastNotificationRequest;
import com.unibus.api.admin.AdminDtos.BroadcastNotificationResult;
import com.unibus.api.admin.AdminDtos.CreateStaffAccountRequest;
import com.unibus.api.admin.AdminDtos.DashboardSummary;
import com.unibus.api.admin.AdminDtos.FareSummary;
import com.unibus.api.admin.AdminDtos.FareUpdateRequest;
import com.unibus.api.admin.AdminDtos.RoutePricingOption;
import com.unibus.api.admin.AdminDtos.UpdateCaseStatusRequest;
import com.unibus.api.admin.AdminDtos.UpdateUserStatusRequest;
import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    ApiResponse<List<AdminUserSummary>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status) {
        return ApiResponse.ok("Users retrieved", adminService.getUsers(search, role, status));
    }

    @GetMapping("/users/{id}")
    ApiResponse<AdminUserSummary> getUser(@PathVariable Integer id) {
        return ApiResponse.ok("User retrieved", adminService.getUser(id));
    }

    @PostMapping("/users")
    ApiResponse<AdminUserSummary> createStaffAccount(@Valid @RequestBody CreateStaffAccountRequest request) {
        return ApiResponse.ok("User created", adminService.createStaffAccount(request));
    }

    @PutMapping("/users/{id}/status")
    ApiResponse<AdminUserSummary> updateUserStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ApiResponse.ok("User status updated", adminService.updateUserStatus(id, request));
    }

    @GetMapping("/reports")
    ApiResponse<List<AdminCaseSummary>> getCases(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        return ApiResponse.ok("Cases retrieved", adminService.getCases(status, type, search));
    }

    @GetMapping("/reports/{id}")
    ApiResponse<AdminCaseSummary> getCase(@PathVariable Integer id) {
        return ApiResponse.ok("Case retrieved", adminService.getCase(id));
    }

    @PutMapping("/reports/{id}/status")
    ApiResponse<AdminCaseSummary> updateCaseStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateCaseStatusRequest request,
            @AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Case status updated", adminService.updateCaseStatus(id, request, currentUser.userId()));
    }

    @GetMapping("/reports/{id}/notes")
    ApiResponse<List<AdminNote>> getCaseNotes(@PathVariable Integer id) {
        return ApiResponse.ok("Case notes retrieved", adminService.getCaseNotes(id));
    }

    @PostMapping("/reports/{id}/notes")
    ApiResponse<AdminNote> addCaseNote(
            @PathVariable Integer id,
            @Valid @RequestBody AdminNoteRequest request,
            @AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Case note created", adminService.addCaseNote(id, request, currentUser.userId()));
    }

    @GetMapping("/dashboard")
    ApiResponse<DashboardSummary> getDashboard() {
        return ApiResponse.ok("Dashboard retrieved", adminService.getDashboard());
    }

    @GetMapping("/routes/pricing-options")
    ApiResponse<List<RoutePricingOption>> getRoutePricingOptions() {
        return ApiResponse.ok("Route pricing options retrieved", adminService.getRoutePricingOptions());
    }

    @GetMapping("/fares")
    ApiResponse<List<FareSummary>> getCurrentFares() {
        return ApiResponse.ok("Fares retrieved", adminService.getCurrentFares());
    }

    @PostMapping("/fares")
    ApiResponse<List<FareSummary>> updateFare(
            @Valid @RequestBody FareUpdateRequest request,
            @AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Fare updated", adminService.updateFare(request, currentUser.userId()));
    }

    @PostMapping("/notifications")
    ApiResponse<BroadcastNotificationResult> broadcast(
            @Valid @RequestBody BroadcastNotificationRequest request,
            @AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Notification broadcasted", adminService.broadcast(request, currentUser.userId()));
    }
}
