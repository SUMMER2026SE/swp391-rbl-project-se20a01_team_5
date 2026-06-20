package com.unibus.api.auth;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.http.HttpStatus;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.auth.JwtTokenService.IssuedToken;
import com.unibus.api.auth.JwtTokenService.TokenClaims;
import com.unibus.api.auth.GoogleOAuthVerifier.GoogleAccount;
import com.unibus.api.auth.dto.AuthRequests.LoginRequest;
import com.unibus.api.auth.dto.AuthRequests.RegisterRequest;
import com.unibus.api.auth.dto.AuthRequests.ResetPasswordRequest;
import com.unibus.api.auth.dto.AuthResponses.RegisteredUser;
import com.unibus.api.auth.dto.AuthResponses.TokenPair;
import com.unibus.api.auth.model.LoginSession;
import com.unibus.api.auth.model.AuthProvider;
import com.unibus.api.auth.model.UserAuthProvider;
import com.unibus.api.auth.model.VerificationPurpose;
import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.university.UniversityDtos.StudentUniversityView;
import com.unibus.api.university.UniversityManagementService;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final LoginSessionRepository loginSessionRepository;
    private final OtpService otpService;
    private final JwtTokenService jwtTokenService;
    private final HashingService hashingService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleOAuthVerifier googleOAuthVerifier;
    private final UniversityManagementService universityManagementService;

    public AuthService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            UserAuthProviderRepository userAuthProviderRepository,
            LoginSessionRepository loginSessionRepository,
            OtpService otpService,
            JwtTokenService jwtTokenService,
            HashingService hashingService,
            PasswordEncoder passwordEncoder,
            GoogleOAuthVerifier googleOAuthVerifier,
            UniversityManagementService universityManagementService) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.userAuthProviderRepository = userAuthProviderRepository;
        this.loginSessionRepository = loginSessionRepository;
        this.otpService = otpService;
        this.jwtTokenService = jwtTokenService;
        this.hashingService = hashingService;
        this.passwordEncoder = passwordEncoder;
        this.googleOAuthVerifier = googleOAuthVerifier;
        this.universityManagementService = universityManagementService;
    }

    public void requestRegistrationOtp(String email) {
        if (userRepository.existsByEmailIgnoreCase(normalizeEmail(email))) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        otpService.issue(email, VerificationPurpose.REGISTER);
    }

    @Transactional
    public RegisteredUser register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        otpService.verify(email, VerificationPurpose.REGISTER, request.otp());
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setRole(UserRole.STUDENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerifiedAt(now);
        user.setStudentVerificationStatus(StudentVerificationStatus.NOT_SUBMITTED);
        user.setCreatedAt(now);
        userRepository.save(user);

        return new RegisteredUser(
                user.getId(),
                null,
                user.getEmail(),
                user.getRole(),
                user.getStudentVerificationStatus());
    }

    @Transactional
    public TokenPair login(LoginRequest request, String ipAddress) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> invalidCredentials());
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is locked");
        }
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return createSessionTokens(user, request.device(), ipAddress);
    }

    @Transactional
    public TokenPair loginWithGoogle(String idToken, String accessToken, String device, String ipAddress) {
        GoogleAccount googleAccount = googleOAuthVerifier.verify(idToken, accessToken);
        String email = normalizeEmail(googleAccount.email());
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        UserAuthProvider linkedProvider = userAuthProviderRepository
                .findByProviderAndProviderUserId(AuthProvider.GOOGLE, googleAccount.providerUserId())
                .orElse(null);
        User user = linkedProvider == null
                ? userRepository.findByEmailIgnoreCase(email).orElseGet(() -> createGoogleUser(googleAccount, now))
                : linkedProvider.getUser();

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is locked");
        }
        if (googleAccount.emailVerified() && user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(now);
        }
        if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) && !googleAccount.avatarUrl().isBlank()) {
            user.setAvatarUrl(googleAccount.avatarUrl());
        }
        user.setUpdatedAt(now);
        userRepository.save(user);
        upsertGoogleProvider(user, googleAccount, now);
        try {
            universityManagementService.applyGoogleUniversityLink(user);
        } catch (DataAccessException exception) {
            // Google auth should still succeed on older/minimal schemas without the V9 university tables.
        }
        user = userRepository.findById(user.getId()).orElse(user);
        return createSessionTokens(user, device, ipAddress);
    }

    @Transactional
    public TokenPair refresh(String refreshToken) {
        TokenClaims claims = jwtTokenService.parseRefreshToken(refreshToken);
        LoginSession session = activeSession(claims.sessionId(), claims.userId());
        if (!session.getTokenHash().equals(hashingService.hash(refreshToken))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }
        IssuedToken access = jwtTokenService.issueAccessToken(session.getUser(), session.getId());
        IssuedToken refresh = jwtTokenService.issueRefreshToken(session.getUser(), session.getId());
        session.setTokenHash(hashingService.hash(refresh.value()));
        session.setExpiresAt(refresh.expiresAt());
        loginSessionRepository.save(session);
        StudentUniversityView university = universityLink(session.getUser());
        return new TokenPair("Bearer", access.value(), access.expiresAt(),
                refresh.value(), refresh.expiresAt(),
                session.getUser().getRole(),
                session.getUser().getStudentVerificationStatus(),
                university.universityId(),
                university.universityName(),
                university.linkStatus());
    }

    @Transactional
    public void logout(CurrentUser currentUser) {
        LoginSession session = activeSession(currentUser.sessionId(), currentUser.userId());
        session.setActive(false);
        session.setSignedOutAt(OffsetDateTime.now(ZoneOffset.UTC));
        loginSessionRepository.save(session);
    }

    public void requestPasswordResetOtp(String email) {
        userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .ifPresent(user -> otpService.issue(user.getEmail(), VerificationPurpose.RESET_PASSWORD));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = normalizeEmail(request.email());
        otpService.verify(email, VerificationPurpose.RESET_PASSWORD, request.otp());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Unable to reset password"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        userRepository.save(user);
        for (LoginSession session : loginSessionRepository.findAllByUserIdAndActiveTrue(user.getId())) {
            session.setActive(false);
            session.setSignedOutAt(OffsetDateTime.now(ZoneOffset.UTC));
            loginSessionRepository.save(session);
        }
    }

    private TokenPair createSessionTokens(User user, String device, String ipAddress) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        LoginSession session = new LoginSession();
        session.setUser(user);
        session.setTokenHash("pending");
        session.setDevice(device);
        session.setIpAddress(ipAddress);
        session.setSignedInAt(now);
        session.setExpiresAt(now);
        session.setActive(true);
        loginSessionRepository.save(session);

        IssuedToken access = jwtTokenService.issueAccessToken(user, session.getId());
        IssuedToken refresh = jwtTokenService.issueRefreshToken(user, session.getId());
        session.setTokenHash(hashingService.hash(refresh.value()));
        session.setExpiresAt(refresh.expiresAt());
        loginSessionRepository.save(session);
        StudentUniversityView university = universityLink(user);
        return new TokenPair("Bearer", access.value(), access.expiresAt(),
                refresh.value(), refresh.expiresAt(), user.getRole(), user.getStudentVerificationStatus(),
                university.universityId(), university.universityName(), university.linkStatus());
    }

    private StudentUniversityView universityLink(User user) {
        if (user.getRole() != UserRole.STUDENT) {
            return new StudentUniversityView(null, null, null, null, null, null, null, null);
        }
        try {
            return universityManagementService.studentUniversity(new CurrentUser(user.getId(), user.getEmail(), user.getRole(), null));
        } catch (DataAccessException exception) {
            return new StudentUniversityView(null, null, null, null, null, "NOT_LINKED", null,
                    user.getStudentVerificationStatus() == null ? null : user.getStudentVerificationStatus().name());
        }
    }

    private User createGoogleUser(GoogleAccount googleAccount, OffsetDateTime now) {
        User user = new User();
        user.setEmail(normalizeEmail(googleAccount.email()));
        user.setPasswordHash(null);
        user.setFullName(googleAccount.fullName().isBlank()
                ? googleAccount.email()
                : googleAccount.fullName().trim());
        user.setAvatarUrl(googleAccount.avatarUrl().isBlank() ? null : googleAccount.avatarUrl());
        user.setRole(UserRole.STUDENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerifiedAt(googleAccount.emailVerified() ? now : null);
        user.setStudentVerificationStatus(StudentVerificationStatus.NOT_SUBMITTED);
        user.setCreatedAt(now);
        return userRepository.save(user);
    }

    private void upsertGoogleProvider(User user, GoogleAccount googleAccount, OffsetDateTime now) {
        UserAuthProvider provider = userAuthProviderRepository
                .findByUserIdAndProvider(user.getId(), AuthProvider.GOOGLE)
                .orElseGet(UserAuthProvider::new);
        provider.setUser(user);
        provider.setProvider(AuthProvider.GOOGLE);
        provider.setProviderUserId(googleAccount.providerUserId());
        provider.setProviderEmail(normalizeEmail(googleAccount.email()));
        provider.setProviderEmailVerified(googleAccount.emailVerified());
        provider.setDisplayName(googleAccount.fullName().isBlank() ? null : googleAccount.fullName());
        provider.setAvatarUrl(googleAccount.avatarUrl().isBlank() ? null : googleAccount.avatarUrl());
        if (provider.getCreatedAt() == null) {
            provider.setCreatedAt(now);
        }
        provider.setUpdatedAt(now);
        userAuthProviderRepository.save(provider);
    }

    private LoginSession activeSession(Long sessionId, Integer userId) {
        LoginSession session = loginSessionRepository.findByIdAndActiveTrue(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Session is no longer active"));
        if (!session.getUser().getId().equals(userId)
                || session.getExpiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Session is no longer active");
        }
        return session;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
    }
}
