package com.unibus.api.university;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UniversityDtos {

    private UniversityDtos() {
    }

    public record UniversityView(
            Integer universityId,
            String code,
            String name,
            String shortName,
            String contactEmail,
            String status,
            int campusCount,
            int domainCount,
            int rosterCount,
            OffsetDateTime createdAt) {
    }

    public record CampusView(
            Integer campusId,
            Integer universityId,
            String code,
            String name,
            String address,
            BigDecimal latitude,
            BigDecimal longitude,
            String status) {
    }

    public record DomainView(
            Integer domainId,
            Integer universityId,
            String domain,
            String status,
            OffsetDateTime verifiedAt,
            OffsetDateTime createdAt) {
    }

    public record UniversityAdminView(
            Integer universityAdminId,
            Integer universityId,
            String universityName,
            Integer userId,
            String email,
            String fullName,
            String phoneNumber,
            String title,
            String status,
            OffsetDateTime assignedAt) {
    }

    public record RosterStudentView(
            Long rosterId,
            Integer universityId,
            String email,
            String studentCode,
            String fullName,
            String faculty,
            Integer academicYear,
            String status,
            Integer matchedUserId,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {
    }

    public record ImportBatchView(
            Long importBatchId,
            Integer universityId,
            String fileName,
            int totalRows,
            int successRows,
            int errorRows,
            String status,
            OffsetDateTime createdAt,
            OffsetDateTime completedAt,
            List<ImportErrorView> errors) {
    }

    public record ImportErrorView(
            Long importErrorId,
            Long importBatchId,
            int rowNumber,
            String fieldName,
            String rawValue,
            String errorMessage) {
    }

    public record RouteUniversityView(
            Integer routeUniversityId,
            Integer routeId,
            String routeName,
            Integer universityId,
            String universityName,
            Integer campusId,
            String campusName,
            LocalDate activeFrom,
            LocalDate activeUntil,
            String status) {
    }

    public record SubsidyPolicyView(
            Integer subsidyPolicyId,
            Integer universityId,
            String universityName,
            Integer campusId,
            String campusName,
            String policyName,
            String subsidyType,
            BigDecimal value,
            BigDecimal maxAmount,
            LocalDate activeFrom,
            LocalDate activeUntil,
            String status) {
    }

    public record AuditLogView(
            Long auditLogId,
            Integer performedByUserId,
            String performerName,
            Integer universityId,
            String universityName,
            String action,
            String affectedTable,
            String affectedRecordId,
            String result,
            String requestId,
            String notes,
            OffsetDateTime performedAt) {
    }

    public record StudentUniversityView(
            Integer universityId,
            String universityName,
            String shortName,
            String studentCode,
            String rosterStatus,
            String linkStatus,
            String domainHint,
            String studentVerificationStatus) {
    }

    public record UniversityStatsView(
            Integer universityId,
            String universityName,
            int activeRosterStudents,
            int matchedStudents,
            int activeDomains,
            int activeCampuses,
            int activeRoutes,
            int activeSubsidyPolicies,
            BigDecimal totalSubsidyAmount,
            int monthlyPasses) {
    }

    public record PaymentTransactionView(
            Long orderId,
            Long transactionId,
            Long sepayTransactionId,
            String studentCode,
            String studentName,
            Integer universityId,
            String universityName,
            String ticketType,
            Integer routeId,
            String routeName,
            BigDecimal orderTotal,
            String paymentStatus,
            String gateway,
            BigDecimal amountIn,
            BigDecimal amountOut,
            String transactionContent,
            String referenceNumber,
            OffsetDateTime transactionDate,
            OffsetDateTime paidAt,
            OffsetDateTime createdAt) {
    }

    public record ReconciliationView(
            Integer universityId,
            String universityName,
            BigDecimal totalOriginalAmount,
            BigDecimal totalSubsidyAmount,
            BigDecimal totalFinalAmount,
            int monthlyPasses,
            LocalDate from,
            LocalDate to) {
    }

    public record CreateUniversityRequest(
            @NotBlank @Size(max = 50) String code,
            @NotBlank @Size(max = 150) String name,
            @Size(max = 80) String shortName,
            @Email @Size(max = 100) String contactEmail,
            @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status) {
    }

    public record UpdateUniversityRequest(
            @Size(max = 50) String code,
            @Size(max = 150) String name,
            @Size(max = 80) String shortName,
            @Email @Size(max = 100) String contactEmail,
            @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status) {
    }

    public record CreateCampusRequest(
            @NotBlank @Size(max = 50) String code,
            @NotBlank @Size(max = 150) String name,
            @Size(max = 255) String address,
            BigDecimal latitude,
            BigDecimal longitude,
            @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status) {
    }

    public record CreateDomainRequest(
            @NotBlank @Size(max = 120) String domain,
            @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status) {
    }

    public record UpdateStatusRequest(
            @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED|GRADUATED") String status) {
    }

    public record CreateUniversityAdminRequest(
            @NotNull Integer universityId,
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 100) String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @Size(max = 15) String phoneNumber,
            @Size(max = 100) String title) {
    }

    public record CreateRouteUniversityRequest(
            @NotNull Integer routeId,
            @NotNull Integer universityId,
            Integer campusId,
            LocalDate activeFrom,
            LocalDate activeUntil,
            @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status) {
    }

    public record CreateSubsidyPolicyRequest(
            @NotNull Integer universityId,
            Integer campusId,
            @NotBlank @Size(max = 150) String policyName,
            @NotBlank @Pattern(regexp = "PERCENTAGE|FIXED_AMOUNT") String subsidyType,
            @NotNull BigDecimal value,
            BigDecimal maxAmount,
            LocalDate activeFrom,
            LocalDate activeUntil,
            @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status) {
    }

    public record CreateScopedSubsidyPolicyRequest(
            Integer campusId,
            @NotBlank @Size(max = 150) String policyName,
            @NotBlank @Pattern(regexp = "PERCENTAGE|FIXED_AMOUNT") String subsidyType,
            @NotNull BigDecimal value,
            BigDecimal maxAmount,
            LocalDate activeFrom,
            LocalDate activeUntil,
            @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status) {
    }

    public record CreateUniversityNotificationRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 2000) String content) {
    }
}
