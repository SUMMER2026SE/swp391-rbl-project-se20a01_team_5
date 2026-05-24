package com.unibus.api.student;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.dto.StudentDtos;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/students/me/profile"})
@PreAuthorize("hasRole('STUDENT')")
public class StudentProfileController {
   private final StudentProfileService studentProfileService;

   public StudentProfileController(StudentProfileService studentProfileService) {
      this.studentProfileService = studentProfileService;
   }

   @GetMapping
   ApiResponse<StudentDtos.Profile> getProfile(@AuthenticationPrincipal CurrentUser currentUser) {
      return ApiResponse.<StudentDtos.Profile>ok("Profile retrieved", this.studentProfileService.getProfile(currentUser));
   }

   @PatchMapping
   ApiResponse<StudentDtos.Profile> updateProfile(@AuthenticationPrincipal CurrentUser currentUser, @RequestBody StudentDtos.@Valid UpdateProfileRequest request) {
      return ApiResponse.<StudentDtos.Profile>ok("Profile updated", this.studentProfileService.updateProfile(currentUser, request));
   }
}
