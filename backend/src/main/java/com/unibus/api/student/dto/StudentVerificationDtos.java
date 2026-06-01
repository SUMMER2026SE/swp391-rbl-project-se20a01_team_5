package com.unibus.api.student.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.unibus.api.student.model.StudentVerificationStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class StudentVerificationDtos {

    private StudentVerificationDtos() {
    }

    public record SubmitVerificationRequest(
            @NotBlank @Size(max = 150) String university,
            @NotBlank @Size(max = 20) String studentCode) {
    }

    public record ReviewRequest(@Size(max = 500) String reason) {
    }

    public record VerificationView(
            Long verificationId,
            Integer userId,
            String email,
            String fullName,
            StudentVerificationStatus status,
            String university,
            String studentCode,
            String cardImageUrl,
            String ocrFullName,
            String ocrStudentCode,
            String ocrUniversity,
            String ocrRawText,
            BigDecimal ocrConfidenceScore,
            String rejectionReason,
            Integer reviewerUserId,
            OffsetDateTime submittedAt,
            OffsetDateTime reviewedAt) {
    }
}
