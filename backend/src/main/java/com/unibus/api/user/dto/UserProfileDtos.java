package com.unibus.api.user.dto;

import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UserProfileDtos {

    private UserProfileDtos() {
    }

    public record UserProfile(
            Integer userId,
            String email,
            String fullName,
            String phoneNumber,
            String address,
            String avatarUrl,
            UserRole role,
            UserStatus status,
            StudentVerificationStatus studentVerificationStatus,
            boolean hasPassword) {
    }

    public record UpdateUserProfileRequest(
            @Email @Size(max = 100) String email,
            @Size(max = 100) String fullName,
            @Size(max = 15) String phoneNumber,
            @Size(max = 255) String address,
            @Size(max = 500) String avatarUrl) {
    }

    public record ChangePasswordRequest(
            String currentPassword,
            @NotBlank
            @Size(min = 8, max = 72)
            @Pattern(regexp = ".*[A-Za-z].*", message = "New password must include a letter")
            @Pattern(regexp = ".*\\d.*", message = "New password must include a number")
            String newPassword,
            @NotBlank String confirmPassword) {
    }
}
