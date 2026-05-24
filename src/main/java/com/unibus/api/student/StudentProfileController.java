package com.unibus.api.student;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.dto.StudentDtos.Profile;
import com.unibus.api.student.dto.StudentDtos.UpdateProfileRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/students/me/profile")
@PreAuthorize("hasRole('STUDENT')")
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    public StudentProfileController(StudentProfileService studentProfileService) {
        this.studentProfileService = studentProfileService;
    }

    @GetMapping
    ApiResponse<Profile> getProfile(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Profile retrieved", studentProfileService.getProfile(currentUser));
    }

    @PatchMapping
    ApiResponse<Profile> updateProfile(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok("Profile updated", studentProfileService.updateProfile(currentUser, request));
    }
}
