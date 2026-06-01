package com.unibus.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.unibus.api.auth.model.LoginSession;
import com.unibus.api.auth.model.VerificationCode;
import com.unibus.api.auth.model.VerificationPurpose;
import com.unibus.api.common.ApiException;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
class AuthEdgeCaseIntegrationTests {

    private static final Pattern JSON_STRING_PATTERN_TEMPLATE = Pattern.compile("\"%s\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;

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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanDatabase() {
        loginSessionRepository.deleteAll();
        verificationCodeRepository.deleteAll();
        studentRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registrationOtpIsIssuedForNewEmailAndRejectedForExistingEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"NEW.STUDENT@example.com\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true));

        VerificationCode issuedCode = verificationCodeRepository.findAll().getFirst();
        assertThat(issuedCode.getEmail()).isEqualTo("new.student@example.com");
        assertThat(issuedCode.getPurpose()).isEqualTo(VerificationPurpose.REGISTER);
        assertThat(issuedCode.getConsumedAt()).isNull();

        createUser("used@example.com", "password123", UserStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/auth/register/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"USED@example.com\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email is already registered"));
    }

    @Test
    void registerRejectsInvalidPayloadBeforeCreatingUser() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "not-an-email",
                                  "otp": "12345",
                                  "password": "short",
                                  "fullName": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.email").exists())
                .andExpect(jsonPath("$.data.otp").exists())
                .andExpect(jsonPath("$.data.password").exists())
                .andExpect(jsonPath("$.data.fullName").exists());

