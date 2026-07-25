package com.unibus.api.student;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.storage.FileStorageService;
import com.unibus.api.storage.StoredFile;
import com.unibus.api.student.dto.StudentVerificationDtos.VerificationView;
import com.unibus.api.student.model.StudentVerification;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.university.SubsidyService;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;

@Service
public class StudentVerificationService {

    private static final long MAX_CARD_IMAGE_BYTES = 10L * 1024L * 1024L;
    private static final List<String> ALLOWED_CARD_IMAGE_TYPES = List.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp");

    private final StudentVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final UniversityCatalog universityCatalog;
    private final SubsidyService subsidyService;
    private final StudentCardOcrService studentCardOcrService;
    private final FileStorageService fileStorageService;
    private final JdbcTemplate jdbcTemplate;

    public StudentVerificationService(
            StudentVerificationRepository verificationRepository,
            UserRepository userRepository,
            StudentRepository studentRepository,
            UniversityCatalog universityCatalog,
            SubsidyService subsidyService,
            StudentCardOcrService studentCardOcrService,
            FileStorageService fileStorageService,
            JdbcTemplate jdbcTemplate) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.universityCatalog = universityCatalog;
        this.subsidyService = subsidyService;
        this.studentCardOcrService = studentCardOcrService;
        this.fileStorageService = fileStorageService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public VerificationView getCurrent(CurrentUser currentUser) {
        return verificationRepository.findFirstByUserIdAndCurrentTrueOrderBySubmittedAtDesc(currentUser.userId())
                .map(this::toView)
                .orElseGet(() -> emptyView(currentUser));
    }

    @Transactional
    public VerificationView submit(CurrentUser currentUser, String university, String studentCode, MultipartFile cardImage) {
        User user = requireUser(currentUser.userId());
        if (user.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email must be verified before student verification");
        }
        if (cardImage == null || cardImage.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Student card image is required");
        }
        validateCardImage(cardImage);
        String allowedUniversity = universityCatalog.requireAllowed(university);
        String normalizedStudentCode = studentCode.trim().toUpperCase();

        verificationRepository.findFirstByUserIdAndCurrentTrueOrderBySubmittedAtDesc(user.getId())
                .ifPresent(existing -> {
                    if (existing.getStatus() == StudentVerificationStatus.PENDING_REVIEW) {
                        throw new ApiException(HttpStatus.CONFLICT, "A verification request is already pending review");
                    }
                    existing.setCurrent(false);
                    existing.setUpdatedAt(now());
                    verificationRepository.save(existing);
                    verificationRepository.flush();
                });
        requireStudentCodeAvailable(user, normalizedStudentCode);

        OffsetDateTime timestamp = now();
        StudentCardOcrService.Result ocrResult = studentCardOcrService.extract(
                cardImage,
                user.getFullName(),
                normalizedStudentCode,
                allowedUniversity);
        StudentVerification verification = new StudentVerification();
        verification.setUser(user);
        verification.setUniversity(allowedUniversity);
        verification.setUniversityId(subsidyService.universityIdForName(allowedUniversity));
        verification.setStudentCode(normalizedStudentCode);
        verification.setCardImageUrl(storeCardImage(user.getId(), cardImage));
        applyOcrResult(verification, ocrResult, timestamp, 1);
        verification.setStatus(StudentVerificationStatus.PENDING_REVIEW);
        verification.setSubmittedAt(timestamp);
        verification.setCreatedAt(timestamp);
        verification.setCurrent(true);
        verificationRepository.save(verification);

        user.setStudentVerificationStatus(StudentVerificationStatus.PENDING_REVIEW);
        user.setUpdatedAt(timestamp);
        userRepository.save(user);

        return toView(verification);
    }

    @Transactional
    public VerificationView retryOcr(CurrentUser admin, Long verificationId) {
        requireAdmin(admin.userId());
        StudentVerification verification = requireVerification(verificationId);
        requirePending(verification);
        if (verification.getCardImageUrl() == null || verification.getCardImageUrl().isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student card image not found");
        }

        StoredFile cardImage = fileStorageService.load(verification.getCardImageUrl());
        MultipartFile multipartFile = new StoredMultipartFile(cardImage);
        OffsetDateTime timestamp = now();
        StudentCardOcrService.Result ocrResult = studentCardOcrService.extract(
                multipartFile,
                verification.getUser().getFullName(),
                verification.getStudentCode(),
                verification.getUniversity());
        applyOcrResult(
                verification,
                ocrResult,
                timestamp,
                verification.getOcrAttemptCount() == null ? 1 : verification.getOcrAttemptCount() + 1);
        verification.setUpdatedAt(timestamp);
        VerificationView view = toView(verificationRepository.save(verification));
        audit(admin.userId(), verification.getUniversityId(), "STUDENT_VERIFICATION_OCR_RETRY",
                "student_verifications", verification.getId(), "SUCCESS", verification.getUser().getFullName());
        return view;
    }

