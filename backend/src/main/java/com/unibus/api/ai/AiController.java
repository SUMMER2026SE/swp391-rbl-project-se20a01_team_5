package com.unibus.api.ai;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * AI endpoints for REQ-STU-016 (route suggestions) and REQ-STU-017 (chatbot).
 *
 * <p>Both features are implemented as rule-based services (no LLM dependency)
 * to keep the build self-contained. The chatbot persists each turn to
 * {@code ai_chat_history} so {@code GET /api/v1/students/me/assistant-chat}
 * (already implemented in {@code ExperienceController}) continues to work.
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
    public ApiResponse<List<RouteSuggestionService.RouteSuggestionCard>> suggestRoutes(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody(required = false) RouteSuggestionRequest request) {
        Integer boardingStopId = request == null ? null : request.boardingStopId();
        Integer alightingStopId = request == null ? null : request.alightingStopId();
        String preference = request == null ? null : request.preference();
        List<RouteSuggestionService.RouteSuggestionCard> suggestions =
                routeSuggestionService.suggest(currentUser.userId(), boardingStopId, alightingStopId, preference);
        return ApiResponse.ok("Route suggestions generated", suggestions);
    }

    @PostMapping("/assistant-chat")
    public ApiResponse<ChatbotService.ChatTurn> chat(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ChatRequest request) {
        ChatbotService.ChatTurn turn = chatbotService.respond(currentUser.userId(), request.message());
        return ApiResponse.ok("Chatbot responded", turn);
    }

    public record RouteSuggestionRequest(Integer boardingStopId, Integer alightingStopId,
            @Size(max = 100) String preference) {
    }

    public record ChatRequest(@NotBlank @Size(max = 1000) String message) {
    }
}
