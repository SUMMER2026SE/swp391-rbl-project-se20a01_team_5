package com.unibus.api.admin;

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

import com.unibus.api.admin.AdminUserDtos.CreateStaffUserRequest;
import com.unibus.api.admin.AdminUserDtos.PageResponse;
import com.unibus.api.admin.AdminUserDtos.UpdateUserStatusRequest;
import com.unibus.api.admin.AdminUserDtos.UserView;
import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    ApiResponse<PageResponse<UserView>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // SRS REQ-ADM-004 AC2: phân trang 20 kết quả/trang (mặc định)
        return ApiResponse.ok("Users retrieved",
                adminUserService.listPaged(keyword, role, status, page, size));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<UserView> get(@PathVariable Integer userId) {
        return ApiResponse.ok("User retrieved", adminUserService.get(userId));
    }

    @PutMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<UserView> updateStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ApiResponse.ok("User status updated", adminUserService.updateStatus(currentUser, userId, request));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<UserView> create(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateStaffUserRequest request) {
        return ApiResponse.ok("User created", adminUserService.create(currentUser, request));
    }
}
