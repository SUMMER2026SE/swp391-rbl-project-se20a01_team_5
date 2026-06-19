package com.unibus.api.user;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.auth.LoginSessionRepository;
import com.unibus.api.auth.model.LoginSession;
import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.storage.FileStorageService;
import com.unibus.api.storage.StoredFile;
import com.unibus.api.user.dto.UserProfileDtos.ChangePasswordRequest;
import com.unibus.api.user.dto.UserProfileDtos.UpdateUserProfileRequest;
import com.unibus.api.user.dto.UserProfileDtos.UserProfile;
import com.unibus.api.user.model.User;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginSessionRepository loginSessionRepository;
    private final FileStorageService fileStorageService;

    public UserProfileService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            LoginSessionRepository loginSessionRepository,
            FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginSessionRepository = loginSessionRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public UserProfile getCurrent(CurrentUser currentUser) {
        return toProfile(requireUser(currentUser.userId()));
    }

    @Transactional
    public UserProfile updateCurrent(CurrentUser currentUser, UpdateUserProfileRequest request) {
        User user = requireUser(currentUser.userId());
        String email = nullableTrim(request.email());
        if (email != null && !email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(email)) {
                throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
            }
            user.setEmail(email.toLowerCase(Locale.ROOT));
        }
        String fullName = nullableTrim(request.fullName());
        if (fullName != null) {
            user.setFullName(fullName);
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(nullableTrim(request.phoneNumber()));
        }
        if (request.address() != null) {
            user.setAddress(nullableTrim(request.address()));
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(nullableTrim(request.avatarUrl()));
        }
        user.setUpdatedAt(now());
        return toProfile(userRepository.save(user));
    }

    @Transactional
    public void changePassword(CurrentUser currentUser, ChangePasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password confirmation does not match");
        }
        User user = requireUser(currentUser.userId());
        boolean hasExistingPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();

        if (hasExistingPassword) {
            if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is required");
            }
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
            }
            if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from the current password");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(now());
        userRepository.save(user);
        revokeOtherSessions(user.getId(), currentUser.sessionId());
    }

    @Transactional
    public UserProfile uploadAvatar(CurrentUser currentUser, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar image is required");
        }
        String extension = extension(avatar.getContentType(), avatar.getOriginalFilename());
        User user = requireUser(currentUser.userId());
        try {
            deleteExistingAvatars(user.getId());
            fileStorageService.store(avatarKey(user.getId(), extension), avatar.getBytes(), avatar.getContentType());
            user.setAvatarUrl("/api/v1/users/" + user.getId() + "/avatar?version=" + now().toInstant().toEpochMilli());
            user.setUpdatedAt(now());
            return toProfile(userRepository.save(user));
        } catch (java.io.IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store avatar image");
        }
    }

    @Transactional(readOnly = true)
    public StoredFile loadAvatar(Integer userId) {
        requireUser(userId);
        for (String extension : new String[] { ".jpg", ".jpeg", ".png", ".webp" }) {
            try {
                return fileStorageService.load(avatarKey(userId, extension));
            } catch (ApiException exception) {
                if (exception.getStatus() != HttpStatus.NOT_FOUND) {
                    throw exception;
                }
            }
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "Avatar image not found");
    }

    private void deleteExistingAvatars(Integer userId) {
        for (String extension : new String[] { ".jpg", ".jpeg", ".png", ".webp" }) {
            fileStorageService.delete(avatarKey(userId, extension));
        }
    }

    private String avatarKey(Integer userId, String extension) {
        return "profile-avatars/user-" + userId + extension;
    }

    private void revokeOtherSessions(Integer userId, Long currentSessionId) {
        OffsetDateTime signedOutAt = now();
        for (LoginSession session : loginSessionRepository.findAllByUserIdAndActiveTrue(userId)) {
            if (!session.getId().equals(currentSessionId)) {
                session.setActive(false);
                session.setSignedOutAt(signedOutAt);
                loginSessionRepository.save(session);
            }
        }
    }

    private User requireUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserProfile toProfile(User user) {
        return new UserProfile(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getStatus(),
                user.getStudentVerificationStatus(),
                user.getPasswordHash() != null && !user.getPasswordHash().isBlank());
    }

    private String extension(String contentType, String originalFilename) {
        String normalizedContentType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (normalizedContentType.equals("image/png")) {
            return ".png";
        }
        if (normalizedContentType.equals("image/webp")) {
            return ".webp";
        }
        if (normalizedContentType.equals("image/jpeg") || normalizedContentType.equals("image/jpg")) {
            return ".jpg";
        }
        String name = originalFilename == null ? "" : originalFilename.toLowerCase(Locale.ROOT);
        if (name.endsWith(".png")) {
            return ".png";
        }
        if (name.endsWith(".webp")) {
            return ".webp";
        }
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
            return ".jpg";
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar must be a JPEG, PNG or WebP image");
    }

    private String nullableTrim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }
}
