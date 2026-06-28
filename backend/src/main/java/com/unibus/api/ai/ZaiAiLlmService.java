package com.unibus.api.ai;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibus.api.ai.AiLlmService.AiPrompt;
import com.unibus.api.ai.AiLlmService.LlmResult;

@Service
public class ZaiAiLlmService implements AiLlmService {

    private static final Logger log = LoggerFactory.getLogger(ZaiAiLlmService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String provider;
    private final String apiKey;
    private final String baseUrl;
    private final String modelId;
    private final int maxOutputTokens;
    private final double temperature;
    private volatile AiDtos.AiProviderStatus lastStatus;
    private volatile Instant circuitOpenUntil = Instant.EPOCH;

    public ZaiAiLlmService(
            @Value("${app.ai.enabled:false}") boolean enabled,
            @Value("${app.ai.provider:bedrock}") String provider,
            @Value("${app.ai.zai.api-key:}") String apiKey,
            @Value("${app.ai.zai.base-url:https://api.z.ai/api/paas/v4/}") String baseUrl,
            @Value("${app.ai.zai.model-id:glm-4.5-flash}") String modelId,
            @Value("${app.ai.max-output-tokens:1200}") int maxOutputTokens,
            @Value("${app.ai.temperature:0.2}") double temperature) {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.enabled = enabled;
        this.provider = provider == null ? "bedrock" : provider.trim();
        this.apiKey = firstNonBlank(apiKey, System.getenv("ZAI_API_KEY"), windowsUserEnv("ZAI_API_KEY"));
        this.baseUrl = normalizeBaseUrl(firstNonBlank(baseUrl, System.getenv("ZAI_BASE_URL"), windowsUserEnv("ZAI_BASE_URL")));
        this.modelId = firstNonBlank(windowsUserEnv("ZAI_MODEL_ID"), modelId, System.getenv("ZAI_MODEL_ID"), "glm-4.5-flash");
        this.maxOutputTokens = Math.max(128, maxOutputTokens);
        this.temperature = Math.max(0, Math.min(1, temperature));
        this.lastStatus = status("READY", null, null);
    }

    @Override
    public Optional<LlmResult> complete(AiPrompt prompt) {
        if (!enabled) {
            lastStatus = status("DISABLED", null, "AI is disabled");
            return Optional.empty();
        }
        if (Instant.now().isBefore(circuitOpenUntil)) {
            lastStatus = status("CIRCUIT_OPEN", "COOLDOWN", "Z.ai is temporarily skipped after a provider failure");
            return Optional.empty();
        }
        if (apiKey.isBlank()) {
            lastStatus = status("UNAVAILABLE", "MISSING_KEY", "ZAI_API_KEY is not configured");
            openCircuit();
            log.warn("Z.ai AI completion skipped because ZAI_API_KEY is not configured");
            return Optional.empty();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "chat/completions"))
                    .timeout(Duration.ofSeconds(45))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("Accept-Language", "vi-VN,vi,en-US,en")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody(prompt)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                ProviderError providerError = providerError(response.body());
                lastStatus = status("UNAVAILABLE", providerError.code(), providerError.message());
                openCircuit();
                log.warn("Z.ai AI completion failed with HTTP {}: {}", response.statusCode(), truncate(response.body()));
                return Optional.empty();
            }
            String text = parseResponse(response.body());
            if (text == null || text.isBlank()) {
                lastStatus = status("UNAVAILABLE", "EMPTY_RESPONSE", "Z.ai returned an empty message");
                openCircuit();
                log.warn("Z.ai AI completion returned an empty message: {}", truncate(response.body()));
                return Optional.empty();
            }
            lastStatus = status("HEALTHY", null, null);
            return Optional.of(new LlmResult(text.trim(), "zai", modelId));
        } catch (Exception exception) {
            lastStatus = status("UNAVAILABLE", "REQUEST_FAILED", exception.getMessage());
            openCircuit();
            log.warn("Z.ai AI completion failed, falling back to deterministic response: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public AiDtos.AiProviderStatus providerStatus() {
        return lastStatus;
    }

    private String requestBody(AiPrompt prompt) {
        return write(Map.of(
                "model", modelId,
                "temperature", temperature,
                "max_tokens", maxOutputTokens,
                "stream", false,
                "thinking", Map.of("type", "disabled"),
                "messages", List.of(
                        Map.of("role", "system", "content", prompt.systemPrompt()),
                        Map.of("role", "user", "content", userPayload(prompt)))));
    }

    private String userPayload(AiPrompt prompt) {
        return """
                User message:
                %s

                Retrieved UniBus context JSON:
                %s
                """.formatted(prompt.userMessage(), write(prompt.context()));
    }

    private String parseResponse(String responseBody) {
        JsonNode root = read(responseBody);
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            JsonNode first = choices.get(0);
            String content = first.path("message").path("content").asText("");
            if (!content.isBlank()) {
                return content;
            }
            String reasoningContent = first.path("message").path("reasoning_content").asText("");
            if (!reasoningContent.isBlank()) {
                return reasoningContent;
            }
            String text = first.path("text").asText("");
            if (!text.isBlank()) {
                return text;
            }
        }
        String outputText = root.path("output_text").asText("");
        if (!outputText.isBlank()) {
            return outputText;
        }
        JsonNode output = root.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (content.isArray()) {
                    for (JsonNode block : content) {
                        String text = block.path("text").asText("");
                        if (!text.isBlank()) {
                            return text;
                        }
                    }
                }
            }
        }
        return "";
    }

    private String normalizeBaseUrl(String candidate) {
        String value = candidate == null || candidate.isBlank()
                ? "https://api.z.ai/api/paas/v4/"
                : candidate.trim();
        return value.endsWith("/") ? value : value + "/";
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private String windowsUserEnv(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        String osName = System.getProperty("os.name", "").toLowerCase();
        if (!osName.contains("win")) {
            return "";
        }
        try {
            Process process = new ProcessBuilder("reg", "query", "HKCU\\Environment", "/v", name)
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(3, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return "";
            }
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            for (String line : output.split("\\R")) {
                String trimmed = line.trim();
                if (!trimmed.startsWith(name)) {
                    continue;
                }
                String[] parts = trimmed.split("\\s+", 3);
                if (parts.length == 3) {
                    return parts[2].trim();
                }
            }
        } catch (Exception ignored) {
            return "";
        }
        return "";
    }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to serialize Z.ai payload", exception);
        }
    }

    private JsonNode read(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to parse Z.ai payload", exception);
        }
    }

    private AiDtos.AiProviderStatus status(String status, String errorCode, String message) {
        return new AiDtos.AiProviderStatus("zai", modelId, status, errorCode, message);
    }

    private void openCircuit() {
        circuitOpenUntil = Instant.now().plusSeconds(45);
    }

    private ProviderError providerError(String responseBody) {
        try {
            JsonNode error = read(responseBody).path("error");
            String code = error.path("code").asText("HTTP_ERROR");
            String message = error.path("message").asText("Z.ai request failed");
            return new ProviderError(code, message);
        } catch (RuntimeException exception) {
            return new ProviderError("HTTP_ERROR", truncate(responseBody));
        }
    }

    private String truncate(String value) {
        if (value == null || value.isBlank()) {
            return "<empty>";
        }
        String singleLine = value.replaceAll("\\s+", " ").trim();
        return singleLine.length() <= 800 ? singleLine : singleLine.substring(0, 800) + "...";
    }

    private record ProviderError(String code, String message) {
    }
}
