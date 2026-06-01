package com.unibus.api.student;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.student.dto.StudentVerificationDtos.VerificationView;
import com.unibus.api.student.model.StudentVerification;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.StudentRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Student;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;

@Service
public class StudentVerificationService {

    private final StudentVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final UniversityCatalog universityCatalog;
    private final StudentCardOcrService studentCardOcrService;
    private final Path uploadDir;

    public StudentVerificationService(
            StudentVerificationRepository verificationRepository,
            UserRepository userRepository,
            StudentRepository studentRepository,
            UniversityCatalog universityCatalog,
            StudentCardOcrService studentCardOcrService,
            @Value("${app.upload.student-verification-dir}") String uploadDir) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.universityCatalog = universityCatalog;
        this.studentCardOcrService = studentCardOcrService;
        this.uploadDir = Path.of(uploadDir);
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
        verification.setStudentCode(normalizedStudentCode);
        verification.setCardImageUrl(storeCardImage(user.getId(), cardImage));
        verification.setOcrFullName(blankToNull(ocrResult.fullName()));
        verification.setOcrStudentCode(blankToNull(ocrResult.studentCode()));
        verification.setOcrUniversity(blankToNull(ocrResult.university()));
        verification.setOcrRawText(blankToNull(ocrResult.rawText()));
        verification.setOcrConfidenceScore(ocrResult.confidenceScore() == null
                ? BigDecimal.ZERO
                : ocrResult.confidenceScore());
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
        return toView(verificationRepository.save(verification));
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
    public Path loadCardImage(CurrentUser currentUser, Long verificationId) {
        StudentVerification verification = requireVerification(verificationId);
        boolean canRead = currentUser.role() == UserRole.ADMIN
                || verification.getUser().getId().equals(currentUser.userId());
        if (!canRead) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Access denied");
        }
        if (verification.getCardImageUrl() == null || verification.getCardImageUrl().isBlank()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student card image not found");
        }

        Path base = uploadDir.toAbsolutePath().normalize();
        Path file = Path.of(verification.getCardImageUrl()).toAbsolutePath().normalize();
        if (!file.startsWith(base) || !Files.exists(file) || Files.isDirectory(file)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student card image not found");
        }
        return file;
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
        return toView(verificationRepository.save(verification));
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
                null);
    }

    private VerificationView toView(StudentVerification verification) {
        User user = verification.getUser();
        User reviewer = verification.getReviewer();
        String cardImageUrl = verification.getCardImageUrl() == null
                ? null
                : "/api/v1/student-verifications/" + verification.getId() + "/card-image";
        return new VerificationView(
                verification.getId(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                verification.getStatus(),
                verification.getUniversity(),
                verification.getStudentCode(),
                cardImageUrl,
                verification.getOcrFullName(),
                verification.getOcrStudentCode(),
                verification.getOcrUniversity(),
                verification.getOcrRawText(),
                verification.getOcrConfidenceScore(),
                verification.getRejectionReason(),
                reviewer == null ? null : reviewer.getId(),
                verification.getSubmittedAt(),
                verification.getReviewedAt());
    }

    private String storeCardImage(Integer userId, MultipartFile cardImage) {
        if (cardImage == null || cardImage.isEmpty()) {
            return null;
        }
        try {
            Files.createDirectories(uploadDir);
            String extension = extension(cardImage.getOriginalFilename());
            String fileName = "user-" + userId + "-" + UUID.randomUUID() + extension;
            Path destination = uploadDir.resolve(fileName).normalize();
            cardImage.transferTo(destination);
            return uploadDir.resolve(fileName).toString().replace('\\', '/');
        } catch (IOException exception) {
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
}
