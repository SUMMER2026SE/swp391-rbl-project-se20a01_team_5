package com.unibus.api.ticketing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.unibus.api.common.ApiException;
import com.unibus.api.payment.VNPayConfig;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.ticketing.TicketingDtos.MonthlyPassQuote;
import com.unibus.api.university.SubsidyService;
import com.unibus.api.user.model.UserRole;

class TicketingServiceQuoteTests {

    private final CurrentUser currentUser = new CurrentUser(1, "student@unibus.local", UserRole.STUDENT, 1L);
    private TicketingRepository ticketingRepository;
    private SubsidyService subsidyService;
    private TicketingService service;

    @BeforeEach
    void setUp() {
        ticketingRepository = mock(TicketingRepository.class);
        subsidyService = mock(SubsidyService.class);
        service = new TicketingService(ticketingRepository, subsidyService,
                new VNPayConfig("tmn", "secret", "https://pay", "https://return", "https://frontend"));
        when(ticketingRepository.studentCodeForUser(1)).thenReturn(Optional.of("27211200001"));
    }

    @Test
    void singleQuoteDoesNotRequireRouteRegistration() {
        MonthlyPassQuote quote = new MonthlyPassQuote(58, "Route 12", BigDecimal.valueOf(5000),
                BigDecimal.valueOf(5000), BigDecimal.valueOf(2500), BigDecimal.valueOf(2500),
                BigDecimal.valueOf(2500), SubsidyService.STATUS_APPLIED, 76);
        when(ticketingRepository.activeRouteName(58)).thenReturn(Optional.of("Route 12"));
        when(ticketingRepository.singleFare(58)).thenReturn(BigDecimal.valueOf(5000));
        when(subsidyService.quoteFor(currentUser, 58, "Route 12", BigDecimal.valueOf(5000))).thenReturn(quote);

        MonthlyPassQuote result = service.quote(currentUser, 58, "SINGLE");

        assertThat(result.subsidyAmount()).isEqualByComparingTo("2500");
        assertThat(result.finalFareAmount()).isEqualByComparingTo("2500");
        verify(ticketingRepository).activeRouteName(58);
    }

    @Test
    void monthlyQuoteStillRequiresApprovedRegistration() {
        when(ticketingRepository.approvedRegistration("27211200001", 58)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.quote(currentUser, 58, "MONTHLY"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("approved route registration");
    }
}
