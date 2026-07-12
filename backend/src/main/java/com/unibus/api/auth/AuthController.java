package com.unibus.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.auth.dto.AuthRequests.LoginRequest;
import com.unibus.api.auth.dto.AuthRequests.GoogleLoginRequest;
import com.unibus.api.auth.dto.AuthRequests.OtpRequest;
import com.unibus.api.auth.dto.AuthRequests.RefreshRequest;
import com.unibus.api.auth.dto.AuthRequests.RegisterRequest;
import com.unibus.api.auth.dto.AuthRequests.ResetPasswordRequest;
import com.unibus.api.auth.dto.AuthRequests.VerifyOtpRequest;
import com.unibus.api.auth.dto.AuthResponses.RegisteredUser;
import com.unibus.api.auth.dto.AuthResponses.TokenPair;
import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@Validated
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/otp")
    ResponseEntity<ApiResponse<Void>> requestRegistrationOtp(@Valid @RequestBody OtpRequest request) {
        authService.requestRegistrationOtp(request.email());
        return ResponseEntity.accepted().body(ApiResponse.ok("OTP has been issued", null));
    }

    @PostMapping("/register")
    ResponseEntity<ApiResponse<RegisteredUser>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Student account created", authService.register(request)));
    }

    @PostMapping("/login")
    ApiResponse<TokenPair> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        return ApiResponse.ok("Login successful", authService.login(request, servletRequest.getRemoteAddr()));
    }

    @PostMapping("/oauth/google")
    ApiResponse<TokenPair> googleLogin(
            @Valid @RequestBody GoogleLoginRequest request,
            HttpServletRequest servletRequest) {
        return ApiResponse.ok(
                "Google login successful",
                authService.loginWithGoogle(
                        request.idToken(),
                        request.accessToken(),
                        request.device(),
                        servletRequest.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    ApiResponse<TokenPair> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok("Token refreshed", authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@AuthenticationPrincipal CurrentUser currentUser) {
        authService.logout(currentUser);
        return ApiResponse.ok("Logout successful", null);
    }

    @PostMapping("/forgot-password/otp")
    ResponseEntity<ApiResponse<Void>> requestPasswordResetOtp(@Valid @RequestBody OtpRequest request) {
        authService.requestPasswordResetOtp(request.email());
        return ResponseEntity.accepted()
                .body(ApiResponse.ok("If the email exists, an OTP has been issued", null));
    }

    @PostMapping("/forgot-password/verify")
    ApiResponse<Void> verifyPasswordResetOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyPasswordResetOtp(request.email(), request.otp());
        return ApiResponse.ok("OTP verified", null);
    }

    @PostMapping("/forgot-password/reset")
    ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Password reset successful", null);
    }
}
