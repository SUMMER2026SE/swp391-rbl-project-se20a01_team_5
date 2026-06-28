package com.unibus.api.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VNPayConfig {

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final String frontendUrl;

    public VNPayConfig(
            @Value("${app.vnpay.tmn-code:}") String tmnCode,
            @Value("${app.vnpay.hash-secret:}") String hashSecret,
            @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
            @Value("${app.vnpay.return-url:http://localhost:8080/api/v1/payments/vnpay-return}") String returnUrl,
            @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.frontendUrl = frontendUrl;
    }

    public String tmnCode() {
        return tmnCode;
    }

    public String hashSecret() {
        return hashSecret;
    }

    public String payUrl() {
        return payUrl;
    }

    public String returnUrl() {
        return returnUrl;
    }

    public String frontendUrl() {
        return frontendUrl;
    }
}
