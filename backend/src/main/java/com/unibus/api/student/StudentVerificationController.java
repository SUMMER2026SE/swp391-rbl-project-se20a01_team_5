package com.unibus.api.student;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.dto.StudentVerificationDtos.SubmitVerificationRequest;
import com.unibus.api.student.dto.StudentVerificationDtos.VerificationView;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/students/me/verification")
@PreAuthorize("hasRole('STUDENT')")
public class StudentVerificationController {

    private final StudentVerificationService studentVerificationService;

    public StudentVerificationController(StudentVerificationService studentVerificationService) {
        this.studentVerificationService = studentVerificationService;
    }

    @GetMapping
    ApiResponse<VerificationView> getCurrent(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Student verification retrieved", studentVerificationService.getCurrent(currentUser));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<ApiResponse<VerificationView>> submit(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @ModelAttribute SubmitVerificationRequest request,
            @RequestPart(value = "cardImage", required = false) MultipartFile cardImage) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        "Student verification submitted",
                        studentVerificationService.submit(
                                currentUser,
                                request.university(),
                                request.studentCode(),
                                cardImage)));
    }
}
