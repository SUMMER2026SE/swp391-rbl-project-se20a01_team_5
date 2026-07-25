package com.unibus.api.student.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.unibus.api.student.OcrMatchStatus;
import com.unibus.api.student.OcrProcessingStatus;
import com.unibus.api.user.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_verifications")
@Getter
@Setter
@NoArgsConstructor
public class StudentVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_verification_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String university;

    @Column(name = "university_id")
    private Integer universityId;

    @Column(name = "student_code", nullable = false, length = 20)
    private String studentCode;

    @Column(name = "card_image_url", length = 500)
    private String cardImageUrl;

    @Column(name = "ocr_full_name", length = 100)
    private String ocrFullName;

    @Column(name = "ocr_student_code", length = 20)
    private String ocrStudentCode;

    @Column(name = "ocr_university", length = 150)
    private String ocrUniversity;

    @Column(name = "ocr_raw_text")
    private String ocrRawText;

    @Column(name = "ocr_confidence_score", precision = 5, scale = 4)
    private BigDecimal ocrConfidenceScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "ocr_status", length = 30)
    private OcrProcessingStatus ocrStatus;

    @Column(name = "ocr_provider", length = 50)
    private String ocrProvider;

    @Column(name = "ocr_error_code", length = 100)
    private String ocrErrorCode;

    @Column(name = "ocr_error_message", length = 500)
    private String ocrErrorMessage;

    @Column(name = "ocr_processed_at")
    private OffsetDateTime ocrProcessedAt;

    @Column(name = "ocr_last_attempt_at")
    private OffsetDateTime ocrLastAttemptAt;

    @Column(name = "ocr_attempt_count")
    private Integer ocrAttemptCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "name_match_status", length = 30)
    private OcrMatchStatus nameMatchStatus;

    @Column(name = "name_similarity_score", precision = 5, scale = 4)
    private BigDecimal nameSimilarityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "student_code_match_status", length = 30)
    private OcrMatchStatus studentCodeMatchStatus;

    @Column(name = "student_code_similarity_score", precision = 5, scale = 4)
    private BigDecimal studentCodeSimilarityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "university_match_status", length = 30)
    private OcrMatchStatus universityMatchStatus;

    @Column(name = "university_similarity_score", precision = 5, scale = 4)
    private BigDecimal universitySimilarityScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StudentVerificationStatus status;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_user_id")
    private User reviewer;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "submitted_at", nullable = false)
    private OffsetDateTime submittedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "is_current", nullable = false)
    private boolean current;
}
