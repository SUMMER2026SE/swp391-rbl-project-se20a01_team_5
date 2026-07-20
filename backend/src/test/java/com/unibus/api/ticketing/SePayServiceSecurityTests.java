package com.unibus.api.ticketing;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Map;
import java.time.Instant;
import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.university.SubsidyService;
import com.unibus.api.user.model.UserRole;

class SePayServiceSecurityTests {
    @Test
    void singleTicketExpiresAtEndOfVietnamBusinessDay() {
        SePayService service = new SePayService(mock(JdbcTemplate.class), mock(TicketingRepository.class), mock(SubsidyService.class));
        OffsetDateTime expiry = service.singleTicketExpiry(Instant.parse("2026-07-17T01:30:00Z"));
        org.assertj.core.api.Assertions.assertThat(expiry.toInstant()).isEqualTo(Instant.parse("2026-07-17T16:59:59Z"));
    }

    @Test
    void invalidSingleTicketStopPairIsRejected() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.eq(Integer.class),
                org.mockito.ArgumentMatchers.eq(2), org.mockito.ArgumentMatchers.eq(59), org.mockito.ArgumentMatchers.eq(36))).thenReturn(0);
        SePayService service = new SePayService(jdbcTemplate, mock(TicketingRepository.class), mock(SubsidyService.class));
        assertThatThrownBy(() -> service.validateSingleStopPair(2, 59, 36))
                .isInstanceOf(ApiException.class).hasMessageContaining("Điểm lên/xuống không hợp lệ");
    }

    @Test
    void testTicketTypeIsRejected() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        TicketingRepository ticketingRepository = mock(TicketingRepository.class);
        SubsidyService subsidyService = mock(SubsidyService.class);
        when(ticketingRepository.studentCodeForUser(1)).thenReturn(Optional.of("STUDENT001"));
        SePayService service = new SePayService(jdbcTemplate, ticketingRepository, subsidyService);

        assertThatThrownBy(() -> service.createOrder(
                new CurrentUser(1, "student@unibus.local", UserRole.STUDENT, 1L),
                Map.of("ticketType", "weekly")))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
