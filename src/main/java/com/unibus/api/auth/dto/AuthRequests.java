package com.unibus.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class AuthRequests {
   private AuthRequests() {
   }

   public static record OtpRequest(@NotBlank @Email String email) {
   }

   public static record RegisterRequest(@NotBlank @Email String email, @NotBlank @Size(
   min = 6,
   max = 6
) String otp, @NotBlank @Size(
   min = 8,
   max = 100
) String password, @NotBlank @Size(
   max = 100
) String fullName, @NotBlank @Size(
   max = 20
) String studentCode, @NotBlank @Size(
   max = 150
) String university, @Size(
   max = 100
) String faculty, Integer academicYear, LocalDate dateOfBirth) {
   }

   public static record LoginRequest(@NotBlank @Email String email, @NotBlank String password, @Size(
   max = 200
) String device) {
   }

   public static record RefreshRequest(@NotBlank String refreshToken) {
   }

   public static record ResetPasswordRequest(@NotBlank @Email String email, @NotBlank @Size(
   min = 6,
   max = 6
) String otp, @NotBlank @Size(
   min = 8,
   max = 100
) String newPassword) {
   }
}
