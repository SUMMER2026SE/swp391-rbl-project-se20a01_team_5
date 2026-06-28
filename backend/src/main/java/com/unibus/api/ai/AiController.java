package com.unibus.api.ai;

import java.util.concurrent.CompletableFuture;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.unibus.api.ai.AiDtos.ChatRequest;
import com.unibus.api.ai.AiDtos.ChatResponse;
import com.unibus.api.ai.AiDtos.RouteSuggestionCard;
import com.unibus.api.ai.AiDtos.RouteSuggestionRequest;
import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

/**
 * Student AI endpoints. The backend retrieves DB context through whitelisted
 * read-only tools before asking the configured LLM to explain the result.
 */
@RestController
@RequestMapping("/api/v1/students/me")
@PreAuthorize("hasRole('STUDENT')")
public class AiController {

    private final RouteSuggestionService routeSuggestionService;
    private final ChatbotService chatbotService;

    public AiController(RouteSuggestionService routeSuggestionService, ChatbotService chatbotService) {
        this.routeSuggestionService = routeSuggestionService;
        this.chatbotService = chatbotService;
    }

    @PostMapping("/route-suggestions")
    public ApiResponse<java.util.List<RouteSuggestionCard>> suggestRoutes(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody(required = false) RouteSuggestionRequest request) {
        return ApiResponse.ok("Route suggestions generated", routeSuggestionService.suggest(currentUser.userId(), request));
    }

    @PostMapping("/assistant-chat")
    public ApiResponse<ChatResponse> chat(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ChatRequest request) {
        return ApiResponse.ok("Chatbot responded", chatbotService.respond(currentUser.userId(), request));
    }

    @PostMapping(value = "/assistant-chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ChatRequest request) {
        SseEmitter emitter = new SseEmitter(90_000L);
        CompletableFuture.runAsync(() -> {
            try {
                chatbotService.respondStream(currentUser.userId(), request, (eventName, event) -> {
                    try {
                        emitter.send(SseEmitter.event().name(eventName).data(event));
                    } catch (Exception exception) {
                        throw new IllegalStateException("Unable to send AI stream event", exception);
                    }
                });
                emitter.complete();
            } catch (Exception exception) {
                emitter.completeWithError(exception);
            }
        });
        return emitter;
    }
}
