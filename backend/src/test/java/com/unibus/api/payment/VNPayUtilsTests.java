package com.unibus.api.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

class VNPayUtilsTests {

    private final VNPayConfig config = new VNPayConfig(
            "TESTTMN",
            "test-secret",
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            "http://localhost:8080/api/v1/payments/vnpay-return",
            "http://localhost:3000");

    @Test
    void buildPaymentUrlSignsRequiredVnpayParams() {
        String paymentUrl = VNPayUtils.buildPaymentUrl(config, BigDecimal.valueOf(50000), "VNP123", "127.0.0.1");

        Map<String, String> params = queryParams(paymentUrl);

        assertThat(paymentUrl).startsWith(config.payUrl());
        assertThat(params)
                .containsEntry("vnp_TmnCode", "TESTTMN")
                .containsEntry("vnp_TxnRef", "VNP123")
                .containsEntry("vnp_Amount", "5000000")
                .containsEntry("vnp_ReturnUrl", config.returnUrl());
        assertThat(params.get("vnp_ExpireDate")).isNotBlank();
        assertThat(VNPayUtils.verifyReturn(config, params)).isTrue();
    }

    @Test
    void verifyReturnRejectsTamperedAmount() {
        String paymentUrl = VNPayUtils.buildPaymentUrl(config, BigDecimal.valueOf(50000), "VNP123", "127.0.0.1");
        Map<String, String> params = queryParams(paymentUrl);

        params.put("vnp_Amount", "1000000");

        assertThat(VNPayUtils.verifyReturn(config, params)).isFalse();
    }

    private Map<String, String> queryParams(String url) {
        String query = url.substring(url.indexOf('?') + 1);
        return Arrays.stream(query.split("&"))
                .map(pair -> pair.split("=", 2))
                .collect(Collectors.toMap(
                        item -> decode(item[0]),
                        item -> item.length > 1 ? decode(item[1]) : ""));
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
