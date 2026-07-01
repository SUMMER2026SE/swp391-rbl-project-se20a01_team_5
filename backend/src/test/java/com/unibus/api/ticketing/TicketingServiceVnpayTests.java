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
import com.unibus.api.ticketing.TicketingDtos.MonthlyPassQuote;
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.university.SubsidyService;
import com.unibus.api.user.model.UserRole;

class TicketingServiceVnpayTests {

    private static final String HASH_SECRET = "test-secret";

    private TicketingRepository ticketingRepository;
    private SubsidyService subsidyService;
    private TicketingService ticketingService;

    @BeforeEach
    void setUp() {
        ticketingRepository = mock(TicketingRepository.class);
        subsidyService = mock(SubsidyService.class);
        ticketingService = new TicketingService(ticketingRepository, subsidyService, new VNPayConfig(
                "TESTTMN",
                HASH_SECRET,
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                "http://localhost:8080/api/v1/payments/vnpay-return",
                "http://localhost:3000"));
    }

    @Test
    void handleVnpayReturnMarksPaymentPaidWhenSignatureAndResponseCodeAreValid() {
        PaymentView pendingPayment = payment("PENDING");
        PaymentView paidPayment = payment("PAID");

        when(ticketingRepository.findPaymentByTransactionCode("VNP123")).thenReturn(Optional.of(pendingPayment));
        when(ticketingRepository.markPaymentPaid(10)).thenReturn(paidPayment);

        String redirectUrl = ticketingService.handleVnpayReturn(signedReturnParams("VNP123", "00"));

        assertThat(redirectUrl).contains("/student/payment/result").contains("status=success");
        verify(ticketingRepository).markPaymentPaid(10);
        verify(ticketingRepository, never()).markPaymentFailed(any(Integer.class));
    }

    @Test
    void handleVnpayReturnFailsWhenTxnRefDoesNotMatchPayment() {
        when(ticketingRepository.findPaymentByTransactionCode("UNKNOWN")).thenReturn(Optional.empty());

        String redirectUrl = ticketingService.handleVnpayReturn(signedReturnParams("UNKNOWN", "00", "00"));

        assertThat(redirectUrl).contains("/student/payment/result").contains("status=success");
        assertThat(redirectUrl).doesNotContain("paymentId=");
        verify(ticketingRepository, never()).markPaymentPaid(any(Integer.class));
        verify(ticketingRepository, never()).markPaymentFailed(any(Integer.class));
    }

    @Test
    void handleVnpayReturnFailsWhenTransactionStatusIsNotSuccessful() {
        PaymentView pendingPayment = payment("PENDING");
        when(ticketingRepository.findPaymentByTransactionCode("VNP123")).thenReturn(Optional.of(pendingPayment));
        when(ticketingRepository.markPaymentFailed(10)).thenReturn(payment("FAILED"));

        String redirectUrl = ticketingService.handleVnpayReturn(signedReturnParams("VNP123", "00", "02"));

        assertThat(redirectUrl).contains("/student/payment/result").contains("status=failed");
        verify(ticketingRepository).markPaymentFailed(10);
        verify(ticketingRepository, never()).markPaymentPaid(any(Integer.class));
    }

    @Test
    void createVnpayPaymentUrlUsesSubsidizedQuoteAndCreatesPendingPayment() {
        var currentUser = new com.unibus.api.security.CurrentUser(1, "student@example.com", UserRole.STUDENT, 1L);
        var registration = new TicketingRepository.ApprovedRegistration(
                1, 30, "Route A", 100, "Campus", 200, "Dormitory");
        MonthlyPassQuote quote = new MonthlyPassQuote(
                30, "Route A", BigDecimal.valueOf(50000), BigDecimal.valueOf(50000), BigDecimal.ZERO,
                BigDecimal.valueOf(50000), BigDecimal.valueOf(50000), SubsidyService.STATUS_NOT_CONFIGURED, null);
        PaymentView pendingPayment = payment("PENDING");

        when(ticketingRepository.studentCodeForUser(1)).thenReturn(Optional.of("SE001"));
        when(ticketingRepository.approvedRegistration("SE001")).thenReturn(Optional.of(registration));
        when(ticketingRepository.monthlyFare(30)).thenReturn(BigDecimal.valueOf(50000));
        when(subsidyService.quoteFor(eq(currentUser), eq(30), eq("Route A"), eq(BigDecimal.valueOf(50000))))
                .thenReturn(quote);
        when(ticketingRepository.createPendingVnpayPayment(eq("SE001"), eq(BigDecimal.valueOf(50000)), any(String.class)))
                .thenReturn(pendingPayment);

        var result = ticketingService.createVnpayPaymentUrl(currentUser, null, "127.0.0.1");

        assertThat(result.paymentId()).isEqualTo(10);
        assertThat(result.amount()).isEqualByComparingTo(BigDecimal.valueOf(50000));
        assertThat(result.paymentUrl()).contains("sandbox.vnpayment.vn");
    }

    private PaymentView payment(String status) {
        return new PaymentView(
                10,
                null,
                BigDecimal.valueOf(50000),
                BigDecimal.valueOf(50000),
                BigDecimal.ZERO,
                BigDecimal.valueOf(50000),
                "E_WALLET",
                status,
                "VNP123",
                "MONTHLY",
                "Route A",
                null,
                null,
                OffsetDateTime.now());
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
