package com.unibus.api.student;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
@ConditionalOnProperty(name = "app.ocr.provider", havingValue = "google", matchIfMissing = true)
public class GoogleVisionStudentCardOcrService implements OcrDocumentProvider {

    private static final String PROVIDER = "google";

    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final boolean enabled;
    private final boolean failOpenOnError;
    private final String credentialsPath;

    public GoogleVisionStudentCardOcrService(
            ObjectMapper objectMapper,
            @Value("${app.ocr.enabled:false}") boolean enabled,
            @Value("${app.ocr.fail-open-on-error:true}") boolean failOpenOnError,
            @Value("${app.google.vision.credentials-path:}") String credentialsPath) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
        this.enabled = enabled;
        this.failOpenOnError = failOpenOnError;
        this.credentialsPath = credentialsPath == null ? "" : credentialsPath.trim();
    }

    @Override
    public String providerName() {
        return PROVIDER;
    }

    @Override
    public OcrDocumentResult extract(MultipartFile cardImage) {
        if (!enabled) {
            return fallbackDocument("OCR is disabled for this environment.");
        }
        if (credentialsPath.isBlank()) {
            return failOrFallback("GOOGLE_CREDENTIALS_MISSING", "Google Vision OCR credentials are not configured", null);
        }

        try {
            Map<String, Object> credentials = readCredentials();
            String accessToken = fetchAccessToken(credentials);
            Map<?, ?> response = annotate(cardImage, accessToken);
            String rawText = extractRawText(response);
            return new OcrDocumentResult(rawText, averageConfidence(response), linesFromRawText(rawText), PROVIDER);
        } catch (OcrProviderException exception) {
            if (failOpenOnError) {
                return fallbackDocument(exception.getMessage());
            }
            throw exception;
        } catch (IOException exception) {
            throw new OcrProviderException("IMAGE_READ_FAILED", "Unable to read the uploaded student card image", exception);
        } catch (RestClientResponseException exception) {
            return failOrFallback(
                    "GOOGLE_REQUEST_FAILED",
                    extractGoogleErrorMessage(exception.getResponseBodyAsString()),
                    exception);
        } catch (RestClientException exception) {
            return failOrFallback("GOOGLE_REQUEST_FAILED", "Google Vision OCR request failed", exception);
        } catch (Exception exception) {
            return failOrFallback("GOOGLE_UNAVAILABLE", "Google Vision OCR is unavailable", exception);
        }
    }

    private Map<String, Object> readCredentials() throws IOException {
        Path path = Path.of(credentialsPath);
        if (!Files.exists(path) || Files.isDirectory(path)) {
            throw new OcrProviderException("GOOGLE_CREDENTIAL_FILE_NOT_FOUND", "Google Vision OCR credential file was not found");
        }
        return objectMapper.readValue(Files.readAllBytes(path), new TypeReference<>() { });
    }

    private String fetchAccessToken(Map<String, Object> credentials) throws Exception {
        long now = Instant.now().getEpochSecond();
        Map<String, Object> header = Map.of("alg", "RS256", "typ", "JWT");
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("iss", stringValue(credentials.get("client_email")));
        claims.put("scope", "https://www.googleapis.com/auth/cloud-vision");
        claims.put("aud", "https://oauth2.googleapis.com/token");
        claims.put("iat", now);
        claims.put("exp", now + 3600);

        String unsigned = base64Url(objectMapper.writeValueAsString(header).getBytes(StandardCharsets.UTF_8))
                + "."
                + base64Url(objectMapper.writeValueAsString(claims).getBytes(StandardCharsets.UTF_8));
        String assertion = unsigned + "." + sign(unsigned, stringValue(credentials.get("private_key")));
        Map<?, ?> token = restClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + assertion)
                .retrieve()
                .body(Map.class);
        String accessToken = token == null ? "" : stringValue(token.get("access_token"));
        if (accessToken.isBlank()) {
            throw new OcrProviderException("GOOGLE_TOKEN_FAILED", "Google Vision OCR token request failed");
        }
        return accessToken;
    }

    private Map<?, ?> annotate(MultipartFile cardImage, String accessToken) throws IOException {
        Map<String, Object> payload = Map.of("requests", List.of(Map.of(
                "image", Map.of("content", Base64.getEncoder().encodeToString(cardImage.getBytes())),
                "features", List.of(Map.of("type", "DOCUMENT_TEXT_DETECTION", "maxResults", 1)))));
        return restClient.post()
                .uri("https://vision.googleapis.com/v1/images:annotate")
                .header("Authorization", "Bearer " + accessToken)
                .body(payload)
                .retrieve()
                .body(Map.class);
    }

    private String extractRawText(Map<?, ?> response) {
        Map<?, ?> first = firstResponse(response);
        Object fullTextAnnotation = first.get("fullTextAnnotation");
        if (fullTextAnnotation instanceof Map<?, ?> annotation) {
            String text = stringValue(annotation.get("text"));
            if (!text.isBlank()) {
                return text.trim();
            }
        }
        Object textAnnotations = first.get("textAnnotations");
        if (textAnnotations instanceof List<?> annotations && !annotations.isEmpty()
                && annotations.get(0) instanceof Map<?, ?> firstAnnotation) {
            return stringValue(firstAnnotation.get("description")).trim();
        }
        return "";
    }

    private String extractGoogleErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Google Vision OCR request failed";
        }
        try {
            Map<?, ?> body = objectMapper.readValue(responseBody.getBytes(StandardCharsets.UTF_8), new TypeReference<>() { });
            Object error = body.get("error");
            if (error instanceof Map<?, ?> errorMap) {
                String message = stringValue(errorMap.get("message"));
                if (!message.isBlank()) {
                    return message;
                }
            }
        } catch (Exception ignored) {
            return "Google Vision OCR request failed";
        }
        return "Google Vision OCR request failed";
    }

    private BigDecimal averageConfidence(Map<?, ?> response) {
        List<BigDecimal> values = new ArrayList<>();
        collectConfidence(firstResponse(response), values);
        if (values.isEmpty()) {
            return null;
        }
        BigDecimal total = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP);
    }

    private void collectConfidence(Object value, List<BigDecimal> values) {
        if (value instanceof Map<?, ?> map) {
            Object confidence = map.get("confidence");
            if (confidence instanceof Number number && hasText(map)) {
                values.add(normalizeConfidence(BigDecimal.valueOf(number.doubleValue())));
            }
            map.values().forEach(child -> collectConfidence(child, values));
        } else if (value instanceof List<?> list) {
            list.forEach(child -> collectConfidence(child, values));
        }
    }

    private boolean hasText(Object value) {
        if (value instanceof Map<?, ?> map) {
            Object text = map.get("text");
            Object description = map.get("description");
            if (!stringValue(text).isBlank() || !stringValue(description).isBlank()) {
                return true;
            }
            return map.values().stream().anyMatch(this::hasText);
        }
        if (value instanceof List<?> list) {
            return list.stream().anyMatch(this::hasText);
        }
        return false;
    }

    private Map<?, ?> firstResponse(Map<?, ?> response) {
        Object responses = response.get("responses");
        if (responses instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> first) {
            Object error = first.get("error");
            if (error instanceof Map<?, ?> errorMap) {
                throw new OcrProviderException("GOOGLE_RESPONSE_ERROR", stringValue(errorMap.get("message")));
            }
            return first;
        }
        return Map.of();
    }

    private List<OcrTextLine> linesFromRawText(String rawText) {
        List<OcrTextLine> lines = new ArrayList<>();
        String[] parts = rawText == null ? new String[0] : rawText.split("\\R");
        for (int i = 0; i < parts.length; i++) {
            if (!parts[i].isBlank()) {
                lines.add(new OcrTextLine(parts[i], null, i));
            }
        }
        return lines;
    }

    private OcrDocumentResult failOrFallback(String errorCode, String message, Throwable cause) {
        if (failOpenOnError) {
            return fallbackDocument(message, errorCode);
        }
        throw new OcrProviderException(errorCode, message, cause);
    }

    private OcrDocumentResult fallbackDocument(String message) {
        return fallbackDocument(message, null);
    }

    private OcrDocumentResult fallbackDocument(String message, String errorCode) {
        return new OcrDocumentResult(message, null, linesFromRawText(message), PROVIDER,
                "OCR is disabled for this environment.".equals(message)
                        ? OcrProcessingStatus.DISABLED
                        : OcrProcessingStatus.FAILED,
                errorCode,
                message);
    }

    private BigDecimal normalizeConfidence(BigDecimal confidence) {
        if (confidence == null) {
            return null;
        }
        BigDecimal normalized = confidence.compareTo(BigDecimal.ONE) > 0
                ? confidence.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                : confidence;
        if (normalized.compareTo(BigDecimal.ZERO) < 0 || normalized.compareTo(BigDecimal.ONE) > 0) {
            return null;
        }
        return normalized.setScale(4, RoundingMode.HALF_UP);
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String sign(String unsignedJwt, String privateKeyPem) throws Exception {
        String normalizedKey = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(normalizedKey);
        PrivateKey privateKey = KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(decoded));
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(unsignedJwt.getBytes(StandardCharsets.UTF_8));
        return base64Url(signature.sign());
    }
}
