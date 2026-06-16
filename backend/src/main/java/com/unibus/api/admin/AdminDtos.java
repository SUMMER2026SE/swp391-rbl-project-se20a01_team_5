package com.unibus.api.admin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record AdminUserSummary(
            Integer id,
            String code,
            String name,
            String email,
            String phoneNumber,
            UserRole role,
            UserStatus status,
            String lockReason,
            OffsetDateTime joinedAt) {
    }

    public record CreateStaffAccountRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email @Size(max = 100) String email,
            @Size(max = 15) String phoneNumber,
            @NotNull UserRole role,
            @NotBlank @Size(min = 6, max = 72) String password) {
    }

    public record UpdateUserStatusRequest(
            @NotNull UserStatus status,
            @Size(max = 500) String reason) {
    }

    public record AdminCaseSummary(
            Integer id,
            String code,
            String type,
            String title,
            String category,
            String content,
            String reporter,
            Integer targetUserId,
            String target,
            String priority,
            String status,
            String resolution,
            String handledBy,
            OffsetDateTime createdAt,
            OffsetDateTime closedAt) {
    }

    public record UpdateCaseStatusRequest(
            @NotBlank String status,
            @Size(max = 2000) String resolution) {
    }

    public record AdminNoteRequest(@NotBlank @Size(max = 2000) String content) {
    }

    public record AdminNote(
            Long id,
            String sender,
            String content,
            OffsetDateTime sentAt) {
    }

    public record DashboardSummary(
            BigDecimal todayRevenue,
            long studentCount,
            long driverCount,
            long todayTripCount,
            long pendingCaseCount,
            List<RevenuePoint> revenueLast7Days,
            List<RoleCount> userRoleCounts,
            List<SchoolCount> studentsBySchool) {
    }

    public record RevenuePoint(LocalDate day, BigDecimal amount) {
    }

    public record RoleCount(UserRole role, long total) {
    }

    public record SchoolCount(String school, long total) {
    }

    public record RoutePricingOption(Integer id, String name) {
    }

    public record FareSummary(
            Integer id,
            Integer routeId,
            String routeName,
            String fareType,
            BigDecimal amount,
            LocalDate effectiveFrom,
            LocalDate effectiveUntil,
            String notes) {
    }

    public record FareUpdateRequest(
            Integer routeId,
            @NotBlank String fareType,
            @NotNull @Min(0) BigDecimal amount,
            LocalDate effectiveFrom,
            LocalDate effectiveUntil,
            @Size(max = 500) String notes) {
    }

    public record BroadcastNotificationRequest(
            @NotBlank String target,
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 2000) String content) {
    }

    public record BroadcastNotificationResult(long createdMessages) {
    }
}
