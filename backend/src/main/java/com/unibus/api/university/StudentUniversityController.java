package com.unibus.api.university;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.university.UniversityDtos.StudentUniversityView;

@RestController
@RequestMapping("/api/v1/students/me/university")
@PreAuthorize("hasRole('STUDENT')")
public class StudentUniversityController {

    private final UniversityManagementService service;

    public StudentUniversityController(UniversityManagementService service) {
        this.service = service;
    }

    @GetMapping
    ApiResponse<StudentUniversityView> get(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Student university retrieved", service.studentUniversity(currentUser));
    }
}
