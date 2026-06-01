package com.unibus.api.student;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.dto.StudentVerificationDtos.ReviewRequest;
import com.unibus.api.student.dto.StudentVerificationDtos.VerificationView;
import com.unibus.api.student.model.StudentVerificationStatus;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/student-verifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStudentVerificationController {

    private final StudentVerificationService studentVerificationService;

    public AdminStudentVerificationController(StudentVerificationService studentVerificationService) {
        this.studentVerificationService = studentVerificationService;
    }

    @GetMapping
    ApiResponse<List<VerificationView>> list(
            @RequestParam(value = "status", required = false) StudentVerificationStatus status) {
        return ApiResponse.ok("Student verifications retrieved", studentVerificationService.list(status));
    }

    @PostMapping("/{verificationId}/approve")
    ApiResponse<VerificationView> approve(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long verificationId) {
        return ApiResponse.ok(
                "Student verification approved",
                studentVerificationService.approve(currentUser, verificationId));
    }

    @PostMapping("/{verificationId}/reject")
    ApiResponse<VerificationView> reject(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long verificationId,
            @Valid @RequestBody(required = false) ReviewRequest request) {
        return ApiResponse.ok(
                "Student verification rejected",
                studentVerificationService.reject(
                        currentUser,
                        verificationId,
                        request == null ? null : request.reason()));
    }

    @PostMapping("/{verificationId}/request-resubmission")
    ApiResponse<VerificationView> requestResubmission(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long verificationId,
            @Valid @RequestBody(required = false) ReviewRequest request) {
        return ApiResponse.ok(
                "Student verification resubmission requested",
                studentVerificationService.requestResubmission(
                        currentUser,
                        verificationId,
                        request == null ? null : request.reason()));
    }
}
