package com.unibus.api.ai;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Primary
@Service
public class ConfiguredAiLlmService implements AiLlmService {

    private final List<AiLlmService> providers;
    private volatile AiDtos.AiProviderStatus lastStatus =
            new AiDtos.AiProviderStatus("configured", "", "UNKNOWN", null, null);

    public ConfiguredAiLlmService(
            ZaiAiLlmService zaiAiLlmService,
            BedrockAiLlmService bedrockAiLlmService,
            @Value("${app.ai.provider:zai}") String provider) {
        String preferred = provider == null ? "zai" : provider.trim().toLowerCase();
        this.providers = "bedrock".equals(preferred)
                ? List.of(bedrockAiLlmService, zaiAiLlmService)
                : List.of(zaiAiLlmService, bedrockAiLlmService);
    }

    @Override
    public Optional<LlmResult> complete(AiPrompt prompt) {
        for (AiLlmService provider : providers) {
            Optional<LlmResult> result = provider.complete(prompt);
            lastStatus = provider.providerStatus();
            if (result.isPresent()) {
                return result;
            }
        }
        return Optional.empty();
    }

    @Override
    public AiDtos.AiProviderStatus providerStatus() {
        return lastStatus;
    }
}
