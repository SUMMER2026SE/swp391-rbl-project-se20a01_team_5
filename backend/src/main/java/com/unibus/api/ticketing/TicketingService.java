package com.unibus.api.ticketing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.ticketing.TicketingDtos.PassesDashboard;
import com.unibus.api.ticketing.TicketingDtos.MonthlyPassQuote;
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.PurchaseMonthlyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.TicketView;
import com.unibus.api.ticketing.TicketingRepository.ApprovedRegistration;
import com.unibus.api.university.SubsidyService;

@Service
public class TicketingService {

    private final TicketingRepository ticketingRepository;
    private final SubsidyService subsidyService;

    public TicketingService(TicketingRepository ticketingRepository, SubsidyService subsidyService) {
        this.ticketingRepository = ticketingRepository;
        this.subsidyService = subsidyService;
    }

    @Transactional(readOnly = true)
    public PassesDashboard dashboard(CurrentUser currentUser) {
        String studentCode = requireStudentCode(currentUser);
        MonthlyPassQuote quote = ticketingRepository.approvedRegistration(studentCode)
                .map(registration -> {
                    BigDecimal amount = ticketingRepository.monthlyFare(registration.routeId());
                    return subsidyService.quoteFor(currentUser, registration.routeId(), registration.routeName(), amount);
                })
                .orElse(null);
        return new PassesDashboard(
                ticketingRepository.findTickets(studentCode),
                ticketingRepository.findPayments(studentCode),
                quote);
    }

    @Transactional
    public TicketView purchaseMonthlyPass(CurrentUser currentUser, PurchaseMonthlyPassRequest request) {
        String studentCode = requireStudentCode(currentUser);
        ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student must have an approved route registration"));
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        return ticketingRepository.activeMonthlyPass(studentCode, registration.routeId(), year, month)
                .orElseGet(() -> {
                    OffsetDateTime validFrom = now.withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    OffsetDateTime expiresAt = now.plusMonths(1).withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    BigDecimal amount = ticketingRepository.monthlyFare(registration.routeId());
                    MonthlyPassQuote quote = subsidyService.quoteFor(currentUser, registration.routeId(), registration.routeName(), amount, now);
                    ensurePurchasableQuote(quote);
                    TicketView ticket = ticketingRepository.createMonthlyTicket(studentCode, registration, year, month, validFrom, expiresAt, quote);
                    ticketingRepository.createPaidPayment(ticket.ticketId(), quote.finalFareAmount(), method(request));
                    return ticket;
                });
    }

    @Transactional(readOnly = true)
    public List<PaymentView> payments(CurrentUser currentUser) {
        return ticketingRepository.findPayments(requireStudentCode(currentUser));
    }

    private String requireStudentCode(CurrentUser currentUser) {
        return ticketingRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private String method(PurchaseMonthlyPassRequest request) {
        return request == null || request.method() == null || request.method().isBlank()
                ? "BANK_TRANSFER"
                : request.method();
    }

    private void ensurePurchasableQuote(MonthlyPassQuote quote) {
        if (SubsidyService.STATUS_NOT_VERIFIED.equals(quote.subsidyStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student verification is required before buying a monthly pass");
        }
        if (SubsidyService.STATUS_NO_UNIVERSITY.equals(quote.subsidyStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Student university is not linked to a partner university yet");
        }
        if (SubsidyService.STATUS_ROUTE_NOT_LINKED.equals(quote.subsidyStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Route is not configured for the student's university");
        }
    }
}
