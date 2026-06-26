package com.unibus.api.university;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.ticketing.TicketingDtos.MonthlyPassQuote;
import com.unibus.api.university.UniversitySubsidyRepository.StudentUniversity;
import com.unibus.api.university.UniversitySubsidyRepository.SubsidyPolicy;

@Service
public class SubsidyService {

    public static final String STATUS_APPLIED = "APPLIED";
    public static final String STATUS_NOT_VERIFIED = "NOT_VERIFIED";
    public static final String STATUS_NO_UNIVERSITY = "NO_UNIVERSITY";
    public static final String STATUS_ROUTE_NOT_LINKED = "ROUTE_NOT_LINKED";
    public static final String STATUS_NO_ACTIVE_POLICY = "NO_ACTIVE_POLICY";
    public static final String STATUS_NOT_CONFIGURED = "NOT_CONFIGURED";

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final UniversitySubsidyRepository repository;

    public SubsidyService(UniversitySubsidyRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public MonthlyPassQuote quoteFor(CurrentUser currentUser, Integer routeId, String routeName, BigDecimal baseAmount) {
        return quoteFor(currentUser, routeId, routeName, baseAmount, LocalDate.now(ZoneOffset.UTC));
    }

    @Transactional(readOnly = true)
    public MonthlyPassQuote quoteFor(CurrentUser currentUser, Integer routeId, String routeName, BigDecimal baseAmount, LocalDate serviceDate) {
        BigDecimal normalizedBase = money(baseAmount);
        StudentUniversity student = repository.findStudentUniversity(currentUser.userId()).orElse(null);
        if (student == null || !"VERIFIED".equals(student.studentVerificationStatus())) {
            return noSubsidy(routeId, routeName, normalizedBase, STATUS_NOT_VERIFIED);
        }
        if (student.universityId() == null) {
            return noSubsidy(routeId, routeName, normalizedBase, STATUS_NO_UNIVERSITY);
        }
        if (!repository.isRouteLinked(student.universityId(), routeId, serviceDate)) {
            return noSubsidy(routeId, routeName, normalizedBase, STATUS_ROUTE_NOT_LINKED);
        }
        return repository.findActivePolicy(student.universityId(), serviceDate)
                .map(policy -> applied(routeId, routeName, normalizedBase, policy))
                .orElseGet(() -> noSubsidy(routeId, routeName, normalizedBase, STATUS_NO_ACTIVE_POLICY));
    }

    @Transactional(readOnly = true)
    public Set<Integer> activeLinkedRouteIds(CurrentUser currentUser) {
        return repository.findStudentUniversity(currentUser.userId())
                .filter(student -> "VERIFIED".equals(student.studentVerificationStatus()))
                .map(StudentUniversity::universityId)
                .map(universityId -> repository.activeLinkedRouteIds(universityId, LocalDate.now(ZoneOffset.UTC)))
                .orElseGet(Set::of);
    }

    @Transactional(readOnly = true)
    public void requireRouteLinked(CurrentUser currentUser, Integer routeId) {
        StudentUniversity student = repository.findStudentUniversity(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Student verification is required before route access"));
        if (!"VERIFIED".equals(student.studentVerificationStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student verification is required before route access");
        }
        if (student.universityId() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Student university is not linked to a partner university yet");
        }
        if (!repository.isRouteLinked(student.universityId(), routeId, LocalDate.now(ZoneOffset.UTC))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Route is not configured for the student's university");
        }
    }

    public Integer universityIdForName(String universityName) {
        return repository.findUniversityIdByName(universityName).orElse(null);
    }

    private MonthlyPassQuote applied(Integer routeId, String routeName, BigDecimal baseAmount, SubsidyPolicy policy) {
        BigDecimal subsidyAmount = calculateSubsidy(baseAmount, policy);
        BigDecimal payableAmount = money(baseAmount.subtract(subsidyAmount).max(BigDecimal.ZERO));
        return new MonthlyPassQuote(
                routeId,
                routeName,
                baseAmount,
                baseAmount,
                subsidyAmount,
                payableAmount,
                payableAmount,
                STATUS_APPLIED,
                policy.subsidyPolicyId());
    }

    private MonthlyPassQuote noSubsidy(Integer routeId, String routeName, BigDecimal baseAmount, String status) {
        return new MonthlyPassQuote(
                routeId,
                routeName,
                baseAmount,
                baseAmount,
                BigDecimal.ZERO,
                baseAmount,
                baseAmount,
                status,
                null);
    }

    private BigDecimal calculateSubsidy(BigDecimal baseAmount, SubsidyPolicy policy) {
        BigDecimal calculated = "PERCENTAGE".equals(policy.subsidyType())
                ? baseAmount.multiply(policy.value()).divide(ONE_HUNDRED, 0, RoundingMode.HALF_UP)
                : money(policy.value());
        if (policy.maxAmount() != null) {
            calculated = calculated.min(money(policy.maxAmount()));
        }
        return money(calculated.min(baseAmount).max(BigDecimal.ZERO));
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(0, RoundingMode.HALF_UP);
    }
}
