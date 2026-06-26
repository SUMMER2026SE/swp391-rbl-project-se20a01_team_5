package com.unibus.api.ai;

import java.util.Map;
import java.util.Optional;

public interface AiLlmService {

    Optional<LlmResult> complete(AiPrompt prompt);

    record AiPrompt(String systemPrompt, String userMessage, Map<String, Object> context) {
    }

    record LlmResult(String text, String provider, String modelId) {
    }
}
