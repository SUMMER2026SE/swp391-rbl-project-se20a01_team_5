package com.unibus.api.user;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.dto.UserProfileDtos.UpdateUserProfileRequest;
import com.unibus.api.user.dto.UserProfileDtos.UserProfile;
import com.unibus.api.user.model.User;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final Path avatarDir;

    public UserProfileService(
            UserRepository userRepository,
            @Value("${app.upload.profile-avatar-dir:uploads/profile-avatars}") String avatarDir) {
        this.userRepository = userRepository;
        this.avatarDir = Path.of(avatarDir);
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
    public UserProfile uploadAvatar(CurrentUser currentUser, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar image is required");
        }
        String extension = extension(avatar.getContentType(), avatar.getOriginalFilename());
        User user = requireUser(currentUser.userId());
        try {
            Files.createDirectories(avatarDir);
            Path base = avatarDir.toAbsolutePath().normalize();
            deleteExistingAvatars(base, user.getId());
            Path destination = base.resolve("user-" + user.getId() + extension).normalize();
            if (!destination.startsWith(base)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid avatar destination");
            }
            avatar.transferTo(destination);
            user.setAvatarUrl("/api/v1/users/" + user.getId() + "/avatar?version=" + now().toInstant().toEpochMilli());
            user.setUpdatedAt(now());
            return toProfile(userRepository.save(user));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store avatar image");
        }
    }

    @Transactional(readOnly = true)
    public Path loadAvatar(Integer userId) {
        requireUser(userId);
        Path base = avatarDir.toAbsolutePath().normalize();
        for (String extension : new String[] { ".jpg", ".jpeg", ".png", ".webp" }) {
            Path file = base.resolve("user-" + userId + extension).normalize();
            if (file.startsWith(base) && Files.exists(file) && !Files.isDirectory(file)) {
                return file;
            }
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "Avatar image not found");
    }

    private void deleteExistingAvatars(Path base, Integer userId) throws IOException {
        for (String extension : new String[] { ".jpg", ".jpeg", ".png", ".webp" }) {
            Path file = base.resolve("user-" + userId + extension).normalize();
            if (file.startsWith(base)) {
                Files.deleteIfExists(file);
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
                user.getStudentVerificationStatus());
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
