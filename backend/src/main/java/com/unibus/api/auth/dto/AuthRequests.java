package com.unibus.api.auth.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthRequests {

    private AuthRequests() {
    }

    public record OtpRequest(@NotBlank @Email String email) {
    }

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 6) String otp,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 100) String fullName,
            @Size(max = 20) String studentCode,
            @Size(max = 150) String university,
            @Size(max = 100) String faculty,
            Integer academicYear,
            LocalDate dateOfBirth) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password,
            @Size(max = 200) String device) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record GoogleLoginRequest(
            String idToken,
            String accessToken,
            @Size(max = 200) String device) {
    }

    public record ResetPasswordRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 6) String otp,
            @NotBlank @Size(min = 8, max = 100) String newPassword) {
    }
}
