package com.unibus.api.ai;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibus.api.ai.AiLlmService.AiPrompt;
import com.unibus.api.ai.AiLlmService.LlmResult;

import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.InferenceConfiguration;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.Message;
import software.amazon.awssdk.services.bedrockruntime.model.SystemContentBlock;

@Service
public class BedrockAiLlmService implements AiLlmService {

    private static final Logger log = LoggerFactory.getLogger(BedrockAiLlmService.class);

    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final String provider;
    private final String modelId;
    private final int maxOutputTokens;
    private final double temperature;
    private final BedrockRuntimeClient client;

    public BedrockAiLlmService(
            @Value("${app.ai.enabled:false}") boolean enabled,
            @Value("${app.ai.provider:bedrock}") String provider,
            @Value("${app.ai.bedrock.model-id:zai.glm-4.7-flash}") String modelId,
            @Value("${app.aws.region:ap-southeast-1}") String awsRegion,
            @Value("${app.ai.max-output-tokens:1200}") int maxOutputTokens,
            @Value("${app.ai.temperature:0.2}") double temperature) {
        this.objectMapper = new ObjectMapper();
        this.enabled = enabled;
        this.provider = provider == null ? "bedrock" : provider.trim();
        this.modelId = modelId == null || modelId.isBlank() ? "zai.glm-4.7-flash" : modelId.trim();
        this.maxOutputTokens = Math.max(128, maxOutputTokens);
        this.temperature = Math.max(0, Math.min(1, temperature));
        String region = awsRegion == null || awsRegion.isBlank() ? "ap-southeast-1" : awsRegion.trim();
        this.client = BedrockRuntimeClient.builder()
                .region(Region.of(region))
                .build();
    }

    @Override
    public Optional<LlmResult> complete(AiPrompt prompt) {
        if (!enabled || !"bedrock".equalsIgnoreCase(provider)) {
            return Optional.empty();
        }
        try {
            Optional<String> converseText = completeWithConverse(prompt);
            if (converseText.isPresent()) {
                return Optional.of(new LlmResult(converseText.get(), "bedrock", modelId));
            }
            if (!supportsNativeInvoke(modelId)) {
                return Optional.empty();
            }
            String requestBody = isAmazonNova(modelId) ? novaRequest(prompt) : anthropicRequest(prompt);
            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(modelId)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(requestBody))
                    .build();
            String responseBody = client.invokeModel(request).body().asUtf8String();
            String text = isAmazonNova(modelId) ? parseNovaResponse(responseBody) : parseAnthropicResponse(responseBody);
            if (text == null || text.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(new LlmResult(text.trim(), "bedrock", modelId));
        } catch (RuntimeException exception) {
            log.warn("Bedrock AI completion failed, falling back to deterministic response: {}", exception.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> completeWithConverse(AiPrompt prompt) {
        try {
            ConverseRequest request = ConverseRequest.builder()
                    .modelId(modelId)
                    .system(SystemContentBlock.builder().text(prompt.systemPrompt()).build())
                    .messages(Message.builder()
                            .role(ConversationRole.USER)
                            .content(ContentBlock.builder().text(userPayload(prompt)).build())
                            .build())
                    .inferenceConfig(InferenceConfiguration.builder()
                            .maxTokens(maxOutputTokens)
                            .temperature((float) temperature)
                            .build())
                    .build();
            ConverseResponse response = client.converse(request);
            StringBuilder text = new StringBuilder();
            if (response.output() != null && response.output().message() != null) {
                for (ContentBlock block : response.output().message().content()) {
                    if (block.text() != null && !block.text().isBlank()) {
                        text.append(block.text()).append('\n');
                    }
                }
            }
            String value = text.toString().trim();
            return value.isBlank() ? Optional.empty() : Optional.of(value);
        } catch (RuntimeException exception) {
            log.debug("Bedrock Converse completion failed, trying native InvokeModel if supported: {}",
                    exception.getMessage());
            return Optional.empty();
        }
    }

    private String anthropicRequest(AiPrompt prompt) {
        return write(Map.of(
                "anthropic_version", "bedrock-2023-05-31",
                "max_tokens", maxOutputTokens,
                "temperature", temperature,
                "system", prompt.systemPrompt(),
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(Map.of(
                                "type", "text",
                                "text", userPayload(prompt)))))));
    }

    private String novaRequest(AiPrompt prompt) {
        return write(Map.of(
                "schemaVersion", "messages-v1",
                "system", List.of(Map.of("text", prompt.systemPrompt())),
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(Map.of("text", userPayload(prompt))))),
                "inferenceConfig", Map.of(
                        "maxTokens", maxOutputTokens,
                        "temperature", temperature)));
    }

    private String userPayload(AiPrompt prompt) {
        return """
                User message:
                %s

                Retrieved UniBus context JSON:
                %s
                """.formatted(prompt.userMessage(), write(prompt.context()));
    }

    private boolean supportsNativeInvoke(String candidateModelId) {
        return isAmazonNova(candidateModelId) || isAnthropic(candidateModelId);
    }

    private boolean isAmazonNova(String candidateModelId) {
        return candidateModelId != null
                && (candidateModelId.startsWith("amazon.nova")
                        || candidateModelId.startsWith("us.amazon.nova")
                        || candidateModelId.startsWith("global.amazon.nova"));
    }

    private boolean isAnthropic(String candidateModelId) {
        return candidateModelId != null
                && (candidateModelId.startsWith("anthropic.")
                        || candidateModelId.startsWith("us.anthropic.")
                        || candidateModelId.startsWith("global.anthropic."));
    }

    private String parseAnthropicResponse(String responseBody) {
        JsonNode root = read(responseBody);
        JsonNode content = root.path("content");
        if (content.isArray()) {
            for (JsonNode item : content) {
                String text = item.path("text").asText("");
                if (!text.isBlank()) {
                    return text;
                }
            }
        }
        return "";
    }

    private String parseNovaResponse(String responseBody) {
        JsonNode root = read(responseBody);
        JsonNode content = root.path("output").path("message").path("content");
        if (content.isArray()) {
            for (JsonNode item : content) {
                String text = item.path("text").asText("");
                if (!text.isBlank()) {
                    return text;
                }
            }
        }
        return "";
    }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to serialize AI payload", exception);
        }
    }

    private JsonNode read(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to parse AI payload", exception);
        }
    }
}
