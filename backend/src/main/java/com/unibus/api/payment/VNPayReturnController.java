package com.unibus.api.payment;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.ticketing.TicketingService;

@RestController
@RequestMapping("/api/v1/payments")
public class VNPayReturnController {

    private final TicketingService ticketingService;

    public VNPayReturnController(TicketingService ticketingService) {
        this.ticketingService = ticketingService;
    }

    @GetMapping("/vnpay-return")
    ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", ticketingService.handleVnpayReturn(params))
                .build();
    }
}
