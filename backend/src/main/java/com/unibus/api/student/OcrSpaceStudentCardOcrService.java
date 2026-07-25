package com.unibus.api.student;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

@Service
@ConditionalOnProperty(name = "app.ocr.provider", havingValue = "ocrspace")
public class OcrSpaceStudentCardOcrService implements OcrDocumentProvider {

    private static final String PROVIDER = "ocrspace";

    private final RestClient restClient;
    private final boolean enabled;
    private final boolean failOpenOnError;
    private final String apiKey;
    private final String endpoint;
    private final String language;
    private final String engine;

    public OcrSpaceStudentCardOcrService(
            @Value("${app.ocr.enabled:false}") boolean enabled,
            @Value("${app.ocr.fail-open-on-error:true}") boolean failOpenOnError,
            @Value("${app.ocrspace.api-key:}") String apiKey,
            @Value("${app.ocrspace.endpoint:https://api.ocr.space/parse/image}") String endpoint,
            @Value("${app.ocrspace.language:vnm}") String language,
            @Value("${app.ocrspace.engine:2}") String engine) {
        this.restClient = RestClient.create();
        this.enabled = enabled;
        this.failOpenOnError = failOpenOnError;
        this.apiKey = clean(apiKey);
        this.endpoint = clean(endpoint).isBlank() ? "https://api.ocr.space/parse/image" : clean(endpoint);
        this.language = clean(language).isBlank() ? "vnm" : clean(language);
        this.engine = clean(engine).isBlank() ? "2" : clean(engine);
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
        if (apiKey.isBlank()) {
            return failOrFallback("OCRSPACE_API_KEY_MISSING", "OCR.space API key is not configured", null);
        }

        try {
            Map<?, ?> response = parseImage(cardImage);
            ensureSuccessful(response);
            String rawText = extractRawText(response);
            return new OcrDocumentResult(rawText, null, linesFromRawText(rawText), PROVIDER);
        } catch (OcrProviderException exception) {
            if (failOpenOnError) {
                return fallbackDocument(exception.getMessage());
            }
            throw exception;
        } catch (IOException exception) {
            throw new OcrProviderException("IMAGE_READ_FAILED", "Unable to read the uploaded student card image", exception);
        } catch (RestClientResponseException exception) {
            return failOrFallback("OCRSPACE_REQUEST_FAILED", readableHttpError(exception), exception);
        } catch (RestClientException exception) {
            return failOrFallback("OCRSPACE_REQUEST_FAILED", "OCR.space OCR request failed", exception);
        } catch (RuntimeException exception) {
            return failOrFallback("OCRSPACE_UNAVAILABLE", "OCR.space OCR is unavailable", exception);
        }
    }

    private Map<?, ?> parseImage(MultipartFile cardImage) throws IOException {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource(cardImage));
        body.add("apikey", apiKey);
        body.add("language", language);
        body.add("isOverlayRequired", "false");
        body.add("scale", "true");
        body.add("OCREngine", engine);

        Map<?, ?> response = restClient.post()
                .uri(endpoint)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .header("apikey", apiKey)
                .body(body)
                .retrieve()
                .body(Map.class);
        if (response == null) {
            throw new OcrProviderException("OCRSPACE_EMPTY_RESPONSE", "OCR.space OCR returned an empty response");
        }
        return response;
    }

    private ByteArrayResource fileResource(MultipartFile cardImage) throws IOException {
        String filename = clean(cardImage.getOriginalFilename());
        if (filename.isBlank()) {
            filename = "student-card.jpg";
        }
        String safeFilename = filename;
        return new ByteArrayResource(cardImage.getBytes()) {
            @Override
            public String getFilename() {
                return safeFilename;
            }
        };
    }

    void ensureSuccessful(Map<?, ?> response) {
        Object errored = response.get("IsErroredOnProcessing");
        if (Boolean.TRUE.equals(errored) || "true".equalsIgnoreCase(stringValue(errored))) {
            throw new OcrProviderException("OCRSPACE_PROCESSING_ERROR", extractErrorMessage(response));
        }
    }

    String extractRawText(Map<?, ?> response) {
        Object parsedResults = response.get("ParsedResults");
        if (!(parsedResults instanceof List<?> results) || results.isEmpty()) {
            return "";
        }
        return results.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .map(result -> stringValue(result.get("ParsedText")).trim())
                .filter(text -> !text.isBlank())
                .collect(Collectors.joining("\n"))
                .trim();
    }

    String extractErrorMessage(Map<?, ?> response) {
        String message = readableValue(response.get("ErrorMessage"));
        if (!message.isBlank()) {
            return message;
        }
        String details = readableValue(response.get("ErrorDetails"));
        return details.isBlank() ? "OCR.space OCR request failed" : details;
    }

    List<OcrTextLine> linesFromRawText(String rawText) {
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

    private String readableHttpError(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "OCR.space OCR request failed";
        }
        return responseBody.trim();
    }

    private String readableValue(Object value) {
        if (value instanceof List<?> list) {
            return list.stream()
                    .map(this::stringValue)
                    .filter(text -> !text.isBlank())
                    .collect(Collectors.joining("; "));
        }
        return stringValue(value).trim();
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
