package com.unibus.api.auth.dto;

import java.time.OffsetDateTime;

import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.model.UserRole;

public final class AuthResponses {

    private AuthResponses() {
    }

    public record RegisteredUser(
            Integer userId,
            String studentCode,
            String email,
            UserRole role,
            StudentVerificationStatus studentVerificationStatus) {
    }

    public record TokenPair(
            String tokenType,
            String accessToken,
            OffsetDateTime accessTokenExpiresAt,
            String refreshToken,
            OffsetDateTime refreshTokenExpiresAt,
            UserRole role,
            StudentVerificationStatus studentVerificationStatus) {
    }
}
