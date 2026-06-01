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
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import com.unibus.api.common.ApiException;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
public class GoogleVisionStudentCardOcrService implements StudentCardOcrService {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern STUDENT_CODE_PATTERN = Pattern.compile(
            "(?:MSSV|MÃ\\s*SỐ\\s*SV|MÃ\\s*SINH\\s*VIÊN|STUDENT\\s*ID)\\s*[:\\-]?\\s*([A-Z0-9][A-Z0-9\\-]{4,19})",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern FALLBACK_CODE_PATTERN = Pattern.compile("\\b[A-Z]{1,5}[0-9][A-Z0-9\\-]{4,18}\\b");

    private final ObjectMapper objectMapper;
    private final UniversityCatalog universityCatalog;
    private final RestClient restClient;
    private final boolean enabled;
    private final String credentialsPath;

    public GoogleVisionStudentCardOcrService(
            ObjectMapper objectMapper,
            UniversityCatalog universityCatalog,
            @Value("${app.ocr.enabled:false}") boolean enabled,
            @Value("${app.google.vision.credentials-path:}") String credentialsPath) {
        this.objectMapper = objectMapper;
        this.universityCatalog = universityCatalog;
        this.restClient = RestClient.create();
        this.enabled = enabled;
        this.credentialsPath = credentialsPath == null ? "" : credentialsPath.trim();
    }

    @Override
    public Result extract(
            MultipartFile cardImage,
            String expectedFullName,
            String expectedStudentCode,
            String expectedUniversity) {
        if (!enabled) {
            return fallback(expectedFullName, expectedStudentCode, expectedUniversity, "OCR is disabled for this environment.");
        }
        if (credentialsPath.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google Vision OCR credentials are not configured");
        }

        try {
            Map<String, Object> credentials = readCredentials();
            String accessToken = fetchAccessToken(credentials);
            Map<?, ?> response = annotate(cardImage, accessToken);
            String rawText = extractRawText(response);
            if (rawText.isBlank()) {
                return fallback(expectedFullName, expectedStudentCode, expectedUniversity, "Google Vision did not detect text.");
            }
            return new Result(
                    detectFullName(rawText, expectedFullName),
                    detectStudentCode(rawText, expectedStudentCode),
                    detectUniversity(rawText, expectedUniversity),
                    rawText,
                    averageConfidence(response));
        } catch (ApiException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read the uploaded student card image");
        } catch (RestClientResponseException exception) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    extractGoogleErrorMessage(exception.getResponseBodyAsString()));
        } catch (RestClientException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google Vision OCR request failed");
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google Vision OCR is unavailable");
        }
    }

    private Map<String, Object> readCredentials() throws IOException {
        Path path = Path.of(credentialsPath);
        if (!Files.exists(path) || Files.isDirectory(path)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google Vision OCR credential file was not found");
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
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google Vision OCR token request failed");
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
            return BigDecimal.ZERO;
        }
        BigDecimal total = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP);
    }

    private void collectConfidence(Object value, List<BigDecimal> values) {
        if (value instanceof Map<?, ?> map) {
            Object confidence = map.get("confidence");
            if (confidence instanceof Number number) {
                values.add(BigDecimal.valueOf(number.doubleValue()));
            }
            map.values().forEach(child -> collectConfidence(child, values));
        } else if (value instanceof List<?> list) {
            list.forEach(child -> collectConfidence(child, values));
        }
    }

    private Map<?, ?> firstResponse(Map<?, ?> response) {
        Object responses = response.get("responses");
        if (responses instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> first) {
            Object error = first.get("error");
            if (error instanceof Map<?, ?> errorMap) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, stringValue(errorMap.get("message")));
            }
            return first;
        }
        return Map.of();
    }

    private String detectFullName(String rawText, String expectedFullName) {
        if (containsNormalized(rawText, expectedFullName)) {
            return expectedFullName;
        }
        return rawText.lines()
                .map(String::trim)
                .filter(line -> line.split("\\s+").length >= 2)
                .filter(line -> !line.matches(".*\\d.*"))
                .filter(line -> universityCatalog.detectInText(line).isBlank())
                .findFirst()
                .orElse("");
    }

    private String detectStudentCode(String rawText, String expectedStudentCode) {
        if (containsNormalized(rawText, expectedStudentCode)) {
            return expectedStudentCode;
        }
        Matcher matcher = STUDENT_CODE_PATTERN.matcher(rawText);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        matcher = FALLBACK_CODE_PATTERN.matcher(rawText.toUpperCase(Locale.ROOT));
        return matcher.find() ? matcher.group().trim() : "";
    }

    private String detectUniversity(String rawText, String expectedUniversity) {
        String detected = universityCatalog.detectInText(rawText);
        if (!detected.isBlank()) {
            return detected;
        }
        return universityCatalog.textMentions(rawText, expectedUniversity) ? expectedUniversity : "";
    }

    private Result fallback(String fullName, String studentCode, String university, String message) {
        return new Result(fullName, studentCode, university, message, BigDecimal.ZERO);
    }

    private boolean containsNormalized(String haystack, String needle) {
        String normalizedNeedle = normalize(needle);
        return !normalizedNeedle.isBlank() && normalize(haystack).contains(normalizedNeedle);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return DIACRITICS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD))
                .replaceAll("")
                .replace('Đ', 'D')
                .replace('đ', 'd')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String sign(String input, String privateKeyPem) throws Exception {
        String pemBody = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        PrivateKey privateKey = KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pemBody)));
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(input.getBytes(StandardCharsets.UTF_8));
        return base64Url(signature.sign());
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }
}
