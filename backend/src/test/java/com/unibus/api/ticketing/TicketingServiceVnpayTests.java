package com.unibus.api.ticketing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.unibus.api.payment.VNPayConfig;
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.TicketView;
import com.unibus.api.ticketing.TicketingRepository.ApprovedRegistration;

class TicketingServiceVnpayTests {

    private static final String HASH_SECRET = "test-secret";

    private TicketingRepository ticketingRepository;
    private TicketingService ticketingService;

    @BeforeEach
    void setUp() {
        ticketingRepository = mock(TicketingRepository.class);
        ticketingService = new TicketingService(ticketingRepository, new VNPayConfig(
                "TESTTMN",
                HASH_SECRET,
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                "http://localhost:8080/api/v1/payments/vnpay-return",
                "http://localhost:3000"));
    }

    @Test
    void handleVnpayReturnCompletesPendingPaymentWhenSignatureAndResponseCodeAreValid() {
        PaymentView pendingPayment = new PaymentView(
                10,
                null,
                BigDecimal.valueOf(50000),
                "E_WALLET",
                "PENDING",
                "VNP123",
                null,
                null,
                OffsetDateTime.now());
        TicketView ticket = new TicketView(
                20,
                "MONTHLY",
                30,
                "Route A",
                "Campus",
                "Dormitory",
                6,
                2026,
                OffsetDateTime.now(),
                OffsetDateTime.now().plusMonths(1),
                BigDecimal.valueOf(50000),
                "QR-123",
                "ACTIVE",
                OffsetDateTime.now());

        when(ticketingRepository.findByTransactionCode("VNP123")).thenReturn(Optional.of(pendingPayment));
        when(ticketingRepository.paidMonthlyPassForPayment(10)).thenReturn(Optional.empty());
        when(ticketingRepository.studentCodeForPayment(10)).thenReturn(Optional.of("SE001"));
        when(ticketingRepository.approvedRegistration("SE001")).thenReturn(Optional.of(new ApprovedRegistration(
                1, 30, "Route A", 100, "Campus", 200, "Dormitory")));
        when(ticketingRepository.activeMonthlyPass(eq("SE001"), eq(30), any(Integer.class), any(Integer.class)))
                .thenReturn(Optional.empty());
        when(ticketingRepository.createMonthlyTicket(eq("SE001"), any(ApprovedRegistration.class), any(Integer.class),
                any(Integer.class), any(OffsetDateTime.class), any(OffsetDateTime.class), eq(BigDecimal.valueOf(50000))))
                .thenReturn(ticket);
        when(ticketingRepository.attachPaidMonthlyPass(10, 20)).thenReturn(pendingPayment);

        String redirectUrl = ticketingService.handleVnpayReturn(signedReturnParams("VNP123", "00"));

        assertThat(redirectUrl).contains("/student/payment/result").contains("status=success");
        verify(ticketingRepository).attachPaidMonthlyPass(10, 20);
        verify(ticketingRepository, never()).markPaymentFailed(eq(10), any(String.class));
    }

    @Test
    void handleVnpayReturnFailsWhenTxnRefDoesNotMatchPayment() {
        when(ticketingRepository.findByTransactionCode("UNKNOWN")).thenReturn(Optional.empty());

        String redirectUrl = ticketingService.handleVnpayReturn(signedReturnParams("UNKNOWN", "00", "00"));

        assertThat(redirectUrl).contains("/student/payment/result").contains("status=failed");
        verify(ticketingRepository, never()).attachPaidMonthlyPass(any(Integer.class), any(Integer.class));
        verify(ticketingRepository, never()).markPaymentFailed(any(Integer.class), any(String.class));
    }

    @Test
    void handleVnpayReturnFailsWhenTransactionStatusIsNotSuccessful() {
        PaymentView pendingPayment = new PaymentView(
                10,
                null,
                BigDecimal.valueOf(50000),
                "E_WALLET",
                "PENDING",
                "VNP123",
                null,
                null,
                OffsetDateTime.now());
        when(ticketingRepository.findByTransactionCode("VNP123")).thenReturn(Optional.of(pendingPayment));
        when(ticketingRepository.markPaymentFailed(eq(10), any(String.class))).thenReturn(pendingPayment);

        String redirectUrl = ticketingService.handleVnpayReturn(signedReturnParams("VNP123", "00", "02"));

        assertThat(redirectUrl).contains("/student/payment/result").contains("status=failed");
        verify(ticketingRepository).markPaymentFailed(eq(10), any(String.class));
        verify(ticketingRepository, never()).attachPaidMonthlyPass(any(Integer.class), any(Integer.class));
    }

    private Map<String, String> signedReturnParams(String txnRef, String responseCode) {
        return signedReturnParams(txnRef, responseCode, responseCode);
    }

    private Map<String, String> signedReturnParams(String txnRef, String responseCode, String transactionStatus) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", "5000000");
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_OrderInfo", "Thanh toan ve thang UniBus " + txnRef);
        params.put("vnp_ResponseCode", responseCode);
        params.put("vnp_TmnCode", "TESTTMN");
        params.put("vnp_TransactionStatus", transactionStatus);
        params.put("vnp_TransactionNo", "12345678");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_SecureHash", hmacSha512(HASH_SECRET, buildQuery(params)));
        return params;
    }

    private String buildQuery(Map<String, String> params) {
        List<String> pairs = new ArrayList<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            pairs.add(encode(entry.getKey()) + "=" + encode(entry.getValue()));
        }
        return String.join("&", pairs);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte item : bytes) {
                hash.append(String.format(Locale.ROOT, "%02x", item));
            }
            return hash.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign VNPay test params", exception);
        }
    }
}