    @Transactional(readOnly = true)
    public List<VerificationView> list(StudentVerificationStatus status) {
        List<StudentVerification> verifications = status == null
                ? verificationRepository.findAllByOrderBySubmittedAtDesc()
                : verificationRepository.findAllByStatusOrderBySubmittedAtAsc(status);
        return verifications.stream().map(this::toView).toList();
    }

    @Transactional
    public VerificationView approve(CurrentUser admin, Long verificationId) {
        User reviewer = requireAdmin(admin.userId());
        StudentVerification verification = requireVerification(verificationId);
        requirePending(verification);

        User user = verification.getUser();
        studentRepository.findById(verification.getStudentCode())
                .filter(existing -> !existing.getUser().getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Student code is already assigned to another user");
                });

        Student student = studentRepository.findByUserId(user.getId()).orElseGet(Student::new);
        student.setStudentCode(verification.getStudentCode());
        student.setUser(user);
        student.setUniversity(verification.getUniversity());
        student.setUniversityId(verification.getUniversityId() == null
                ? subsidyService.universityIdForName(verification.getUniversity())
                : verification.getUniversityId());
        studentRepository.save(student);

        OffsetDateTime timestamp = now();
        verification.setStatus(StudentVerificationStatus.VERIFIED);
        verification.setReviewer(reviewer);
        verification.setReviewedAt(timestamp);
        verification.setUpdatedAt(timestamp);
        verification.setRejectionReason(null);

