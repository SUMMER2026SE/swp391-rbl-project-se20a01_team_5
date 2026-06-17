package com.unibus.api.admin;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public final class AdminMonthlyPassDtos {

    private AdminMonthlyPassDtos() {
    }

    public record MonthlyPassAdminView(
            Integer monthlyPassId,
            String studentCode,
            String studentName,
            String email,
            Integer routeId,
            String routeName,
            Integer effectiveMonth,
            Integer effectiveYear,
            OffsetDateTime validFrom,
            OffsetDateTime expiresAt,
            BigDecimal fareAmount,
            String status,
            OffsetDateTime purchasedAt) {
    }
}
