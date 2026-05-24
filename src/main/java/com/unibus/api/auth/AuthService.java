package com.unibus.api.auth;

import com.unibus.api.auth.dto.AuthRequests;
import com.unibus.api.auth.dto.AuthResponses;
import com.unibus.api.auth.model.LoginSession;
import com.unibus.api.auth.model.VerificationPurpose;
import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
   private final UserRepository userRepository;
   private final StudentRepository studentRepository;
   private final LoginSessionRepository loginSessionRepository;
   private final OtpService otpService;
   private final JwtTokenService jwtTokenService;
   private final HashingService hashingService;
   private final PasswordEncoder passwordEncoder;

   public AuthService(UserRepository userRepository, StudentRepository studentRepository, LoginSessionRepository loginSessionRepository, OtpService otpService, JwtTokenService jwtTokenService, HashingService hashingService, PasswordEncoder passwordEncoder) {
      this.userRepository = userRepository;
      this.studentRepository = studentRepository;
      this.loginSessionRepository = loginSessionRepository;
      this.otpService = otpService;
      this.jwtTokenService = jwtTokenService;
      this.hashingService = hashingService;
      this.passwordEncoder = passwordEncoder;
   }

   public void requestRegistrationOtp(String email) {
      if (this.userRepository.existsByEmailIgnoreCase(this.normalizeEmail(email))) {
         throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
      } else {
         this.otpService.issue(email, VerificationPurpose.REGISTER);
      }
   }

   @Transactional
   public AuthResponses.RegisteredUser register(AuthRequests.RegisterRequest request) {
      String email = this.normalizeEmail(request.email());
      if (this.userRepository.existsByEmailIgnoreCase(email)) {
         throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
      } else if (this.studentRepository.existsById(request.studentCode().trim())) {
         throw new ApiException(HttpStatus.CONFLICT, "Student code is already registered");
      } else {
         this.otpService.verify(email, VerificationPurpose.REGISTER, request.otp());
         OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
         User user = new User();
         user.setEmail(email);
         user.setPasswordHash(this.passwordEncoder.encode(request.password()));
         user.setFullName(request.fullName().trim());
         user.setRole(UserRole.STUDENT);
         user.setStatus(UserStatus.ACTIVE);
         user.setCreatedAt(now);
         this.userRepository.save(user);
         Student student = new Student();
         student.setStudentCode(request.studentCode().trim());
         student.setUser(user);
         student.setUniversity(request.university().trim());
         student.setFaculty(request.faculty());
         student.setAcademicYear(request.academicYear());
         student.setDateOfBirth(request.dateOfBirth());
         this.studentRepository.save(student);
         return new AuthResponses.RegisteredUser(user.getId(), student.getStudentCode(), user.getEmail(), user.getRole());
      }
   }

   @Transactional
   public AuthResponses.TokenPair login(AuthRequests.LoginRequest request, String ipAddress) {
      User user = (User)this.userRepository.findByEmailIgnoreCase(this.normalizeEmail(request.email())).orElseThrow(() -> this.invalidCredentials());
      if (user.getStatus() == UserStatus.LOCKED) {
         throw new ApiException(HttpStatus.FORBIDDEN, "Account is locked");
      } else if (!this.passwordEncoder.matches(request.password(), user.getPasswordHash())) {
         throw this.invalidCredentials();
      } else {
         return this.createSessionTokens(user, request.device(), ipAddress);
      }
   }

   @Transactional
   public AuthResponses.TokenPair refresh(String refreshToken) {
      JwtTokenService.TokenClaims claims = this.jwtTokenService.parseRefreshToken(refreshToken);
      LoginSession session = this.activeSession(claims.sessionId(), claims.userId());
      if (!session.getTokenHash().equals(this.hashingService.hash(refreshToken))) {
         throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
      } else {
         JwtTokenService.IssuedToken access = this.jwtTokenService.issueAccessToken(session.getUser(), session.getId());
         JwtTokenService.IssuedToken refresh = this.jwtTokenService.issueRefreshToken(session.getUser(), session.getId());
         session.setTokenHash(this.hashingService.hash(refresh.value()));
         session.setExpiresAt(refresh.expiresAt());
         this.loginSessionRepository.save(session);
         return new AuthResponses.TokenPair("Bearer", access.value(), access.expiresAt(), refresh.value(), refresh.expiresAt(), session.getUser().getRole());
      }
   }

   @Transactional
   public void logout(CurrentUser currentUser) {
      LoginSession session = this.activeSession(currentUser.sessionId(), currentUser.userId());
      session.setActive(false);
      session.setSignedOutAt(OffsetDateTime.now(ZoneOffset.UTC));
      this.loginSessionRepository.save(session);
   }

   public void requestPasswordResetOtp(String email) {
      this.userRepository.findByEmailIgnoreCase(this.normalizeEmail(email)).ifPresent((user) -> this.otpService.issue(user.getEmail(), VerificationPurpose.RESET_PASSWORD));
   }

   @Transactional
   public void resetPassword(AuthRequests.ResetPasswordRequest request) {
      String email = this.normalizeEmail(request.email());
      this.otpService.verify(email, VerificationPurpose.RESET_PASSWORD, request.otp());
      User user = (User)this.userRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unable to reset password"));
      user.setPasswordHash(this.passwordEncoder.encode(request.newPassword()));
      user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
      this.userRepository.save(user);

      for(LoginSession session : this.loginSessionRepository.findAllByUserIdAndActiveTrue(user.getId())) {
         session.setActive(false);
         session.setSignedOutAt(OffsetDateTime.now(ZoneOffset.UTC));
         this.loginSessionRepository.save(session);
      }

   }

   private AuthResponses.TokenPair createSessionTokens(User user, String device, String ipAddress) {
      OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
      LoginSession session = new LoginSession();
      session.setUser(user);
      session.setTokenHash("pending");
      session.setDevice(device);
      session.setIpAddress(ipAddress);
      session.setSignedInAt(now);
      session.setExpiresAt(now);
      session.setActive(true);
      this.loginSessionRepository.save(session);
      JwtTokenService.IssuedToken access = this.jwtTokenService.issueAccessToken(user, session.getId());
      JwtTokenService.IssuedToken refresh = this.jwtTokenService.issueRefreshToken(user, session.getId());
      session.setTokenHash(this.hashingService.hash(refresh.value()));
      session.setExpiresAt(refresh.expiresAt());
      this.loginSessionRepository.save(session);
      return new AuthResponses.TokenPair("Bearer", access.value(), access.expiresAt(), refresh.value(), refresh.expiresAt(), user.getRole());
   }

   private LoginSession activeSession(Long sessionId, Integer userId) {
      LoginSession session = (LoginSession)this.loginSessionRepository.findByIdAndActiveTrue(sessionId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Session is no longer active"));
      if (session.getUser().getId().equals(userId) && !session.getExpiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
         return session;
      } else {
         throw new ApiException(HttpStatus.UNAUTHORIZED, "Session is no longer active");
      }
   }

   private String normalizeEmail(String email) {
      return email.trim().toLowerCase();
   }

   private ApiException invalidCredentials() {
      return new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
   }
}
