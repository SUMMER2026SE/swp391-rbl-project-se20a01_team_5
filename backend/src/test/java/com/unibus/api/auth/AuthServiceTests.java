package com.unibus.api.auth;

import com.unibus.api.auth.dto.AuthRequests;
import com.unibus.api.auth.dto.AuthResponses;
import com.unibus.api.auth.model.VerificationCode;
import com.unibus.api.auth.model.VerificationPurpose;
import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.UserRole;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.assertj.core.api.AbstractThrowableAssert;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;

@SpringBootTest
@DirtiesContext(
   classMode = ClassMode.AFTER_CLASS
)
class AuthServiceTests {
   @Autowired
   private AuthService authService;
   @Autowired
   private OtpService otpService;
   @Autowired
   private HashingService hashingService;
   @Autowired
   private JwtTokenService jwtTokenService;
   @Autowired
   private VerificationCodeRepository verificationCodeRepository;
   @Autowired
   private LoginSessionRepository loginSessionRepository;
   @Autowired
   private StudentRepository studentRepository;
   @Autowired
   private UserRepository userRepository;

   @BeforeEach
   void cleanDatabase() {
      this.loginSessionRepository.deleteAll();
      this.verificationCodeRepository.deleteAll();
      this.studentRepository.deleteAll();
      this.userRepository.deleteAll();
   }

   @Test
   void registerLoginAndLogoutMaintainsSessionState() {
      this.saveOtp("student@example.com", VerificationPurpose.REGISTER, "123456");
      AuthResponses.RegisteredUser registered = this.authService.register(new AuthRequests.RegisterRequest("student@example.com", "123456", "strong-password", "Student A", "SE001", "UniBus University", (String)null, (Integer)null, (LocalDate)null));
      Assertions.assertThat(registered.role()).isEqualTo(UserRole.STUDENT);
      AuthResponses.TokenPair tokenPair = this.authService.login(new AuthRequests.LoginRequest("student@example.com", "strong-password", "integration-test"), "127.0.0.1");
      JwtTokenService.TokenClaims claims = this.jwtTokenService.parseAccessToken(tokenPair.accessToken());
      Assertions.assertThat(claims.userId()).isEqualTo(registered.userId());
      Assertions.assertThat(this.loginSessionRepository.findByIdAndActiveTrue(claims.sessionId())).isPresent();
      this.authService.logout(new CurrentUser(claims.userId(), registered.email(), registered.role(), claims.sessionId()));
      Assertions.assertThat(this.loginSessionRepository.findByIdAndActiveTrue(claims.sessionId())).isEmpty();
   }

   @Test
   void invalidOtpIncrementsAttempts() {
      VerificationCode code = this.saveOtp("student@example.com", VerificationPurpose.REGISTER, "123456");
      ((AbstractThrowableAssert)Assertions.assertThatThrownBy(() -> this.otpService.verify("student@example.com", VerificationPurpose.REGISTER, "000000")).isInstanceOf(ApiException.class)).extracting((exception) -> ((ApiException)exception).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
      Assertions.assertThat(((VerificationCode)this.verificationCodeRepository.findById(code.getId()).orElseThrow()).getAttemptCount()).isEqualTo(1);
   }

   private VerificationCode saveOtp(String email, VerificationPurpose purpose, String value) {
      OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
      VerificationCode code = new VerificationCode();
      code.setEmail(email);
      code.setPurpose(purpose);
      code.setCodeHash(this.hashingService.hash(value));
      code.setCreatedAt(now);
      code.setExpiresAt(now.plusMinutes(10L));
      return (VerificationCode)this.verificationCodeRepository.save(code);
   }
}
