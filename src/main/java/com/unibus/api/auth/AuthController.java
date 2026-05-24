package com.unibus.api.auth;

import com.unibus.api.auth.dto.AuthRequests;
import com.unibus.api.auth.dto.AuthResponses;
import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/auth"})
@Validated
public class AuthController {
   private final AuthService authService;

   public AuthController(AuthService authService) {
      this.authService = authService;
   }

   @PostMapping({"/register/otp"})
   ResponseEntity<ApiResponse<Void>> requestRegistrationOtp(@RequestBody AuthRequests.@Valid OtpRequest request) {
      this.authService.requestRegistrationOtp(request.email());
      return ResponseEntity.accepted().body(ApiResponse.ok("OTP has been issued", (Void)null));
   }

   @PostMapping({"/register"})
   ResponseEntity<ApiResponse<AuthResponses.RegisteredUser>> register(@RequestBody AuthRequests.@Valid RegisterRequest request) {
      return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Student account created", this.authService.register(request)));
   }

   @PostMapping({"/login"})
   ApiResponse<AuthResponses.TokenPair> login(@RequestBody AuthRequests.@Valid LoginRequest request, HttpServletRequest servletRequest) {
      return ApiResponse.<AuthResponses.TokenPair>ok("Login successful", this.authService.login(request, servletRequest.getRemoteAddr()));
   }

   @PostMapping({"/refresh"})
   ApiResponse<AuthResponses.TokenPair> refresh(@RequestBody AuthRequests.@Valid RefreshRequest request) {
      return ApiResponse.<AuthResponses.TokenPair>ok("Token refreshed", this.authService.refresh(request.refreshToken()));
   }

   @PostMapping({"/logout"})
   ApiResponse<Void> logout(@AuthenticationPrincipal CurrentUser currentUser) {
      this.authService.logout(currentUser);
      return ApiResponse.<Void>ok("Logout successful", (Void)null);
   }

   @PostMapping({"/forgot-password/otp"})
   ResponseEntity<ApiResponse<Void>> requestPasswordResetOtp(@RequestBody AuthRequests.@Valid OtpRequest request) {
      this.authService.requestPasswordResetOtp(request.email());
      return ResponseEntity.accepted().body(ApiResponse.ok("If the email exists, an OTP has been issued", (Void)null));
   }

   @PostMapping({"/forgot-password/reset"})
   ApiResponse<Void> resetPassword(@RequestBody AuthRequests.@Valid ResetPasswordRequest request) {
      this.authService.resetPassword(request);
      return ApiResponse.<Void>ok("Password reset successful", (Void)null);
   }
}
