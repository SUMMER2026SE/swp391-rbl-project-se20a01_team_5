package com.unibus.api.user.dto;

import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

import jakarta.validation.constraints.Email;
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
            StudentVerificationStatus studentVerificationStatus) {
    }

    public record UpdateUserProfileRequest(
            @Email @Size(max = 100) String email,
            @Size(max = 100) String fullName,
            @Size(max = 15) String phoneNumber,
            @Size(max = 255) String address,
            @Size(max = 500) String avatarUrl) {
    }
}
