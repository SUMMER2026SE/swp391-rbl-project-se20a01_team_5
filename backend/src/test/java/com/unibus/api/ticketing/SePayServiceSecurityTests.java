package com.unibus.api.ticketing;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.university.SubsidyService;
import com.unibus.api.user.model.UserRole;

class SePayServiceSecurityTests {

    @Test
    void testTicketTypeIsRejected() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        TicketingRepository ticketingRepository = mock(TicketingRepository.class);
        SubsidyService subsidyService = mock(SubsidyService.class);
        when(ticketingRepository.studentCodeForUser(1)).thenReturn(Optional.of("STUDENT001"));
        SePayService service = new SePayService(jdbcTemplate, ticketingRepository, subsidyService);

        assertThatThrownBy(() -> service.createOrder(
                new CurrentUser(1, "student@unibus.local", UserRole.STUDENT, 1L),
                "test", null, null, null))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
