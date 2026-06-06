package com.unibus.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.unibus.api.auth.GoogleOAuthVerifier.GoogleAccount;
import com.unibus.api.auth.model.AuthProvider;
import com.unibus.api.auth.model.UserAuthProvider;
import com.unibus.api.common.ApiException;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

@SpringBootTest
@AutoConfigureMockMvc
@Import(AuthGoogleOAuthIntegrationTests.GoogleOAuthTestConfig.class)
@DirtiesContext(classMode = ClassMode.AFTER_CLASS)
class AuthGoogleOAuthIntegrationTests {

    private static final Pattern JSON_STRING_PATTERN_TEMPLATE = Pattern.compile("\"%s\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private LoginSessionRepository loginSessionRepository;

    @Autowired
    private UserAuthProviderRepository userAuthProviderRepository;

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanDatabase() {
        loginSessionRepository.deleteAll();
        userAuthProviderRepository.deleteAll();
        verificationCodeRepository.deleteAll();
        studentRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void googleLoginCreatesStudentAccountProviderAndSession() throws Exception {
        MvcResult result = postGoogleLogin("new-google")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.studentVerificationStatus").value("NOT_SUBMITTED"))
                .andReturn();

        User user = userRepository.findByEmailIgnoreCase("google.user@example.com").orElseThrow();
        assertThat(user.getPasswordHash()).isNull();
        assertThat(user.getFullName()).isEqualTo("Google User");
        assertThat(user.getAvatarUrl()).isEqualTo("https://avatar.example/user.png");
        assertThat(user.getEmailVerifiedAt()).isNotNull();

        UserAuthProvider provider = userAuthProviderRepository
                .findByUserIdAndProvider(user.getId(), AuthProvider.GOOGLE)
                .orElseThrow();
        assertThat(provider.getProviderUserId()).isEqualTo("google-user-1");
        assertThat(provider.getProviderEmail()).isEqualTo("google.user@example.com");
        assertThat(provider.isProviderEmailVerified()).isTrue();

        JwtTokenService.TokenClaims claims = jwtTokenService.parseAccessToken(jsonValue(result, "accessToken"));
        assertThat(loginSessionRepository.findByIdAndActiveTrue(claims.sessionId())).isPresent();
    }

    @Test
    void googleLoginLinksExistingPasswordAccountByEmail() throws Exception {
        User existingUser = createUser("existing.google@example.com", "password123", UserStatus.ACTIVE);

        postGoogleLogin("existing-google")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("STUDENT"));

        assertThat(userRepository.count()).isEqualTo(1);
        User reloadedUser = userRepository.findById(existingUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("password123", reloadedUser.getPasswordHash())).isTrue();
        assertThat(reloadedUser.getEmailVerifiedAt()).isNotNull();

        UserAuthProvider provider = userAuthProviderRepository
                .findByUserIdAndProvider(existingUser.getId(), AuthProvider.GOOGLE)
                .orElseThrow();
        assertThat(provider.getProviderUserId()).isEqualTo("google-existing");
        assertThat(provider.getProviderEmail()).isEqualTo("existing.google@example.com");
    }

    @Test
    void googleLoginReusesExistingProviderLink() throws Exception {
        postGoogleLogin("existing-google")
                .andExpect(status().isOk());
        User user = userRepository.findByEmailIgnoreCase("existing.google@example.com").orElseThrow();

        postGoogleLogin("existing-google-new-email")
                .andExpect(status().isOk());

        assertThat(userRepository.count()).isEqualTo(1);
        assertThat(userRepository.findById(user.getId()).orElseThrow().getEmail())
                .isEqualTo("existing.google@example.com");
        UserAuthProvider provider = userAuthProviderRepository
                .findByUserIdAndProvider(user.getId(), AuthProvider.GOOGLE)
                .orElseThrow();
        assertThat(provider.getProviderUserId()).isEqualTo("google-existing");
        assertThat(provider.getProviderEmail()).isEqualTo("renamed.google@example.com");
    }

    @Test
    void googleLoginRejectsLockedLinkedAccountAndInvalidToken() throws Exception {
        createUser("locked.google@example.com", "password123", UserStatus.LOCKED);

        postGoogleLogin("locked-google")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is locked"));
        assertThat(loginSessionRepository.count()).isZero();

        postGoogleLogin("invalid-google")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Google token is invalid"));
    }

    private org.springframework.test.web.servlet.ResultActions postGoogleLogin(String token) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/oauth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "idToken": "%s",
                          "device": "web"
                        }
                        """.formatted(token)));
    }

    private User createUser(String email, String password, UserStatus status) {
        User user = new User();
        user.setEmail(email.trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName("Existing Student");
        user.setRole(UserRole.STUDENT);
        user.setStatus(status);
        user.setStudentVerificationStatus(StudentVerificationStatus.NOT_SUBMITTED);
        user.setEmailVerifiedAt(null);
        user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return userRepository.save(user);
    }

    private String jsonValue(MvcResult result, String field) throws Exception {
        Pattern pattern = Pattern.compile(JSON_STRING_PATTERN_TEMPLATE.pattern().formatted(Pattern.quote(field)));
        Matcher matcher = pattern.matcher(result.getResponse().getContentAsString());
        assertThat(matcher.find()).as("JSON field %s exists", field).isTrue();
        return matcher.group(1);
    }

    @TestConfiguration
    static class GoogleOAuthTestConfig {

        @Bean
        @Primary
        GoogleOAuthVerifier googleOAuthVerifier() {
            return new GoogleOAuthVerifier("test-client-id") {
                @Override
                public GoogleAccount verify(String idToken, String accessToken) {
                    return switch (idToken) {
                        case "new-google" -> new GoogleAccount(
                                "google-user-1",
                                "Google.User@example.com",
                                true,
                                "Google User",
                                "https://avatar.example/user.png");
                        case "existing-google" -> new GoogleAccount(
                                "google-existing",
                                "Existing.Google@example.com",
                                true,
                                "Existing Google",
                                "https://avatar.example/existing.png");
                        case "existing-google-new-email" -> new GoogleAccount(
                                "google-existing",
                                "Renamed.Google@example.com",
                                true,
                                "Renamed Google",
                                "https://avatar.example/renamed.png");
                        case "locked-google" -> new GoogleAccount(
                                "google-locked",
                                "locked.google@example.com",
                                true,
                                "Locked Google",
                                "https://avatar.example/locked.png");
                        default -> throw new ApiException(HttpStatus.UNAUTHORIZED, "Google token is invalid");
                    };
                }
            };
        }
    }
}
