package com.unibus.api.admin;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.admin.AdminUserDtos.CreateStaffUserRequest;
import com.unibus.api.admin.AdminUserDtos.UpdateUserStatusRequest;
import com.unibus.api.admin.AdminUserDtos.UserView;
import com.unibus.api.common.ApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    ApiResponse<List<UserView>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return ApiResponse.ok("Users retrieved", adminUserService.list(keyword, role, status));
    }

    @GetMapping("/{userId}")
    ApiResponse<UserView> get(@PathVariable Integer userId) {
        return ApiResponse.ok("User retrieved", adminUserService.get(userId));
    }

    @PutMapping("/{userId}/status")
    ApiResponse<UserView> updateStatus(
            @PathVariable Integer userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ApiResponse.ok("User status updated", adminUserService.updateStatus(userId, request));
    }

    @PostMapping
    ApiResponse<UserView> create(@Valid @RequestBody CreateStaffUserRequest request) {
        return ApiResponse.ok("User created", adminUserService.create(request));
    }
}
