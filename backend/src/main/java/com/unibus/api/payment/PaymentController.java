package com.unibus.api.payment;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;

@RestController
@RequestMapping("/api/v1/students/me/payments")
@PreAuthorize("hasRole('STUDENT')")
public class PaymentController {

    private final PayosService payosService;

    public PaymentController(PayosService payosService) {
        this.payosService = payosService;
    }

    @PostMapping("/payos-link")
    public ApiResponse<Map<String, String>> createLink(@RequestBody Map<String, String> request) {
        String type = request.getOrDefault("type", "monthly");
        String checkoutUrl = payosService.createPaymentLink(type);
        return ApiResponse.ok("PayOS checkout link created", Map.of("checkoutUrl", checkoutUrl));
    }
}
