package com.unibus.api.ai;

import java.util.List;
import java.util.Optional;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Primary
@Service
public class ConfiguredAiLlmService implements AiLlmService {

    private final List<AiLlmService> providers;

    public ConfiguredAiLlmService(ZaiAiLlmService zaiAiLlmService, BedrockAiLlmService bedrockAiLlmService) {
        this.providers = List.of(zaiAiLlmService, bedrockAiLlmService);
    }

    @Override
    public Optional<LlmResult> complete(AiPrompt prompt) {
        return providers.stream()
                .map(provider -> provider.complete(prompt))
                .flatMap(Optional::stream)
                .findFirst();
    }
}
