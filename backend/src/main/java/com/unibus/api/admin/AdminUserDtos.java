package com.unibus.api.admin;

import java.time.OffsetDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AdminUserDtos {

    private AdminUserDtos() {
    }

    public record UserView(
            Integer userId,
            String email,
            String fullName,
            String phoneNumber,
            String role,
            String status,
            String lockReason,
            String staffCode,
            String licenseNumber,
            OffsetDateTime createdAt) {
    }

    public record UpdateUserStatusRequest(
            @NotBlank @Pattern(regexp = "ACTIVE|LOCKED") String status,
            @Size(max = 500) String lockReason) {
    }

    public record CreateStaffUserRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 100) String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @Pattern(regexp = "DRIVER|CONDUCTOR|DISPATCHER|ADMIN") String role,
            @Size(max = 20) String employeeCode,
            @Size(max = 50) String licenseNumber,
            @Size(max = 15) String phoneNumber) {
    }
}