        assertThat(userRepository.count()).isZero();
    }

    @Test
    void registerRejectsMissingExpiredWrongPurposeAndWrongOtp() throws Exception {
        postRegister("missing@example.com", "123456", "password123", "Missing OTP")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is invalid or expired"));

        saveOtp("expired@example.com", VerificationPurpose.REGISTER, "123456",
                OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(20),
                OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(10));
        postRegister("expired@example.com", "123456", "password123", "Expired OTP")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is invalid or expired"));

        saveOtp("wrong-purpose@example.com", VerificationPurpose.RESET_PASSWORD, "123456");
        postRegister("wrong-purpose@example.com", "123456", "password123", "Wrong Purpose")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is invalid or expired"));

        saveOtp("wrong-code@example.com", VerificationPurpose.REGISTER, "123456");
        postRegister("wrong-code@example.com", "000000", "password123", "Wrong Code")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is invalid or expired"));

        assertThat(userRepository.count()).isZero();
    }

    @Test
    void registerConsumesOtpNormalizesEmailTrimsNameAndPreventsOtpReuse() throws Exception {
        VerificationCode code = saveOtp("Mixed.Email@example.com", VerificationPurpose.REGISTER, "123456");

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "MIXED.EMAIL@example.com",
                                  "otp": "123456",
                                  "password": "password123",
                                  "fullName": "  Student Name  "
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.userId").isNumber())
                .andExpect(jsonPath("$.data.email").value("mixed.email@example.com"))
                .andExpect(jsonPath("$.data.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.studentVerificationStatus").value("NOT_SUBMITTED"))
                .andReturn();

        assertThat(registerResult.getResponse().getContentAsString()).contains("\"userId\"");
        User user = userRepository.findByEmailIgnoreCase("mixed.email@example.com").orElseThrow();
        assertThat(user.getFullName()).isEqualTo("Student Name");
        assertThat(user.getPasswordHash()).isNotEqualTo("password123");
        assertThat(passwordEncoder.matches("password123", user.getPasswordHash())).isTrue();
        assertThat(user.getEmailVerifiedAt()).isNotNull();

        VerificationCode consumedCode = verificationCodeRepository.findById(code.getId()).orElseThrow();
        assertThat(consumedCode.getConsumedAt()).isNotNull();
        assertThat(consumedCode.getAttemptCount()).isEqualTo(1);

        userRepository.deleteAll();

        postRegister("mixed.email@example.com", "123456", "password123", "Student Name")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is invalid or expired"));
        assertThat(userRepository.count()).isZero();
    }

    @Test
    void registerAndRegistrationOtpRejectDuplicateEmailCaseInsensitively() throws Exception {
        saveOtp("duplicate@example.com", VerificationPurpose.REGISTER, "123456");
        postRegister("duplicate@example.com", "123456", "password123", "First Student")
                .andExpect(status().isCreated());

        saveOtp("DUPLICATE@example.com", VerificationPurpose.REGISTER, "654321");
        postRegister("DUPLICATE@example.com", "654321", "password123", "Second Student")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email is already registered"));

        mockMvc.perform(post("/api/v1/auth/register/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"DUPLICATE@example.com\"}"))
                .andExpect(status().isConflict());

        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    void loginCreatesSessionForCaseInsensitiveEmailAndRejectsBadCredentials() throws Exception {
        createUser("login@example.com", "password123", UserStatus.ACTIVE);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "LOGIN@example.com",
                                  "password": "password123",
                                  "device": "web"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.studentVerificationStatus").value("NOT_SUBMITTED"))
                .andReturn();

        JwtTokenService.TokenClaims accessClaims = jwtTokenService.parseAccessToken(jsonValue(loginResult, "accessToken"));
        JwtTokenService.TokenClaims refreshClaims = jwtTokenService.parseRefreshToken(jsonValue(loginResult, "refreshToken"));
        assertThat(accessClaims.type()).isEqualTo("access");
        assertThat(refreshClaims.type()).isEqualTo("refresh");
        LoginSession session = loginSessionRepository.findByIdAndActiveTrue(accessClaims.sessionId()).orElseThrow();
        assertThat(session.getDevice()).isEqualTo("web");
        assertThat(session.getIpAddress()).isNotBlank();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"missing@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email or password is incorrect"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginRejectsLockedAndOauthOnlyAccounts() throws Exception {
        createUser("locked@example.com", "password123", UserStatus.LOCKED);
        createUserWithoutPassword("google-only@example.com", UserStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"locked@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is locked"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"google-only@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email or password is incorrect"));
    }

    @Test
    void refreshRotatesRefreshTokenAndRejectsReusedOrMalformedToken() throws Exception {
        createUser("refresh@example.com", "password123", UserStatus.ACTIVE);
        MvcResult loginResult = login("refresh@example.com", "password123");
        String firstRefreshToken = jsonValue(loginResult, "refreshToken");

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + firstRefreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andReturn();

        String rotatedRefreshToken = jsonValue(refreshResult, "refreshToken");
        assertThat(rotatedRefreshToken).isNotEqualTo(firstRefreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + firstRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired refresh token"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"not-a-jwt\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired token"));
    }

    @Test
    void logoutRequiresAuthenticationAndInvalidatesAccessAndRefreshTokens() throws Exception {
        createUser("logout@example.com", "password123", UserStatus.ACTIVE);
        MvcResult loginResult = login("logout@example.com", "password123");
        String accessToken = jsonValue(loginResult, "accessToken");
        String refreshToken = jsonValue(loginResult, "refreshToken");
        Long sessionId = jwtTokenService.parseAccessToken(accessToken).sessionId();

        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logout successful"));

        assertThat(loginSessionRepository.findByIdAndActiveTrue(sessionId)).isEmpty();
        assertThat(loginSessionRepository.findById(sessionId).orElseThrow().getSignedOutAt()).isNotNull();

        mockMvc.perform(get("/api/v1/students/me/profile")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Session is no longer active"));
    }

    @Test
    void forgotPasswordIsEnumerationSafeAndResetChangesPasswordAndRevokesSessions() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"unknown@example.com\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("If the email exists, an OTP has been issued"));
        assertThat(verificationCodeRepository.count()).isZero();

        createUser("reset@example.com", "old-password1", UserStatus.ACTIVE);
        MvcResult loginResult = login("reset@example.com", "old-password1");
        String oldAccessToken = jsonValue(loginResult, "accessToken");
        Long oldSessionId = jwtTokenService.parseAccessToken(oldAccessToken).sessionId();

        mockMvc.perform(post("/api/v1/auth/forgot-password/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reset@example.com\"}"))
                .andExpect(status().isAccepted());
        assertThat(verificationCodeRepository.findAll())
                .anySatisfy(code -> assertThat(code.getPurpose()).isEqualTo(VerificationPurpose.RESET_PASSWORD));

        saveOtp("reset@example.com", VerificationPurpose.RESET_PASSWORD, "999999");
        mockMvc.perform(post("/api/v1/auth/forgot-password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "reset@example.com",
                                  "otp": "999999",
                                  "newPassword": "new-password2"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));

        assertThat(loginSessionRepository.findByIdAndActiveTrue(oldSessionId)).isEmpty();
        mockMvc.perform(get("/api/v1/students/me/profile")
                        .header("Authorization", "Bearer " + oldAccessToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reset@example.com\",\"password\":\"old-password1\"}"))
                .andExpect(status().isUnauthorized());

        login("reset@example.com", "new-password2")
                .getResponse()
                .getContentAsString();
    }

    @Test
    void forgotPasswordResetRejectsInvalidPayloadWrongPurposeAndWrongOtp() throws Exception {
        createUser("reset-invalid@example.com", "old-password1", UserStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/auth/forgot-password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "reset-invalid@example.com",
                                  "otp": "12345",
                                  "newPassword": "short"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.otp").exists())
                .andExpect(jsonPath("$.data.newPassword").exists());

        saveOtp("reset-invalid@example.com", VerificationPurpose.REGISTER, "123456");
        mockMvc.perform(post("/api/v1/auth/forgot-password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "reset-invalid@example.com",
                                  "otp": "123456",
                                  "newPassword": "new-password2"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is invalid or expired"));

        saveOtp("reset-invalid@example.com", VerificationPurpose.RESET_PASSWORD, "123456");
        mockMvc.perform(post("/api/v1/auth/forgot-password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "reset-invalid@example.com",
                                  "otp": "000000",
                                  "newPassword": "new-password2"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is invalid or expired"));
    }

    @Test
    void otpVerificationUsesLatestCodeAndLocksAfterMaximumAttempts() {
        saveOtp("latest@example.com", VerificationPurpose.REGISTER, "111111",
                OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1),
                OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(9));
        saveOtp("latest@example.com", VerificationPurpose.REGISTER, "222222");

        assertThatThrownBy(() -> otpService.verify("latest@example.com", VerificationPurpose.REGISTER, "111111"))
                .isInstanceOf(ApiException.class);
        otpService.verify("latest@example.com", VerificationPurpose.REGISTER, "222222");

        VerificationCode lockedCode = saveOtp("locked-otp@example.com", VerificationPurpose.REGISTER, "123456");
        for (int attempt = 0; attempt < 5; attempt++) {
            assertThatThrownBy(() -> otpService.verify("locked-otp@example.com", VerificationPurpose.REGISTER, "000000"))
                    .isInstanceOf(ApiException.class);
        }

        assertThatThrownBy(() -> otpService.verify("locked-otp@example.com", VerificationPurpose.REGISTER, "123456"))
                .isInstanceOf(ApiException.class);
        assertThat(verificationCodeRepository.findById(lockedCode.getId()).orElseThrow().getAttemptCount())
                .isEqualTo(6);
    }

    @Test
    void googleOAuthEndpointFailsCleanlyWhenGoogleClientIsNotConfigured() throws Exception {
        mockMvc.perform(post("/api/v1/auth/oauth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"fake-token\",\"device\":\"web\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("Google OAuth is not configured"));

        assertThat(userRepository.count()).isZero();
        assertThat(loginSessionRepository.count()).isZero();
    }

    private org.springframework.test.web.servlet.ResultActions postRegister(
            String email,
            String otp,
            String password,
            String fullName) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "email": "%s",
                          "otp": "%s",
                          "password": "%s",
                          "fullName": "%s"
                        }
                        """.formatted(email, otp, password, fullName)));
    }

    private MvcResult login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s",
                                  "device": "test-client"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
    }

    private VerificationCode saveOtp(String email, VerificationPurpose purpose, String rawCode) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return saveOtp(email, purpose, rawCode, now, now.plusMinutes(10));
    }

    private VerificationCode saveOtp(
            String email,
            VerificationPurpose purpose,
            String rawCode,
            OffsetDateTime createdAt,
            OffsetDateTime expiresAt) {
        VerificationCode code = new VerificationCode();
        code.setEmail(email.trim().toLowerCase());
        code.setPurpose(purpose);
        code.setCodeHash(hashingService.hash(rawCode));
        code.setCreatedAt(createdAt);
        code.setExpiresAt(expiresAt);
        return verificationCodeRepository.save(code);
    }

    private User createUser(String email, String password, UserStatus status) {
        User user = baseUser(email, status);
        user.setPasswordHash(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    private User createUserWithoutPassword(String email, UserStatus status) {
        User user = baseUser(email, status);
        user.setPasswordHash(null);
        return userRepository.save(user);
    }

    private User baseUser(String email, UserStatus status) {
        User user = new User();
        user.setEmail(email.trim().toLowerCase());
        user.setFullName("Test Student");
        user.setRole(UserRole.STUDENT);
        user.setStatus(status);
        user.setStudentVerificationStatus(StudentVerificationStatus.NOT_SUBMITTED);
        user.setEmailVerifiedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return user;
    }

    private String jsonValue(MvcResult result, String field) throws Exception {
        Pattern pattern = Pattern.compile(JSON_STRING_PATTERN_TEMPLATE.pattern().formatted(Pattern.quote(field)));
        Matcher matcher = pattern.matcher(result.getResponse().getContentAsString());
        assertThat(matcher.find()).as("JSON field %s exists", field).isTrue();
        return matcher.group(1);
    }
}