        user.setStudentVerificationStatus(StudentVerificationStatus.VERIFIED);
        user.setUpdatedAt(timestamp);
        userRepository.save(user);
        VerificationView view = toView(verificationRepository.save(verification));
        audit(admin.userId(), student.getUniversityId(), "STUDENT_VERIFICATION_APPROVE", "student_verifications",
                verification.getId(), "SUCCESS", user.getFullName());
        return view;
    }

    @Transactional
    public VerificationView reject(CurrentUser admin, Long verificationId, String reason) {
        return reviewWithStatus(admin, verificationId, StudentVerificationStatus.REJECTED, reason);
    }

    @Transactional
    public VerificationView requestResubmission(CurrentUser admin, Long verificationId, String reason) {
        return reviewWithStatus(admin, verificationId, StudentVerificationStatus.RESUBMISSION_REQUIRED, reason);
    }

    @Transactional(readOnly = true)
    public StoredFile loadCardImage(CurrentUser currentUser, Long verificationId) {
        StudentVerification verification = requireVerification(verificationId);
        boolean canRead = currentUser.role() == UserRole.ADMIN
                || verification.getUser().getId().equals(currentUser.userId());
        if (!canRead) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied");
        }
        if (verification.getCardImageUrl() == null || verification.getCardImageUrl().isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student card image not found");
        }

        try {
            return fileStorageService.load(verification.getCardImageUrl());
        } catch (ApiException exception) {
            if (exception.getStatus() != HttpStatus.NOT_FOUND) {
                throw exception;
            }
            throw new ApiException(HttpStatus.NOT_FOUND, "Student card image not found");
        }
    }

    private VerificationView reviewWithStatus(
            CurrentUser admin,
            Long verificationId,
            StudentVerificationStatus status,
            String reason) {
        User reviewer = requireAdmin(admin.userId());
        StudentVerification verification = requireVerification(verificationId);
        requirePending(verification);
        OffsetDateTime timestamp = now();

        verification.setStatus(status);
        verification.setReviewer(reviewer);
        verification.setReviewedAt(timestamp);
        verification.setUpdatedAt(timestamp);
        verification.setRejectionReason(reason == null || reason.isBlank() ? null : reason.trim());
        verification.getUser().setStudentVerificationStatus(status);
        verification.getUser().setUpdatedAt(timestamp);
        userRepository.save(verification.getUser());
        VerificationView view = toView(verificationRepository.save(verification));
        audit(admin.userId(), verification.getUniversityId(), "STUDENT_VERIFICATION_" + status.name(),
                "student_verifications", verification.getId(), "SUCCESS", verification.getUser().getFullName());
        return view;
    }

    private void audit(Integer performedByUserId, Integer universityId, String action, String affectedTable,
            Long affectedRecordId, String result, String notes) {
        jdbcTemplate.update("""
                INSERT INTO audit_logs(performed_by_user_id, university_id, action, affected_table,
                                       affected_record_id, result, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, performedByUserId, universityId, action, affectedTable,
                affectedRecordId == null ? null : String.valueOf(affectedRecordId), result, notes);
    }

    private void requireStudentCodeAvailable(User user, String studentCode) {
        studentRepository.findById(studentCode)
                .filter(existing -> !existing.getUser().getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Student code is already assigned to another user");
                });
        verificationRepository.findFirstByStudentCodeAndCurrentTrueOrderBySubmittedAtDesc(studentCode)
                .filter(existing -> !existing.getUser().getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Student code is already used by another verification request");
                });
    }

    private void validateCardImage(MultipartFile cardImage) {
        if (cardImage.getSize() > MAX_CARD_IMAGE_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Student card image must be 10MB or smaller");
        }
        String contentType = cardImage.getContentType();
        if (contentType == null || !ALLOWED_CARD_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Student card image must be JPEG, PNG, or WebP");
        }
    }

    private StudentVerification requireVerification(Long verificationId) {
        return verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student verification not found"));
    }

    private void requirePending(StudentVerification verification) {
        if (verification.getStatus() != StudentVerificationStatus.PENDING_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending verification requests can be reviewed");
        }
    }

    private User requireAdmin(Integer userId) {
        User user = requireUser(userId);
        if (user.getRole() != UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admin role is required");
        }
        return user;
    }

    private User requireUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private VerificationView emptyView(CurrentUser currentUser) {
        User user = requireUser(currentUser.userId());
        return new VerificationView(
                null,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getStudentVerificationStatus(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private VerificationView toView(StudentVerification verification) {
        User user = verification.getUser();
        User reviewer = verification.getReviewer();
        String cardImageUrl = verification.getCardImageUrl() == null
                ? null
                : "/student-verifications/" + verification.getId() + "/card-image";
        return new VerificationView(
                verification.getId(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                verification.getStatus(),
                verification.getUniversity(),
                verification.getUniversityId(),
                verification.getStudentCode(),
                cardImageUrl,
                verification.getOcrFullName(),
                verification.getOcrStudentCode(),
                verification.getOcrUniversity(),
                verification.getOcrRawText(),
                verification.getOcrConfidenceScore(),
                verification.getOcrStatus(),
                verification.getOcrProvider(),
                verification.getOcrErrorCode(),
                verification.getOcrErrorMessage(),
                verification.getOcrProcessedAt(),
                verification.getOcrLastAttemptAt(),
                verification.getOcrAttemptCount(),
                verification.getNameMatchStatus(),
                verification.getNameSimilarityScore(),
                verification.getStudentCodeMatchStatus(),
                verification.getStudentCodeSimilarityScore(),
                verification.getUniversityMatchStatus(),
                verification.getUniversitySimilarityScore(),
                verification.getRejectionReason(),
                reviewer == null ? null : reviewer.getId(),
                verification.getSubmittedAt(),
                verification.getReviewedAt());
    }

    private void applyOcrResult(
            StudentVerification verification,
            StudentCardOcrService.Result ocrResult,
            OffsetDateTime timestamp,
            int attemptCount) {
        verification.setOcrFullName(blankToNull(ocrResult.fullName()));
        verification.setOcrStudentCode(blankToNull(ocrResult.studentCode()));
        verification.setOcrUniversity(blankToNull(ocrResult.university()));
        verification.setOcrRawText(blankToNull(ocrResult.rawText()));
        verification.setOcrConfidenceScore(ocrResult.confidenceScore());
        verification.setOcrStatus(ocrResult.status());
        verification.setOcrProvider(blankToNull(ocrResult.provider()));
        verification.setOcrErrorCode(blankToNull(ocrResult.errorCode()));
        verification.setOcrErrorMessage(blankToNull(ocrResult.errorMessage()));
        verification.setOcrProcessedAt(timestamp);
        verification.setOcrLastAttemptAt(timestamp);
        verification.setOcrAttemptCount(attemptCount);
        verification.setNameMatchStatus(ocrResult.nameMatchStatus());
        verification.setNameSimilarityScore(ocrResult.nameSimilarityScore());
        verification.setStudentCodeMatchStatus(ocrResult.studentCodeMatchStatus());
        verification.setStudentCodeSimilarityScore(ocrResult.studentCodeSimilarityScore());
        verification.setUniversityMatchStatus(ocrResult.universityMatchStatus());
        verification.setUniversitySimilarityScore(ocrResult.universitySimilarityScore());
    }

    private String storeCardImage(Integer userId, MultipartFile cardImage) {
        if (cardImage == null || cardImage.isEmpty()) {
            return null;
        }
        try {
            String extension = extension(cardImage.getOriginalFilename());
            String fileName = "user-" + userId + "-" + UUID.randomUUID() + extension;
            return fileStorageService.store(
                    "student-verifications/" + fileName,
                    cardImage.getBytes(),
                    cardImage.getContentType());
        } catch (java.io.IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store student card image");
        }
    }

    private String extension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot).toLowerCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    private record StoredMultipartFile(StoredFile storedFile) implements MultipartFile {

        @Override
        public String getName() {
            return "cardImage";
        }

        @Override
        public String getOriginalFilename() {
            return storedFile.fileName();
        }

        @Override
        public String getContentType() {
            return storedFile.contentType();
        }

        @Override
        public boolean isEmpty() {
            return storedFile.content() == null || storedFile.content().length == 0;
        }

        @Override
        public long getSize() {
            return storedFile.content() == null ? 0 : storedFile.content().length;
        }

        @Override
        public byte[] getBytes() {
            return storedFile.content() == null ? new byte[0] : storedFile.content();
        }

        @Override
        public java.io.InputStream getInputStream() {
            return new java.io.ByteArrayInputStream(getBytes());
        }

        @Override
        public void transferTo(java.io.File dest) throws java.io.IOException {
            java.nio.file.Files.write(dest.toPath(), getBytes());
        }
    }
}
