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
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.PurchaseMonthlyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.TicketView;
import com.unibus.api.ticketing.TicketingRepository.ApprovedRegistration;

@Service
public class TicketingService {

    private final TicketingRepository ticketingRepository;

    public TicketingService(TicketingRepository ticketingRepository) {
        this.ticketingRepository = ticketingRepository;
    }

    @Transactional(readOnly = true)
    public PassesDashboard dashboard(CurrentUser currentUser) {
        String studentCode = requireStudentCode(currentUser);
        return new PassesDashboard(
                ticketingRepository.findTickets(studentCode),
                ticketingRepository.findPayments(studentCode));
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
                    TicketView ticket = ticketingRepository.createMonthlyTicket(studentCode, registration, year, month, validFrom, expiresAt, amount);
                    ticketingRepository.createPaidPayment(ticket.ticketId(), amount, method(request));
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
                ? "E_WALLET"
                : request.method();
    }
}
