package com.unibus.api.user;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.storage.StoredFile;
import com.unibus.api.user.dto.UserProfileDtos.ChangePasswordRequest;
import com.unibus.api.user.dto.UserProfileDtos.UpdateUserProfileRequest;
import com.unibus.api.user.dto.UserProfileDtos.UserProfile;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
@Validated
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me/profile")
    ApiResponse<UserProfile> getCurrent(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Profile retrieved", userProfileService.getCurrent(currentUser));
    }

    @PatchMapping("/me/profile")
    ApiResponse<UserProfile> updateCurrent(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        return ApiResponse.ok("Profile updated", userProfileService.updateCurrent(currentUser, request));
    }

    @PatchMapping("/me/password")
    ApiResponse<Void> changePassword(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        userProfileService.changePassword(currentUser, request);
        return ApiResponse.ok("Password changed", null);
    }

    @PostMapping(path = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<UserProfile> uploadAvatar(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestPart("avatar") MultipartFile avatar) {
        return ApiResponse.ok("Avatar updated", userProfileService.uploadAvatar(currentUser, avatar));
    }

    @GetMapping("/{userId}/avatar")
    ResponseEntity<byte[]> getAvatar(@PathVariable Integer userId) {
        StoredFile avatar = userProfileService.loadAvatar(userId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(avatar.contentType()))
                .body(avatar.content());
    }
}
