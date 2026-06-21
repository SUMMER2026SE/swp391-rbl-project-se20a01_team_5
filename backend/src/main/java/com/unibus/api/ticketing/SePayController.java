package com.unibus.api.ticketing;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;

@RestController
public class SePayController {

    private final SePayService sePayService;

    public SePayController(SePayService sePayService) {
        this.sePayService = sePayService;
    }

    @PostMapping("/api/v1/students/me/payments/sepay/order")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<Map<String, Object>> createOrder(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody Map<String, String> request) {
        String ticketType = request.get("ticketType");
        if (ticketType == null || ticketType.isBlank()) {
            ticketType = "monthly";
        }
        Map<String, Object> orderDetails = sePayService.createOrder(currentUser, ticketType);
        return ApiResponse.ok("Payment order created", orderDetails);
    }

    @GetMapping("/api/v1/students/me/payments/sepay/order/{orderId}/status")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<Map<String, Object>> getOrderStatus(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long orderId) {
        Map<String, Object> statusDetails = sePayService.getOrderStatus(currentUser, orderId);
        return ApiResponse.ok("Order status retrieved", statusDetails);
    }

    @PostMapping({"/api/v1/payments/sepay/webhook", "/sepay_webhook.php"})
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody Map<String, Object> payload) {
        try {
            sePayService.processWebhook(payload);
            return ResponseEntity.ok(Map.of("success", true, "message", "Webhook processed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error processing webhook: " + e.getMessage()));
        }
    }
}
