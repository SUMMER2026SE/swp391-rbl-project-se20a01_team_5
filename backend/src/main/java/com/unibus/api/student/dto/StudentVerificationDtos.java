package com.unibus.api.student.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.unibus.api.student.OcrMatchStatus;
import com.unibus.api.student.OcrProcessingStatus;
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
            Integer universityId,
            String studentCode,
            String cardImageUrl,
            String ocrFullName,
            String ocrStudentCode,
            String ocrUniversity,
            String ocrRawText,
            BigDecimal ocrConfidenceScore,
            OcrProcessingStatus ocrStatus,
            String ocrProvider,
            String ocrErrorCode,
            String ocrErrorMessage,
            OffsetDateTime ocrProcessedAt,
            OffsetDateTime ocrLastAttemptAt,
            Integer ocrAttemptCount,
            OcrMatchStatus nameMatchStatus,
            BigDecimal nameSimilarityScore,
            OcrMatchStatus studentCodeMatchStatus,
            BigDecimal studentCodeSimilarityScore,
            OcrMatchStatus universityMatchStatus,
            BigDecimal universitySimilarityScore,
            String rejectionReason,
            Integer reviewerUserId,
            OffsetDateTime submittedAt,
            OffsetDateTime reviewedAt) {
    }
}
