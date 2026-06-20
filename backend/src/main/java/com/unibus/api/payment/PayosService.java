package com.unibus.api.payment;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibus.api.common.ApiException;

@Service
public class PayosService {

    @Value("${payos.client.id:YOUR_CLIENT_ID}")
    private String clientId;

    @Value("${payos.api.key:YOUR_API_KEY}")
    private String apiKey;

    @Value("${payos.checksum.key:YOUR_CHECKSUM_KEY}")
    private String checksumKey;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public PayosService() {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder().build();
    }

    public String createPaymentLink(String ticketType) {
        if ("YOUR_CLIENT_ID".equals(clientId)) {
            // Mock mode if not configured
            return frontendUrl + "/student";
        }

        long amount;
        String prefix;
        if ("single".equalsIgnoreCase(ticketType)) {
            amount = 7000;
            prefix = "UB1";
        } else if ("monthly".equalsIgnoreCase(ticketType)) {
            amount = 120000;
            prefix = "UB2";
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid ticket type");
        }

        long orderCode = Long.parseLong(String.format("%d%03d", System.currentTimeMillis() / 1000, (int) (Math.random() * 1000)));
        String description = prefix + " " + orderCode;
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        String returnUrl = frontendUrl + "/student";
        String cancelUrl = frontendUrl + "/student";

        try {
            String signData = "amount=" + amount +
                              "&cancelUrl=" + cancelUrl +
                              "&description=" + description +
                              "&orderCode=" + orderCode +
                              "&returnUrl=" + returnUrl;

            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(signData.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            String signature = hexString.toString();

            Map<String, Object> body = new HashMap<>();
            body.put("orderCode", orderCode);
            body.put("amount", amount);
            body.put("description", description);
            body.put("returnUrl", returnUrl);
            body.put("cancelUrl", cancelUrl);
            body.put("signature", signature);

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api-merchant.payos.vn/v2/payment-requests"))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode root = objectMapper.readTree(response.body());
            if ("00".equals(root.path("code").asText())) {
                return root.path("data").path("checkoutUrl").asText();
            } else {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "PayOS Error: " + root.path("desc").asText());
            }

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create PayOS link: " + e.getMessage());
        }
    }
}

