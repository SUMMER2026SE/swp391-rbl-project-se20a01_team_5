package com.unibus.api.ticketing;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SePayControllerTests {

    private SePayService sePayService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        sePayService = mock(SePayService.class);
        when(sePayService.getWebhookApiKey()).thenReturn("test-webhook-key");
        mockMvc = MockMvcBuilders.standaloneSetup(new SePayController(sePayService)).build();
    }

    @Test
    void webhookRejectsMissingApiKey() throws Exception {
        mockMvc.perform(post("/api/v1/payments/sepay/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verify(sePayService, never()).processWebhook(anyMap());
    }

    @Test
    void webhookRejectsInvalidApiKey() throws Exception {
        mockMvc.perform(post("/api/v1/payments/sepay/webhook")
                        .header("Authorization", "Apikey wrong-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verify(sePayService, never()).processWebhook(anyMap());
    }

    @Test
    void webhookAcceptsConfiguredApiKey() throws Exception {
        when(sePayService.processWebhook(anyMap())).thenReturn(Map.of("processed", true));

        mockMvc.perform(post("/api/v1/payments/sepay/webhook")
                        .header("Authorization", "Apikey test-webhook-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(sePayService).processWebhook(anyMap());
    }
}
